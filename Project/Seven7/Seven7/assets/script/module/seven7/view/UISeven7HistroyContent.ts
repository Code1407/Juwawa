import { _decorator, Node, Sprite, Vec3, v3, tween } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { GameEvent } from '../../common/GameEvent';
import { BundleName } from '../../../framework/commom/FrameDefine';
import { find } from 'cc';
import GameModelMgr from '../../mvc/GameModelMgr';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';

const { ccclass, property } = _decorator;

@ccclass('UISeven7HistroyContent')
export class UISeven7HistroyContent extends GameComponent {
    @property(Node)
    private newIcon: Node;

    private items: Node[] = [];
    private offsetPosX: number = 74.8;
    private pushRewards: number[] = [];
    private itemsPos: number[] = [];

    private itemIndex:number[] = [];

    needRefesh:boolean = true;

    private _gameHide = false;

    private timeId = null;

    onLoad(): void {
        let root = find("itemsMask/itemRoot", this.node);
        for (let i = 0; i < root.children.length; i++) {
            this.items.push(root.children[i]);
            // this.itemsPos.push(root.children[i].position.x);
            // this.itemIndex.push(i);
        }
    }

    start() {
        this.setGameShow();
        this.setGameHide();
        this.on(EventMessage.GAME_NET_CONNECT, this.req_lately_history, this);
        this.on(GameEvent.MSG_SHOW_GAME_LATELY_HISTORY, this.show_lately_history_init, this);
        this.on(GameEvent.MSG_SHOW_GAME_LATELY_HISTORY_PUSH, this.show_lately_history_push, this);
        
        this.req_lately_history();
    }

    protected onGameShow(): void {
        //this.reset_item_pos();
        GameModelMgr.seven7Model.cs_game_lately_history_req();
        this._gameHide = false;  
    }

    protected onGameHide(): void {
        this._gameHide = true;
    }

    req_lately_history(){
        GameModelMgr.seven7Model.cs_game_lately_history_req();
    }

    reset_item_pos(){
        for (let i = 0; i < this.items.length; i++){
            this.items[i].position = v3(this.itemsPos[i], 0);
        }
    }

    show_lately_history_init(event: string, args: any){
        if(args){
            if(this.timeId){
                clearTimeout(this.timeId);
            }
            let msg = args as CsGameLatelyHistoryResp;
            if (msg != null && msg.list != null && Object.keys(msg.list).length > 0 && msg.list.length > 0){
                this.show_view_static(msg.list);
            }
        }
    }


    show_lately_history_push(event: string, args: any){
        let msg = args as ScGameLatelyHistoryPush; 
        if(this._gameHide || !msg){
            return;
        }
        
        let dt = 6000;
        if(msg.jpRewardCount = 1){
            dt = 7000;
        }else if(msg.jpRewardCount = 1){
            dt = 7500;
        }

        if(this.timeId){
            clearTimeout(this.timeId);
        }

        this.timeId = setTimeout(() => {
            clearTimeout(this.timeId);
            if(this._gameHide){
                return;
            }
            if(args){
                if (msg != null && msg.list != null && Object.keys(msg.list).length > 0 && msg.list.length > 0){
                    this.show_view_static(msg.list)
                }
            }          
        }, dt);
    }



    show_view_static(list: number[]){
        for (let i = 0; i < list.length; i++){
            let rewardId = list[i];
            const rewardPath = `texture/atlas/main/reward_${rewardId}`;
            let item = this.items[i];
            let icon = item.getComponent(Sprite);
            super.setSprite(icon, rewardPath, BundleName.SkinDefault);
            item.active = true;
        }
    }

    show_add_item(newRewardID){
        let newId = this.itemIndex.pop();
        const rewardPath = `texture/atlas/main/reward_${newRewardID}`;
        let newItem = find("itemsMask/itemRoot/Item"+newId, this.node);
        if(newItem){
            let icon = newItem.getComponent(Sprite);
            super.setSprite(icon, rewardPath, BundleName.SkinDefault);
            newItem.active = true;

            this.itemIndex.unshift(newId);
            this.playInsertAnimation();
        }
    }

    // show_game_history_by_server(event: string, args: any) {
    //     if(!this.needRefesh){
    //         return;
    //     }
    //     let msg = args as CsGameHistoryResp;
    //     this.pushRewards = [];
    //     if (msg != null && msg.list != null && Object.keys(msg.list).length > 0 && msg.list.length > 0) {
    //         let showCount = 0;
    //         this.newIcon.active = true;
    //         for (let i = args.list.length - 1; i >= 0; i--) {
    //             if (showCount < 9) {
    //                 let rewardId = args.list[i].resultID;
    //                 this.pushRewards.push(rewardId);
    //                 showCount++;
    //             }
    //         }
    //         this.showRewards();
    //         this.needRefesh = false;
    //         return;
    //     }
    //     this.newIcon.active = false;
    // }

    // show_game_history_by_client() {
    //     this.showRewards();
    // }

    add_reward_items(addRewardId: number){
        if(addRewardId && addRewardId > 0){

        }
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
}


