type AvatarCallback = (error: any, frame?: cc.SpriteFrame) => void;

/** 全游戏共享的远程头像缓存：按 URL 复用 SpriteFrame，并合并同 URL 的并发请求。 */
export default class AvatarCache {
    private static readonly maxLoads = 6;
    private static readonly maxCached = 256;
    private static frames: { [url: string]: cc.SpriteFrame } = {};
    private static cacheOrder: string[] = [];
    private static pending: { [url: string]: AvatarCallback[] } = {};
    private static queue: (() => void)[] = [];
    private static loading = 0;

    static normalize(rawUrl: string): string {
        let url = String(rawUrl || "").trim();
        for (let i = 0; i < 2 && url; i++) {
            try {
                const decoded = decodeURI(url);
                if (decoded === url) break;
                url = decoded;
            } catch (_) {
                break;
            }
        }
        return url;
    }

    static get(rawUrl: string): cc.SpriteFrame {
        const url = this.normalize(rawUrl);
        const frame = this.frames[url] || null;
        if (frame) this.touch(url);
        return frame;
    }

    static load(rawUrl: string, callback: AvatarCallback): void {
        const url = this.normalize(rawUrl);
        if (!url) {
            callback(new Error("avatar url is empty"));
            return;
        }
        const cached = this.frames[url];
        if (cached) {
            this.touch(url);
            callback(null, cached);
            return;
        }
        if (this.pending[url]) {
            this.pending[url].push(callback);
            return;
        }

        this.pending[url] = [callback];
        this.enqueue(() => {
            cc.loader.load({ url, type: "image" }, (error, texture) => {
                let frame: cc.SpriteFrame = null;
                if (!error && texture) {
                    frame = new cc.SpriteFrame(texture);
                    this.store(url, frame);
                }
                const callbacks = this.pending[url] || [];
                delete this.pending[url];
                this.loading = Math.max(0, this.loading - 1);
                this.pump();
                callbacks.forEach(cb => cb(error || (!frame ? new Error("avatar texture is empty") : null), frame));
            });
        });
    }

    private static enqueue(task: () => void): void {
        this.queue.push(task);
        this.pump();
    }

    private static store(url: string, frame: cc.SpriteFrame): void {
        this.frames[url] = frame;
        this.touch(url);
        while (this.cacheOrder.length > this.maxCached) {
            const expired = this.cacheOrder.shift();
            if (expired) delete this.frames[expired];
        }
    }

    private static touch(url: string): void {
        const index = this.cacheOrder.indexOf(url);
        if (index >= 0) this.cacheOrder.splice(index, 1);
        this.cacheOrder.push(url);
    }

    private static pump(): void {
        while (this.loading < this.maxLoads && this.queue.length > 0) {
            this.loading++;
            this.queue.shift()();
        }
    }
}
