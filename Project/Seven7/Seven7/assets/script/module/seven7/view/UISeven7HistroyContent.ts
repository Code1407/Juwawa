import { _decorator, Node, Sprite, Vec3, tween } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { GameEvent } from '../../common/GameEvent';
import { BundleName } from '../../../framework/commom/FrameDefine';
import { find } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('UISeven7HistroyContent')
export class UISeven7HistroyContent extends GameComponent {
    @property(Node)
    private newIcon: Node;

    private items: Node[] = [];
    private offsetPosX: number = 74.8;
    private pushRewards: number[] = [];

    needRefesh:boolean = true;

    onLoad(): void {
        let root = find("itemsMask/itemRoot", this.node);
        for (let i = 0; i < root.children.length; i++) {
            this.items.push(root.children[i]);
        }
    }

    start() {
        this.on(GameEvent.MSG_SHOW_GAME_HISTORY, this.show_game_history_by_server, this);
    }

    show_game_history_by_server(event: string, args: any) {
        if(!this.needRefesh){
            return;
        }
        let msg = args as CsGameHistoryResp;
        this.pushRewards = [];
        if (msg != null && msg.list != null && Object.keys(msg.list).length > 0 && msg.list.length > 0) {
            let showCount = 0;
            this.newIcon.active = true;
            for (let i = args.list.length - 1; i >= 0; i--) {
                if (showCount < 9) {
                    let rewardId = args.list[i].resultID;
                    this.pushRewards.push(rewardId);
                    showCount++;
                }
            }
            this.showRewards();
            this.needRefesh = false;
            return;
        }
        this.newIcon.active = false;
    }

    show_game_history_by_client() {
        this.showRewards();
    }

    showRewards() {
        if (this.pushRewards.length > 0) {
            for (let i = 0; i < this.pushRewards.length; i++) {
                let rewardId = this.pushRewards[i];
                const rewardPath = `texture/atlas/main/reward_${rewardId}`;
                let item = this.items[i];
                let icon = item.getComponent(Sprite);
                super.setSprite(icon, rewardPath, BundleName.SkinDefault);
                item.active = true;
            }
        }
    }

    updateItems(newRewardID: number) {
        let newItem = this.items.pop();
        const rewardPath = `texture/atlas/main/reward_${newRewardID}`;
        let icon = newItem.getComponent(Sprite);
        super.setSprite(icon, rewardPath, BundleName.SkinDefault);
        newItem.setPosition(new Vec3(-32.5, 0, 0));
        //this.setItemTrans(newItem, newRewardID);
        newItem.active = true;
        this.items.unshift(newItem);
        this.playInsertAnimation();
        this.openRewards(newRewardID);
    }

    openRewards(newRewardID: number) {
        this.pushRewards.pop();
        this.pushRewards.unshift(newRewardID);
    }

    private playInsertAnimation() {
        // 新图标从左侧移入
        tween(this.items[0])
            .to(0.5, { position: new Vec3(42.75, 0, 0) }, { easing: 'linear' })
            .call(() => {
                if (this.newIcon.active == false) {
                    this.newIcon.active = true;
                }
            })
            .start();

        // 现有图标向右移动
        for (let i = 1; i < this.items.length; i++) {
            const targetPos = new Vec3(i * this.offsetPosX + 42.75, 0, 0);
            tween(this.items[i])
                .to(0.5, { position: targetPos }, { easing: 'linear' })
                .start();
        }
    }

    private setItemTrans(item: Node, rewardId: number) {
        //let pos = item.getPosition();
        let is77 = rewardId === 2;
        if (is77) {
            item.setScale(0.3, 0.3);
            //item.setPosition(pos.x, 2);
        }
        else {
            item.setScale(0.4, 0.4);
            //item.setPosition(pos.x, 0);
        }
    }
}


