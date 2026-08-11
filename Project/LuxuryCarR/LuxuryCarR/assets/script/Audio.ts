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
            cc.audioEngine.playMusic(this.bgm.clip, true);
        else
            cc.audioEngine.stopMusic();
    }
    stopBgm() {
        cc.audioEngine.pauseMusic();
    }
    StartBGM() {
        if (this.audioOn) {
            cc.audioEngine.resumeMusic();
        }
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
    carAmation() {
        if (this.audioOn)
            this.CarAmation.play();
    }
    playsendBet() {
        if (this.audioOn)
            this.sendBet.play();
    }

    CountDown() {
        if (this.audioOn)
            this.countDown.play();
    }
    CountDownEnd() {
        if (this.audioOn)
            this.countDownEnd.play();
    }
    ready() {
        if (this.audioOn)
            this.Ready.play();
    }
    go() {
        if (this.audioOn)
            this.Go.play();
    }


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
