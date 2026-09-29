const {ccclass, property} = cc._decorator;

@ccclass
export default class UIResourceItem extends cc.Component {
    @property(cc.Sprite)
    private resIcon: cc.Sprite = null;
    @property(cc.Label)
    private resCount: cc.Label = null;

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
