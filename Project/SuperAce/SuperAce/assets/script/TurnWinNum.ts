// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class TurnWinNum extends cc.Component {

    @property(cc.Label)
    winNumLabel: cc.Label = null;

    @property(cc.ParticleSystem)
    particle: cc.ParticleSystem = null;

    onEliminate(winNum: number) {
        if (winNum == 0) return;
        this.node.active = true;
        this.node.opacity = 255;
        this.winNumLabel.string = winNum.toString();
        this.particle.resetSystem();
        cc.tween(this.winNumLabel.node)
            .to(0.3, { scale: 0.7 })
            .to(0.05, { scale: 1.2 })
            .to(0.1, { scale: 1 })
            .call(() => {
                this.particle.stopSystem();
                cc.tween(this.node)
                    .to(0.5, { opacity: 0 })
                    .call(() => {
                        this.node.active = false;
                    })
                    .start();
            })
            .start();
    }

    // update (dt) {}
}
