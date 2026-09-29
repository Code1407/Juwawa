import { _decorator, Node, Button, find, Label, Sprite, SpriteFrame } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { Utils } from '../../../framework/utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('UIChipItem')
export class UIChipItem extends GameComponent {
    @property(Sprite)
    icon_coins: Sprite;

    private selectBg: Node = null;
    private chipLabel: Label = null;
    private clickFunc: Function = null;

    private chipValue: number = 0;
    private gearIndex: number = 1;

    onLoad(): void {
        this.selectBg = find("select", this.node)
        this.chipLabel = find("chipNum", this.node).getComponent(Label);

        let btn = this.node.getComponent(Button);
        btn.node.on(Node.EventType.TOUCH_START, this.onClickBtn.bind(this))
    }

    init(chipValue, gearIndex, isSelect: boolean, func: Function) {
        if (chipValue == null || chipValue <= 0) {
            return;
        }
        this.chipValue = chipValue;
        this.gearIndex = gearIndex;
        this.clickFunc = func;
        this.chipLabel.string = Utils.simplifyNumber(chipValue);
        this.update_select(isSelect);
    }

    get_chip_value(): number {
        return this.chipValue;
    }

    update_select(isSelect: boolean) {
        this.selectBg.active = isSelect;
    }

    show_conis_icon(coinsSp: SpriteFrame) {
        if (coinsSp) {
            this.icon_coins.spriteFrame = coinsSp;
        }
    }

    private onClickBtn() {
        if (this.clickFunc && typeof this.clickFunc === 'function') {
            this.clickFunc(this.chipValue, this.gearIndex);
        }
    }
}


