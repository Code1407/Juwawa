// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html


const { ccclass, property } = cc._decorator;

@ccclass
export class AutoGameCoin extends cc.Component {
    @property(cc.Sprite)
    spAry: cc.Sprite[] = [];
    @property(cc.ParticleSystem)
    fxAry: cc.ParticleSystem[] = [];
    protected start(): void {
        let repeat = cc.tween(<AutoGameCoin>this).repeatForever(cc.tween(<AutoGameCoin>this).delay(0).call(() => {
            let gameCoin = (<any>window).config?.gameCoin;
            if (gameCoin) {
                if (this.spAry.length > 0)
                    this.spAry.forEach(sp => {
                        sp.spriteFrame = gameCoin;
                    });
                if (this.fxAry.length > 0)
                    this.fxAry.forEach(fx => {
                        fx.spriteFrame = gameCoin;
                    });
                repeat.stop();
            }
        })).start();
    }
}
