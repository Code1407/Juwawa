// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;
@ccclass
export default class CheckMark extends cc.Component {
    @property(cc.Node)
    isOn: cc.Node;
    @property(cc.Node)
    isOff: cc.Node;
    @property(cc.Node)
    isSelect: cc.Node;
    @property(cc.Node)
    status: cc.Node[] = [];
    // TurnOn() {
    //     this.isOff.active = false;
    //     this.isSelect.active = false;
    //     this.isOn.active = true;
    // }
    // Select() {
    //     this.isOn.active = false;
    //     this.isOff.active = false;
    //     this.isSelect.active = true;
    // }
    // TurnOff() {
    //     this.isOn.active = false;
    //     this.isSelect.active = false;
    //     this.isOff.active = true;
    // }
    SetStaus(index: number) {
        this.status.forEach(element => {
            element.active = false;
        });
        if (this.status.length > 0) {
            this.status[index % this.status.length].active = true;
        }
    }
}
