const { ccclass, property } = cc._decorator;
@ccclass
export default class CheckMark extends cc.Component {
    @property(cc.Node)
    isOn: cc.Node = null;
    @property(cc.Node)
    isOff: cc.Node = null;
    @property(cc.Node)
    isSelect: cc.Node = null;
    @property(cc.Node)
    status: cc.Node[] = [];
    
    SetStaus(index: number) {/**0未来式 1选中 2过去式 3高亮*/
        this.status.forEach(element => {
            element.active = false;
        });
        if (this.status.length > 0) {
            this.status[index % this.status.length].active = true;
        }
    }
}
