// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { gGameData } from "./GameData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Audio extends cc.Component {
    @property(cc.AudioSource)
    win: cc.AudioSource = null;
    @property(cc.AudioSource)
    fly: cc.AudioSource = null;
    @property(cc.AudioSource)
    combine: cc.AudioSource = null;
    @property(cc.AudioSource)
    flyDiamond: cc.AudioSource = null;
    @property(cc.AudioSource)
    click: cc.AudioSource = null;
    @property(cc.AudioSource)
    clickSpin: cc.AudioSource = null;
    @property(cc.AudioSource)
    wild: cc.AudioSource = null;
    @property(cc.AudioSource)
    bgm: cc.AudioSource = null;
    @property(cc.AudioSource)
    extra: cc.AudioSource = null;
    @property(cc.AudioSource)
    bow: cc.AudioSource = null;
    @property(cc.AudioSource)
    roll: cc.AudioSource = null;
    @property(cc.AudioSource)
    end: cc.AudioSource = null;
    @property(cc.AudioSource)
    wheel: cc.AudioSource = null;
    @property(cc.AudioSource)
    wheelStop: cc.AudioSource = null;

    audioOn: boolean = true;
    ids: number[][] = [[],[],[],[],[],[],[],[],[],[],[],[],[],[]];
    Volume: number = 1;

    static get Instance() {
        return cc.find("Audio").getComponent(Audio);
    }

    set volume(value: number) {
        this.Volume = value;
        if(value > 0) {
            this.audioOn = true;
            if(this.ids[0].length == 0) this.playBgm();
        }
        else {
            this.audioOn = false;
        }
        gGameData.soundVol = value;
        for(let i = 0; i < this.ids.length; i++){
            for(let j = 0; j < this.ids[i].length; j++){
                cc.audioEngine.setVolume(this.ids[i][j], value);
            }
        }
    }

    stopAllSounds() {
        this.stop();
    }

    stop() {
        for(let i = 0; i < this.ids.length; i++){
            for(let j = 0; j < this.ids[i].length; j++){
                cc.audioEngine.stopEffect(this.ids[i][j]);
            }
        }
        this.ids = [[],[],[],[],[],[],[],[],[],[],[],[],[],[]];
    }

    playBgm() {
        this.stopBgm();
        if (this.audioOn){
            let bgmId = cc.audioEngine.playEffect(this.bgm.clip, true);
            cc.audioEngine.setVolume(bgmId, this.Volume);
            this.ids[0].push(bgmId);
        }
    }

    stopBgm() {
        for (let i = 0; i < this.ids[0].length; i++) {
            cc.audioEngine.stopEffect(this.ids[0][i]);
        }
        this.ids[0] = [];
    }

    playExtra() {
        this.ids[1] = [];
        if (this.audioOn){
            let extraId = cc.audioEngine.playEffect(this.extra.clip, false);
            cc.audioEngine.setVolume(extraId, this.Volume);
            this.ids[1].push(extraId);
        }
    }

    playWin() {
        this.ids[2] = [];
        if (this.audioOn){
            let winId = cc.audioEngine.playEffect(this.win.clip, false);
            cc.audioEngine.setVolume(winId, this.Volume);
            this.ids[2].push(winId);
        }
    }

    playFly() {
        this.ids[3] = [];
        if (this.audioOn){
            let flyId = cc.audioEngine.playEffect(this.fly.clip, false);
            cc.audioEngine.setVolume(flyId, this.Volume);
            this.ids[3].push(flyId);
        }
    }

    playCombine() {
        this.ids[4] = [];
        if (this.audioOn){
            let combineId = cc.audioEngine.playEffect(this.combine.clip, false);
            cc.audioEngine.setVolume(combineId, this.Volume);
            this.ids[4].push(combineId);
        }
    }

    playFlyDiamond() {
        this.ids[5] = [];
        if (this.audioOn){
            let flyDiamondId = cc.audioEngine.playEffect(this.flyDiamond.clip, false);
            cc.audioEngine.setVolume(flyDiamondId, this.Volume);
            this.ids[5].push(flyDiamondId);
        }
    }

    playClick() {
        this.ids[6] = [];
        if (this.audioOn){
            let clickId = cc.audioEngine.playEffect(this.click.clip, false);
            cc.audioEngine.setVolume(clickId, this.Volume);
            this.ids[6].push(clickId);
        }
    }

    playClickSpin() {
        this.ids[7] = [];
        if (this.audioOn){
            let clickSpinId = cc.audioEngine.playEffect(this.clickSpin.clip, false);
            cc.audioEngine.setVolume(clickSpinId, this.Volume);
            this.ids[7].push(clickSpinId);
        }
    }

    playWild() {
        this.ids[8] = [];
        if (this.audioOn){
            let wildId = cc.audioEngine.playEffect(this.wild.clip, false);
            cc.audioEngine.setVolume(wildId, this.Volume);
            this.ids[8].push(wildId);
        }
    }

    playBow() {
        this.stopBow();
        if (this.audioOn) {
            let bowId = cc.audioEngine.playEffect(this.bow.clip, false);
            cc.audioEngine.setVolume(bowId, this.Volume);
            this.ids[9].push(bowId);
        }
    }

    stopBow() {
        for (let i = 0; i < this.ids[9].length; i++) {
            cc.audioEngine.stopEffect(this.ids[9][i]);
        }
        this.ids[9] = [];
    }

    playRoll() {
        this.stopRoll();
        if (this.audioOn) {
            let rollId = cc.audioEngine.playEffect(this.roll.clip, false);
            cc.audioEngine.setVolume(rollId, this.Volume);
            this.ids[10].push(rollId);
        }
    }

    stopRoll() {
        for (let i = 0; i < this.ids[10].length; i++) {
            cc.audioEngine.stopEffect(this.ids[10][i]);
        }
        this.ids[10] = [];
    }

    playEnd() {
        this.ids[11] = [];
        if (this.audioOn){
            let endId = cc.audioEngine.playEffect(this.end.clip, false);
            cc.audioEngine.setVolume(endId, this.Volume);
            this.ids[11].push(endId);
        }
    }

    playWheel() {
        this.stopWheel();
        if (this.audioOn) {
            let wheelId = cc.audioEngine.playEffect(this.wheel.clip, false);
            cc.audioEngine.setVolume(wheelId, this.Volume);
            this.ids[12].push(wheelId);
        }
    }

    stopWheel() {
        for (let i = 0; i < this.ids[12].length; i++) {
            cc.audioEngine.stopEffect(this.ids[12][i]);
        }
        this.ids[12] = [];
    }

    playWheelStop() {
        this.ids[13] = [];
        if (this.audioOn){
            let wheelStopId = cc.audioEngine.playEffect(this.wheelStop.clip, false);
            cc.audioEngine.setVolume(wheelStopId, this.Volume);
            this.ids[13].push(wheelStopId);
        }
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
