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
    show_result: cc.AudioSource = null;
    @property(cc.AudioSource)
    final: cc.AudioSource = null;
    @property(cc.AudioSource)
    click: cc.AudioSource = null;
    @property(cc.AudioSource)
    startRun: cc.AudioSource = null;
    @property(cc.AudioSource)
    stop_selection: cc.AudioSource = null;
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
    startSelect: cc.AudioSource = null;
    @property(cc.AudioSource)
    countDown: cc.AudioSource = null;
    @property(cc.AudioSource)
    countDownEnd: cc.AudioSource = null;
    @property(cc.AudioSource)
    Ready: cc.AudioSource = null;


    audioOn: boolean = true;

    static get Instance() {
        return cc.find("Audio").getComponent(Audio);
    }

    // 存储需要强制控制的音频ID
    private controlledAudioIDs: any[] = [];

    stopAllSounds() {
        this.audioOn = false;
        cc.audioEngine.stopMusic();
        cc.audioEngine.stopAll();
        this.bgm.stop();
        // 停止对应的AudioSource
        this.startSelect.stop();
        this.Ready.stop();
        this.stop_selection.stop();

        // 强制停止所有受控音频
        this.forceStopControlledAudios();
    }
    playshow_result() {
        if (this.audioOn)
            this.show_result.play();
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
    playstop_selection() {
        if (this.audioOn) {
            const audioID = this.stop_selection.play();
            this.controlledAudioIDs.push(audioID);
        }
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
    StartSelect() {
        if (this.audioOn) {
            const audioID = this.startSelect.play();
            this.controlledAudioIDs.push(audioID);
        }
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
        if (this.audioOn) {
            const audioID = this.Ready.play();
            this.controlledAudioIDs.push(audioID);
        }
    }


    // 强制停止所有受控音频
    forceStopControlledAudios() {
        // 停止所有音频ID
        this.controlledAudioIDs.forEach(audioID => {
            if (audioID !== -1) {
                cc.audioEngine.stop(audioID);
            }
        });
        this.controlledAudioIDs = [];
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
