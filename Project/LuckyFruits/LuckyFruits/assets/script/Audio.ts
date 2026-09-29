// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Game from "./Game";
import { gGameData } from "./GameData";
import { EGameStatus } from "../shared3/interface/IGame";


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
    cardOut: cc.AudioSource = null;
    @property(cc.AudioSource)
    Reward: cc.AudioSource = null;
    @property(cc.AudioSource)
    SendBet: cc.AudioSource = null;
    @property(cc.AudioSource)
    ClickBet: cc.AudioSource = null;
    @property(cc.AudioSource)
    TurnCard: cc.AudioSource = null;
    @property(cc.AudioSource)
    pattiwin: cc.AudioSource = null;
    @property(cc.AudioSource)
    Bgm: cc.AudioSource = null;
    @property(cc.AudioSource)
    ThrowChips: cc.AudioSource = null;
    @property(cc.AudioSource)
    Time1: cc.AudioSource = null;
    @property(cc.AudioSource)
    Time0: cc.AudioSource = null;
    @property(cc.AudioSource)
    WheelStart: cc.AudioSource = null;
    @property(cc.AudioSource)
    WheelStart02: cc.AudioSource = null;
    @property(cc.AudioSource)
    Result: cc.AudioSource = null;
    @property(cc.AudioSource)
    BlueWin: cc.AudioSource = null;
    @property(cc.AudioSource)
    RedWin: cc.AudioSource = null;
    @property(cc.AudioSource)
    AppleTime: cc.AudioSource = null;
    @property(cc.AudioSource)
    BeWin: cc.AudioSource = null;
    @property(cc.AudioSource)
    BadLuck: cc.AudioSource = null;
    @property(cc.AudioSource)
    FinalLucky: cc.AudioSource = null;

    @property(cc.AudioSource)
    DUO: cc.AudioSource = null;
    @property(cc.AudioSource)
    RUI: cc.AudioSource = null;
    @property(cc.AudioSource)
    MI: cc.AudioSource = null;
    @property(cc.AudioSource)
    FA: cc.AudioSource = null;
    @property(cc.AudioSource)
    SO: cc.AudioSource = null;


    runid: number;
    id02: number = -1;
    id03: number = -1;
    audioOn: boolean = true;
    private backgroundPaused: boolean = false;

    private get canPlayAudio(): boolean {
        return this.audioOn && !this.backgroundPaused;
    }

     static get Instance() {
        return cc.find("Audio").getComponent(Audio);

    }
    setAudioEnabled(enabled: boolean) {
        this.audioOn = enabled;
        if (!enabled) {
            this.stopPlayingAudio();
            return;
        }
        this.PlayBgm();
    }
    private stopPlayingAudio() {
        // playEffect 和 AudioSource.play 两种播放方式都在使用，需要分别停止。
        cc.audioEngine.stopAll();
        cc.audioEngine.stopMusic();
        // Rank 等动态预制体的 AudioSource 不在主 Audio 节点下，因此从场景根节点统一停止。
        const scene = cc.director.getScene();
        const audioRoot = scene || this.node;
        audioRoot.getComponentsInChildren(cc.AudioSource).forEach((source) => source.stop());
        this.runid = -1;
        this.id02 = -1;
        this.id03 = -1;
    }
    stopAllSounds() {
        this.setAudioEnabled(false);
    }
    pauseForBackground() {
        if (this.backgroundPaused) {
            return;
        }
        this.backgroundPaused = true;
        cc.audioEngine.pauseAll();
    }
    resumeFromBackground() {
        if (!this.backgroundPaused) {
            return;
        }
        this.backgroundPaused = false;
        if (this.audioOn) {
            cc.audioEngine.resumeAll();
        }
    }
    PlayBgm() {
        if (this.backgroundPaused) {
            return;
        }
        if (this.audioOn)
            cc.audioEngine.playMusic(this.Bgm.clip, true);
        else
            cc.audioEngine.stopMusic();
    }
    StartBGM() {
        if (this.canPlayAudio) {
            cc.audioEngine.resumeMusic();
        }
    }
    stopBgm() {
        cc.audioEngine.pauseMusic();
    }
    playRun() {
        if (this.canPlayAudio)
            cc.audioEngine.playEffect(this.run.clip, false);
    }

    playFinal() {
        if (this.canPlayAudio)
            this.final.play();
    }

    playClick() {
        if (this.canPlayAudio)
            cc.audioEngine.playEffect(this.click.clip, false);
    }
    playCardOut() {
        if (this.canPlayAudio)
            this.cardOut.play();
    }
    playReward() {
        if (this.canPlayAudio)
           cc.audioEngine.playEffect(this.Reward.clip, false);
    }
    playSendBet() {
        if (this.canPlayAudio)
            cc.audioEngine.playEffect(this.SendBet.clip, false);
    }
    clickBet() {
        if (this.canPlayAudio)
            cc.audioEngine.playEffect(this.ClickBet.clip, false);
    }
    playTurnCard() {
        if (this.canPlayAudio)
            this.TurnCard.play();
    }
    playpattiwin() {
        if (this.canPlayAudio)
            this.pattiwin.play();
    }
    Throw() {
        if (this.canPlayAudio)
            this.ThrowChips.play();
    }
    TimeStart() {
        if (this.canPlayAudio)
            this.Time1.play();
    }
    TimeOver() {
        if (this.canPlayAudio)
            this.Time0.play();
    }
    wheelStart() {
        if (this.canPlayAudio)
            this.runid = cc.audioEngine.playEffect(this.WheelStart.clip, false);
    }
    stop00() {
        cc.audioEngine.stopEffect(this.runid);
    }
    wheelStart02() {    //将要中奖
        if (this.canPlayAudio)
            this.id02 = cc.audioEngine.playEffect(this.WheelStart02.clip, false);
    }
    // beWin() {       
    //     if (this.audioOn)
    //         this.id03 = cc.audioEngine.playEffect(this.BeWin.clip, false);
    // }
    badLuck() {
        if (this.canPlayAudio)
            this.BadLuck.play();
    }
    result() {  //中奖
        if (this.canPlayAudio)
            this.Result.play();
    }
    blueWin() {
        if (this.canPlayAudio)
            this.BlueWin.play();
    }
    redWin() {
        if (this.canPlayAudio)
            this.RedWin.play();
    }
    appleTime() {
        
        if (this.canPlayAudio)
            this.AppleTime.play();
    }
    finalLucky() {
        
        if (this.canPlayAudio)
            this.FinalLucky.play();
    }
    duo() {
        if (this.canPlayAudio && gGameData.roundStep.status == EGameStatus.bet && Game.Instance.RewardingView.active == false)
            this.DUO.play();
    }
    rui() {
        if (this.canPlayAudio && gGameData.roundStep.status == EGameStatus.bet && Game.Instance.RewardingView.active == false)
            this.RUI.play();
    }
    mi() {
        if (this.canPlayAudio && gGameData.roundStep.status == EGameStatus.bet && Game.Instance.RewardingView.active == false)
            this.MI.play();
    }
    fa() {
        if (this.canPlayAudio && gGameData.roundStep.status == EGameStatus.bet && Game.Instance.RewardingView.active == false)
            this.FA.play();
    }
    so() {
        if (this.canPlayAudio && gGameData.roundStep.status == EGameStatus.bet && Game.Instance.RewardingView.active == false)
            this.SO.play();
    }

    start() {
    }

    // update (dt) {}
}
