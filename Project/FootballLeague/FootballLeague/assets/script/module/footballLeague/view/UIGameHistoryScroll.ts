import { _decorator, Node, tween, Vec3, Sprite, isValid, Tween } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { GameEvent } from '../../common/GameEvent';
import { BundleName } from '../../../framework/commom/FrameDefine';
import { find } from 'cc';
import { v3 } from 'cc';
import GameModelMgr from '../../mvc/GameModelMgr';
const { ccclass, property } = _decorator;

@ccclass('UIGameHistoryScroll')
export class UIGameHistoryScroll extends GameComponent {
    @property(Node)
    private newIcon: Node;

    private items: Node[] = [];
    private pushRewards: number[] = [];
    private historyList: GameResultData[] = [];
    private latestOpenReward: ScOpenRewardPush = null;
    private refreshVersion: number = 0;

    private offsetPosX: number = 97;
    needRefesh:boolean = true;

    onLoad() {
        let root = find("goods/root", this.node);
        for (let i = 0; i < root.children.length; i++) {
            this.items.push(root.children[i]);
        }

        this.on(GameEvent.MSG_SHOW_GAME_HISTORY, this.show_game_history_by_server, this);
        this.on(GameEvent.MSG_SCENE_CHANGE, this.on_scene_change, this);
    }

    show_game_history_by_server(event: string, args: CsGameHistoryResp) {
        if(!this.needRefesh){
            return;
        }
        this.historyList = args && args.list || [];
        this.refresh_history_rewards();
    }

    public set_latest_open_reward(msg: ScOpenRewardPush) {
        this.latestOpenReward = msg;
    }

    private refresh_history_rewards() {
        this.pushRewards = [];
        const historyList = this.get_history_list_with_latest();
        if (historyList != null && historyList.length > 0) {
            let showCount = 0
            this.newIcon.active = true;
            for (let i = historyList.length - 1; i >= 0; i--) {
                if (showCount < 8) {
                    let rewardId = GameModelMgr.footballLeagueModel.get_game_result_zhuanpan_id(historyList[i]);
                    if (rewardId) {
                        this.pushRewards.push(rewardId);
                        showCount++;
                    }

                }
            }
            this.show_rewards();
            this.needRefesh = false;
            return;
        }
        this.newIcon.active = false;
        this.show_rewards();
    }

    private get_history_list_with_latest(): Array<GameResultData | ScOpenRewardPush> {
        const list: Array<GameResultData | ScOpenRewardPush> = [];
        if (this.historyList && this.historyList.length > 0) {
            for (let i = 0; i < this.historyList.length; i++) {
                list.push(this.historyList[i]);
            }
        }

        if (this.latestOpenReward) {
            const latestRound = Number(this.latestOpenReward.round || 0);
            let hasLatest = false;
            for (let i = 0; i < list.length; i++) {
                if (Number(list[i].round || 0) == latestRound) {
                    hasLatest = true;
                    break;
                }
            }
            if (!hasLatest) {
                list.push(this.latestOpenReward);
            }
        }
        return list;
    }

    show_game_history_by_client() {
        this.refresh_history_rewards();
    }

    async show_rewards() {
        const version = ++this.refreshVersion;
        this.reset_item_layout();
        const showCount = Math.min(this.pushRewards.length, this.items.length);
        for (let i = 0; i < this.items.length; i++) {
            if (i >= showCount) {
                this.items[i].active = false;
            }
        }
        for (let i = 0; i < showCount; i++) {
            let rewardId = this.pushRewards[i];
            const rewardPath = `PlistImage/TeamImage${GameModelMgr.footballLeagueModel.get_team_id() || 1}/qd_${rewardId}`;   //对应得场景
            let item = this.items[i];
            let iconNode = find("icon", item);
            let icon = iconNode && iconNode.getComponent(Sprite);
            if (!icon) {
                continue;
            }
            item.active = true;
            await super.setSprite(icon, rewardPath, BundleName.SkinDefault);
            if (version != this.refreshVersion || !isValid(item) || !isValid(icon)) {
                return;
            }
        }
    }

    open_rewards(newRewardID: number) {
        if (!newRewardID) {
            return;
        }
        this.pushRewards.pop();
        this.pushRewards.unshift(newRewardID);
    }

    async update_items(zhuanpanId: number) {
        if (!zhuanpanId) {
            return;
        }
        let newItem = this.items[this.items.length - 1];
        if (!newItem) {
            return;
        }
        const rewardPath = `PlistImage/TeamImage${GameModelMgr.footballLeagueModel.get_team_id() || 1}/qd_${zhuanpanId}`;   //对应得场景
        let iconNode = find("icon", newItem);
        let icon = iconNode && iconNode.getComponent(Sprite);
        if (!icon) {
            return;
        }
        Tween.stopAllByTarget(newItem);
        const version = ++this.refreshVersion;
        await super.setSprite(icon, rewardPath, BundleName.SkinDefault);
        if (version != this.refreshVersion || !isValid(newItem) || !isValid(icon) || !icon.spriteFrame) {
            this.reset_item_layout();
            return;
        }
        const itemIndex = this.items.indexOf(newItem);
        if (itemIndex < 0) {
            this.reset_item_layout();
            return;
        }
        this.items.splice(itemIndex, 1);
        newItem.setPosition(new Vec3(-39.6, 0, 0));
        newItem.active = true;
        this.items.unshift(newItem);
        this.sync_sibling_index();
        this.playInsertAnimation();
        this.open_rewards(zhuanpanId);
    }

    private on_scene_change() {
        this.refresh_history_rewards();
    }

    private playInsertAnimation() {
        // 新图标从左侧移入
        Tween.stopAllByTarget(this.items[0]);
        tween(this.items[0])
            .to(0.5, { position: this.get_item_pos(0) }, { easing: 'linear' })
            .call(() => {
                if (this.newIcon.active == false) {
                    this.newIcon.active = true;
                }
            })
            .start();

        // 现有图标向右移动
        for (let i = 1; i < this.items.length; i++) {
            Tween.stopAllByTarget(this.items[i]);
            const targetPos = this.get_item_pos(i);
            tween(this.items[i])
                .to(0.5, { position: targetPos }, { easing: 'linear' })
                .start();
        }
    }

    private get_item_pos(index: number): Vec3 {
        return v3(index * this.offsetPosX + 42, 0, 0);
    }

    private reset_item_layout() {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (!isValid(item) || !item.parent || !isValid(item.parent)) {
                continue;
            }
            Tween.stopAllByTarget(item);
            item.setPosition(this.get_item_pos(i));
            item.setSiblingIndex(i);
        }
    }

    private sync_sibling_index() {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (isValid(item) && item.parent && isValid(item.parent)) {
                item.setSiblingIndex(i);
            }
        }
    }

}
