// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    onClick(){
    console.log(33333);

    }
    start () {
        this.node.on(cc.Node.EventType.TOUCH_START, () => {
            
                this.node.scaleX = this.node.scaleY = 1.2; // this.dark(); 
            
        });
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this.node.scaleX = this.node.scaleY = 1; // this.recover();
        });
    }

    // update (dt) {}
}
