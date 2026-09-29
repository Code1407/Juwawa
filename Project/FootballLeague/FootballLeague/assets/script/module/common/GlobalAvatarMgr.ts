import { _decorator, ImageAsset, isValid, SpriteFrame, Texture2D } from 'cc';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { oops } from 'db://oops-framework/core/Oops';
const { ccclass } = _decorator;

interface AvatarLoadTask {
    avatarId: string;
    loadUrl: string;
    key: string;
}

@ccclass('GlobalAvatarMgr')
export class GlobalAvatarMgr {
    private loadMaxSameTime: number = 5;
    private cacheMap: Map<string, SpriteFrame> = new Map();
    private cacheRefMap: Map<string, { frame: SpriteFrame, texture: Texture2D, source: ImageAsset }> = new Map();
    private taskQueue: AvatarLoadTask[] = [];
    private queuedTaskMap: Map<string, boolean> = new Map();
    private loadingTaskMap: Map<string, boolean> = new Map();
    private curLoadingCount: number = 0;


    private getTaskKey(avatarId: string, loadUrl: string): string {
        return `${avatarId}|${loadUrl}`;
    }


    private hasTask(key: string): boolean {
        return this.queuedTaskMap.has(key) || this.loadingTaskMap.has(key);
    }

    private scheduleNextTask() {
        while (this.curLoadingCount < this.loadMaxSameTime && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            this.queuedTaskMap.delete(task.key);

            if (this.cacheMap.has(task.avatarId) || this.loadingTaskMap.has(task.key)) {
                continue;
            }

            this.curLoadingCount++;
            this.loadingTaskMap.set(task.key, true);
            this.startTask(task);
        }
    }

    private startTask(task: AvatarLoadTask) {
        oops.res.loadRemote(task.loadUrl, { ext: '.png' }, (error: Error | null, imageAsset: ImageAsset | null) => {
            this.finishTask(task);

            if (error || !imageAsset || this.cacheMap.has(task.avatarId)) {
                return;
            }

            const texture = new Texture2D();
            texture.image = imageAsset;
            const sp = new SpriteFrame();
            sp.texture = texture;
            sp.addRef();
            texture.addRef();
            imageAsset.addRef();

            this.cacheMap.set(task.avatarId, sp);
            this.cacheRefMap.set(task.avatarId, { frame: sp, texture, source: imageAsset });
            oops.message.dispatchEvent(EventMessage.GAME_AVATAR_LOAD_SUC, { avatarId: task.avatarId });
        });
    }

    private finishTask(task: AvatarLoadTask) {
        this.loadingTaskMap.delete(task.key);
        this.curLoadingCount = Math.max(0, this.curLoadingCount - 1);
        this.scheduleNextTask();
    }

    addLoadAvatarTask(avatarId: string, loadUrl: string) {
        if (!avatarId || !loadUrl || this.cacheMap.has(avatarId)) {
            return;
        }

        const taskKey = this.getTaskKey(avatarId, loadUrl);
        if (this.hasTask(taskKey)) {
            return;
        }

        this.queuedTaskMap.set(taskKey, true);
        this.taskQueue.push({
            avatarId,
            loadUrl,
            key: taskKey
        });
        this.scheduleNextTask();
    }

    getAvatarSp(avatarId: string, loadUrl?: string): SpriteFrame | null {
        const sp = this.cacheMap.get(avatarId) ?? null;
        if (sp == null && loadUrl) {
            this.addLoadAvatarTask(avatarId, loadUrl);
        }
        return sp;
    }

    clear() {
        this.cacheRefMap.forEach((ref) => {
            if (ref.frame && isValid(ref.frame)) {
                ref.frame.decRef();
            }
            if (ref.texture && isValid(ref.texture)) {
                ref.texture.decRef();
            }
            if (ref.source && isValid(ref.source)) {
                ref.source.decRef();
            }
        });
        this.cacheMap.clear();
        this.cacheRefMap.clear();
        this.taskQueue.length = 0;
        this.queuedTaskMap.clear();
        this.loadingTaskMap.clear();
        this.curLoadingCount = 0;
    }
}
