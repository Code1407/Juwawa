// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import { Vec3 } from 'cc';
import { ParticleSystem2D } from 'cc';
import { tween } from 'cc';
import { ParticleSystem } from 'cc';
import { _decorator, Asset, Label, Sprite, SpriteFrame,Component,Node } from 'cc';


const { ccclass, property } = _decorator;

@ccclass("BigWinView")
export default class BigWinView extends Component {

    @property(Node)
    js_bj2: Node = null;

    @property(ParticleSystem2D)
    jb_tx: ParticleSystem2D = null; 

    @property(Node)
    contentView: Node = null;

    @property(Label)
    numberLabel: Label = null;

    winAmount: number = 0;

    private bigWinEff() {
        const __this = this;
        this.contentView.scale = new Vec3(0.3,0.3,0.3);
        tween(this.contentView).to(0.2, { scale: new Vec3(1.0, 1.0, 1.0) }).call(()=>{
          
        }).start();
        this.js_bj2.opacity = 0;
        tween(this.js_bj2).to(3, {opacity: 255}).start();
        tween(this.js_bj2).to(4, {angle: 360}).call(()=>{
            __this.node.active = false;
            __this.winAmount = 0;
            __this.numberLabel.string = "";
        }).start();
    }

    setNumberLabel(n: number) {
        this.numberLabel.string = this.toThousands(n);
    }

    toThousands(num: number): string {
        num = Math.round(num);
        return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    onEnable() {
        this.js_bj2.angle = 0;
        this.js_bj2.scale = new Vec3(1.0,1.0,1.0);
        this.bigWinEff();
        this.jb_tx?.resetSystem();

        
    }

    start () {

    }

    // update (dt) {}
}
