import { _decorator, Label, tween, Vec3, v3 } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { AvatarItem } from "db://assets/script/module/seven7/view/AvatarItem";
import { SelfCoinsBar } from '../../common/SelfCoinsBar';

const { ccclass, property } = _decorator;

@ccclass('UIPlayerInfo')
export class UIPlayerInfo extends GameComponent {
    @property(AvatarItem)
    private avatar: AvatarItem;
    @property(SelfCoinsBar)
    private selfCoinsBar: SelfCoinsBar; 
    @property(Label)
    private moneyAddLabel: Label;

    private startPos:Vec3 = null;
    private endPos:Vec3 = null;

    start(): void {
        this.refresh_self_info();
        this.startPos = v3(this.moneyAddLabel.node.position.x, this.moneyAddLabel.node.position.y);
        this.endPos = v3(this.moneyAddLabel.node.position.x, this.moneyAddLabel.node.position.y + 75);
    }

    refresh_self_coins() {
        this.selfCoinsBar.refresh_coins_value();
    }

    refresh_self_info(): void {
        //this.updateMoney();
       this.avatar.initSelf();
       this.refresh_coins_icon();
       this.selfCoinsBar.refresh_coins_value();
    }

    show_coins_add_by_win(addNum: number): void {
        this.selfCoinsBar.refresh_coins_value();
        this.moneyAddLabel.string = "+" + addNum;
        this.moneyAddLabel.node.active = true;
        tween(this.moneyAddLabel.node)
            .to(1, { position: this.endPos }, { easing: 'quadOut' })
            .call(() => {
                this.moneyAddLabel.node.active = false;
                this.moneyAddLabel.node.position = this.startPos;
            })
            .start();
    }

    refresh_coins_icon() {
        this.selfCoinsBar.refresh_coins_icon_by_url();
    }
}




