// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

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
    @property(cc.AudioSource)
    CarAmation: cc.AudioSource = null;
    @property(cc.AudioSource)
    countDown: cc.AudioSource = null;
    @property(cc.AudioSource)
    countDownEnd: cc.AudioSource = null;
    @property(cc.AudioSource)
    Ready: cc.AudioSource = null;
    @property(cc.AudioSource)
    Go: cc.AudioSource = null;

    audioOn: boolean = true;
    private readonly bgmMaxVolume: number = 0.7;

    static get Instance() {
        return cc.find("Audio").getComponent(Audio);
    }

    stopAllSounds() {
        this.audioOn = false;
        cc.audioEngine.stopMusic();
        cc.audioEngine.stopAll();
        this.bgm.stop();
        this.startRun.stop();
        this.startCountDown.stop();
    }
    playRun() {
        if (this.audioOn && !(<any>window).gameHide)
            this.run.play();
    }

    playFinal() {
        if (this.audioOn && !(<any>window).gameHide)
            this.final.play();
    }

    playClick() {
        if (this.audioOn && !(<any>window).gameHide)
            this.click.play();
    }
    playstartRun() {
        if (this.audioOn && !(<any>window).gameHide)
            this.startRun.play();
    }
    StopstartRun() {
        this.startRun.stop();
    }
    playstartCountDown() {
        if (this.audioOn && !(<any>window).gameHide)
            this.startCountDown.play();
    }
    playbgm() {
        if (this.audioOn && !(<any>window).gameHide) {
            cc.audioEngine.playMusic(this.bgm.clip, true);
            cc.audioEngine.setMusicVolume(this.bgmMaxVolume);
        }
        else
            cc.audioEngine.stopMusic();
    }
    stopBgm() {
        cc.audioEngine.pauseMusic();
    }
    StartBGM() {
        if (this.audioOn && !(<any>window).gameHide) {
            cc.audioEngine.setMusicVolume(this.bgmMaxVolume);
            cc.audioEngine.resumeMusic();
        }
    }
    playbet() {
        if (this.audioOn && !(<any>window).gameHide)
            this.bet.play();
    }
    playchangebet() {
        if (this.audioOn && !(<any>window).gameHide)
            this.changebet.play();
    }
    playfly() {
        if (this.audioOn && !(<any>window).gameHide)
            this.fly.play();
    }
    playstopRun() {
        if (this.audioOn && !(<any>window).gameHide)
            this.stopRun.play();
    }
    playWinGold() {
        if (this.audioOn && !(<any>window).gameHide)
            this.winGold.play();
    }
    carAmation() {
        if (this.audioOn && !(<any>window).gameHide)
            this.CarAmation.play();
    }
    playsendBet() {
        if (this.audioOn && !(<any>window).gameHide)
            this.sendBet.play();
    }

    CountDown() {
        if (this.audioOn && !(<any>window).gameHide)
            this.countDown.play();
    }
    CountDownEnd() {
        if (this.audioOn && !(<any>window).gameHide)
            this.countDownEnd.play();
    }
    ready() {
        if (this.audioOn && !(<any>window).gameHide)
            this.Ready.play();
    }
    go() {
        if (this.audioOn && !(<any>window).gameHide)
            this.Go.play();
    }


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
