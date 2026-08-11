// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NoticeView extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    static instance: NoticeView = null;

    static get Instance(): NoticeView{
        if (!NoticeView.instance) this.instance = cc.find("Canvas/Views/NoticeView").getComponent(NoticeView);
        return NoticeView.instance;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    protected onEnable(): void {
        this.node.opacity = 0;
        cc.tween(this.node)
            .to(0.5, {opacity: 220})
            .to(0.1, {opacity: 180})
            .to(0.2, {opacity: 220})
            .to(0.2, {opacity: 180})
            .to(0.2, {opacity: 220})
            .call(()=>{
                cc.tween(this.node)
                    .delay(0.5)
                    .to(0.5, {opacity: 0})
                    .call(()=>{
                        this.node.active = false;
                    })
                    .start();
            })
           .start();
    }
    // update (dt) {}
}
