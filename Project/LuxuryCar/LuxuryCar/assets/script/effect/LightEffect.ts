// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class LightEffect {

    constructor(private items: Array<cc.Node>, betTimer: cc.Node) {
        items.forEach(item => {
            for (let i = 0; i < item.childrenCount; ++i) {
                // item.children[i].addComponent(ColorChange);
                console.log(i);
                
            }
        });
        // this.effTimer = betTimer.addComponent(TimerEffect);
        // salad.addComponent(ColorChange);
        // pizza.addComponent(ColorChange);
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
