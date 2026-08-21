// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Audio extends cc.Component {
    @property(cc.AudioSource)
    run: cc.AudioSource = null;
    @property(cc.AudioSource)
    win: cc.AudioSource = null;
    @property(cc.AudioSource)
    bigWin: cc.AudioSource = null;
    @property(cc.AudioSource)
    jackpot: cc.AudioSource = null;
    @property(cc.AudioSource)
    flyDiamond: cc.AudioSource = null;
    @property(cc.AudioSource)
    click: cc.AudioSource = null;

    audioOn: boolean = true;

    static get Instance() {
        return cc.find("Audio").getComponent(Audio);
    }

    stopAllSounds() {
        this.stop();
    }

    stop() {
        this.run.stop();
        this.win.stop();
        this.bigWin.stop();
        this.jackpot.stop();
        this.flyDiamond.stop();
        this.click.stop();
    }

    playRun() {
        if (this.audioOn)
            this.run.play();
    }

    stopRun() {
        this.run.stop();
    }

    playWin() {
        if (this.audioOn)
            this.win.play();
    }

    playBigWin() {
        if (this.audioOn)
            this.bigWin.play();
    }

    playJackpot() {
        if (this.audioOn)
            this.jackpot.play();
    }

    playFlyDiamond() {
        if (this.audioOn)
            this.flyDiamond.play();
    }

    playClick() {
        if (this.audioOn)
            this.click.play();
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}
}
