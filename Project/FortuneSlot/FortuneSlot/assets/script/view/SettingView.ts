// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Audio from "../Audio";
import Game from "../Game";
import { gGameData } from "../GameData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SettingView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;

    @property(cc.Node)
    bars: cc.Node[] = [];

    @property(cc.Node)
    volumeDes: cc.Node = null;

    @property(cc.Node)
    volumeInc: cc.Node = null;

    @property(cc.Node)
    bar0: cc.Node = null;

    @property(cc.Node)
    bar1: cc.Node = null;

    @property(cc.Node)
    bar2: cc.Node = null;

    @property(cc.Node)
    bar3: cc.Node = null;

    @property(cc.Node)
    point0: cc.Node = null;

    @property(cc.Node)
    point1: cc.Node = null;

    @property(cc.Node)
    point2: cc.Node = null;

    @property(cc.Node)
    point3: cc.Node = null;

    @property(cc.Node)
    bg: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.volumeDes.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playClick();
            let volume = Audio.Instance.Volume;
            if(volume > 0){
                Audio.Instance.volume = volume - 0.33;
                if(volume < 0) Audio.Instance.volume = 0;
            }
            this.switchBar();
            let playerSettings = {
                lastBetAmountButton: gGameData.betAmountIndex,
                soundVol: Audio.Instance.Volume
            }
            Game.Instance.player.updateSettings(playerSettings);
        });

        this.volumeInc.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.playClick();
            let volume = Audio.Instance.Volume;
            if(volume < 1){
                Audio.Instance.volume =volume + 0.33;
                if(volume > 1) Audio.Instance.volume = 1;
            }
            this.switchBar();
            let playerSettings = {
                lastBetAmountButton: gGameData.betAmountIndex,
                soundVol: Audio.Instance.Volume
            }
            Game.Instance.player.updateSettings(playerSettings);
        });

        this.bar0.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 0));
        this.bar1.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 0.33));
        this.bar2.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 0.66));
        this.bar3.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 1));

        this.point0.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 0));
        this.point1.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 0.33));
        this.point2.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 0.66));
        this.point3.on(cc.Node.EventType.TOUCH_START, this.volumeChanged.bind(this, 1));

        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
            Audio.Instance.playClick();
        });

        this.bg.on(cc.Node.EventType.TOUCH_START, () => {
            this.node.active = false;
            Audio.Instance.playClick();
        });
    }

    protected onEnable(): void {
        this.switchBar();
    }

    volumeChanged(volume: number): void {
        Audio.Instance.playClick();
        Audio.Instance.volume = volume;
        this.switchBar();
        let playerSettings = {
            lastBetAmountButton: gGameData.betAmountIndex,
            soundVol: Audio.Instance.Volume
        }
        Game.Instance.player.updateSettings(playerSettings);
    }

    switchBar(){
        let volume = Audio.Instance.Volume;
        for(let i = 0; i < this.bars.length; i++) this.bars[i].active = false;
        if(volume > 0 && volume < 0.4) {
            Audio.Instance.volume = 0.33;
            this.bars[0].active = true;
        }
        else if(volume >= 0.4 && volume < 0.7) {
            Audio.Instance.volume = 0.66;
            this.bars[0].active = true;
            this.bars[1].active = true;
        }
        else if(volume >= 0.7 && volume <= 1) {
            Audio.Instance.volume = 1;
            this.bars[0].active = true;
            this.bars[1].active = true;
            this.bars[2].active = true;
        }
        else if(volume < 0) {
            Audio.Instance.volume = 0;
            this.switchBar();
        }
        else if(volume > 1) {
            Audio.Instance.volume = 1;
            this.switchBar();
        }
    }

    // update (dt) {}
}
