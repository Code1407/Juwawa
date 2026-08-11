import { _decorator, Sprite, Label } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
const { ccclass, property } = _decorator;

@ccclass('UIResourceItem')
export class UIResourceItem extends GameComponent {
    @property(Sprite)
    private resIcon: Sprite;
    @property(Label)
    private resCount: Label;

    private _resData:ResourceData = null;

    init(resData:ResourceData){
        this._resData = resData;
        if(resData.resCount >= 1000){
            const value = resData.resCount / 1000;
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
            this.resCount.string = formatted + 'k';
        }else{
            this.resCount.string = resData.resCount.toString();
        }
    }

    get_res_data():ResourceData{
        return this._resData;
    }
}


