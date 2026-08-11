import { _decorator, Node, Button, find, EventTouch, SpriteFrame, Sprite } from 'cc';
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { BundleName } from '../../../framework/commom/FrameDefine';
import { Label } from 'cc';
import { Utils } from '../../../framework/utils/Utils';

const { ccclass, property } = _decorator;

@ccclass('UISeven7ChipItem')
export class UISeven7ChipItem extends GameComponent {
    private icon: Sprite = null;
    private selectIcon: Node = null;
    private label: Label = null;

    private clickFunc: Function = null;
    private chipValue: number = 0;
    private chipIndex: number = 1;

    onLoad(): void {
        this.icon = this.node.getComponent(Sprite);
        this.label = find("Label", this.node).getComponent(Label);
        this.selectIcon = find("select", this.node)

        let btn = this.node.getComponent(Button);
        btn.node.on(Node.EventType.TOUCH_START, this.onClickBtn.bind(this))
    }

    init(chipValue, chipIndex, iconPath, isSelect: boolean, func: Function) {
        if (chipValue == null || chipValue <= 0) {
            return;
        }
        this.chipValue = chipValue;
        this.chipIndex = chipIndex;
        this.clickFunc = func;
        super.setSprite(this.icon, iconPath, BundleName.SkinDefault);
        this.label.string = Utils.simplifyNumber(chipValue);
        this.update_select(isSelect)
    }



    get_chip_value(): number {
        return this.chipValue;
    }

    update_select(isSelect: boolean) {
        this.selectIcon.active = isSelect;
    }

    private onClickBtn() {
        if (this.clickFunc && typeof this.clickFunc === 'function') {
            this.clickFunc(this.chipValue, this.chipIndex);
        }
    }
}


