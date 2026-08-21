// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class AutoPlayAll extends cc.Component {
    @property()
    autoPlay = true;
    anims: cc.Animation[] = null;
    sks: sp.Skeleton[] = null;
    fxs: cc.ParticleSystem[] = null;
    protected onEnable(): void {
        if (this.autoPlay) {
            this.Play();
        }
    }
    Play() {
        if (this.anims == null) {
            this.anims = this.getComponentsInChildren(cc.Animation);
        }
        if (this.sks == null) {
            this.sks = this.getComponentsInChildren(sp.Skeleton);
        }
        if (this.fxs == null) {
            this.fxs = this.getComponentsInChildren(cc.ParticleSystem);
        }
        this.anims.forEach(element => {
            element.play();
        });
        this.sks.forEach(element => {
            element.setAnimation(0, element.animation, element.loop);
        });
        this.fxs.forEach(element => {
            element.resetSystem();
        });
    }
    Stop() {
        if (this.anims == null) {
            this.anims = this.getComponentsInChildren(cc.Animation);
        }
        if (this.sks == null) {
            this.sks = this.getComponentsInChildren(sp.Skeleton);
        }
        if (this.fxs == null) {
            this.fxs = this.getComponentsInChildren(cc.ParticleSystem);
        }
        this.anims.forEach(element => {
            element.stop();
        });
        this.sks.forEach(element => {
            element.clearTrack(0);
        });
        this.fxs.forEach(element => {
            element.stopSystem();
        });
    }
}

export function AutoPlay(node: cc.Node) {
    node.getComponentInChildren(AutoPlayAll)?.Play();
}