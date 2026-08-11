// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "./Game";
import ImageCache from "./image/ImageCache";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Audio extends cc.Component {

    @property(cc.AudioSource)
    run: cc.AudioSource = null;
    @property(cc.AudioSource)
    final: cc.AudioSource = null;
    @property(cc.AudioSource)
    click: cc.AudioSource = null;
    @property(cc.AudioSource)
    startRun: cc.AudioSource = null;
    @property(cc.AudioSource)
    startCountDown: cc.AudioSource = null;
    @property(cc.AudioSource)
    bgm: cc.AudioSource = null;
    @property(cc.AudioSource)
    bet: cc.AudioSource = null;
    @property(cc.AudioSource)
    changebet: cc.AudioSource = null;
    @property(cc.AudioSource)
    fly: cc.AudioSource = null;
    @property(cc.AudioSource)
    stopRun: cc.AudioSource = null;
    @property(cc.AudioSource)
    winGold: cc.AudioSource = null;
    @property(cc.AudioSource)
    sendBet: cc.AudioSource = null;

    audioOn: boolean = true;

    static get Instance() {
        return cc.find("Audio").getComponent(Audio);
    }
    stopAllSounds() {
        this.audioOn = false;
        cc.audioEngine.pauseMusic();
        cc.audioEngine.pauseAll();
        this.bgm.stop();
        this.startCountDown.stop();
        this.StopstartRun();
        Game.Instance.poppusViewUI.soundSprite.spriteFrame = Audio.Instance.audioOn ? ImageCache.Instance.soundSprite[0] : ImageCache.Instance.soundSprite[1];
    }

    resumeAllSounds() {
        this.audioOn = true;
        cc.audioEngine.resumeMusic();
        cc.audioEngine.resumeAll();
        this.playbgm();
        Game.Instance.poppusViewUI.soundSprite.spriteFrame = Audio.Instance.audioOn ? ImageCache.Instance.soundSprite[0] : ImageCache.Instance.soundSprite[1];
    }

    playRun() {
        if (this.audioOn)
            this.run.play();
    }

    playFinal() {
        if (this.audioOn)
            this.final.play();
    }

    playClick() {
        if (this.audioOn)
            this.click.play();
    }
    playstartRun() {
        if (this.audioOn)
            this.startRun.play();
    }
    StopstartRun() {
        this.startRun.stop();
    }
    playstartCountDown() {
        if (this.audioOn)
            this.startCountDown.play();
    }
    playbgm() {
        if (this.audioOn)
            this.bgm.play();
    }
    playbet() {
        if (this.audioOn)
            this.bet.play();
    }
    playchangebet() {
        if (this.audioOn)
            this.changebet.play();
    }
    playfly() {
        if (this.audioOn)
            this.fly.play();
    }
    playstopRun() {
        if (this.audioOn)
            this.stopRun.play();
    }
    playWinGold() {
        if (this.audioOn)
            this.winGold.play();
    }
    playsendBet() {
        if (this.audioOn)
            this.sendBet.play();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
