import { AudioSource } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { oops } from 'db://oops-framework/core/Oops';
import { GameGlobal } from '../common/GameGlobal';
import { GameEvent } from '../common/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('AudioControl')
export class AudioControl extends Component {

    @property({type: AudioSource,displayName: "背景音乐"})
    private bgm: AudioSource = null;

    //筹码选择音效
    @property({type: AudioSource,displayName: "筹码选择音效"})
    private chipSelect: AudioSource = null;

    //游戏开始音效
    @property({type: AudioSource,displayName: "游戏开始音效"})
    private gameStart: AudioSource = null;

    //游戏结束音效
    @property({type: AudioSource,displayName: "游戏结束音效"})
    private gameEnd: AudioSource = null;

    //赢音效
    @property({type: AudioSource,displayName: "赢音效"})
    private win: AudioSource = null;

    //准备音效
    @property({type: AudioSource,displayName: "准备音效"})
    private ready: AudioSource = null;


    //筹码落音效
    @property({type: AudioSource,displayName: "筹码落音效"})
    private chipFall: AudioSource = null;

    //倒计时3 2 1
    @property({type: AudioSource,displayName: "倒计时3 2"})
    private countDown: AudioSource = null;
    //倒计时结束音效
    @property({type: AudioSource,displayName: "倒计时结束音效"})
    private countDownEnd: AudioSource = null;

    onLoad() {
        oops.message.on(GameEvent.MSG_AUDIO_CHANGE, this.onSoundChange, this);
    }

    onDestroy() {
        oops.message.off(GameEvent.MSG_AUDIO_CHANGE, this.onSoundChange, this);
    }

    /** 音效开关变化：关停背景音乐，开则重新播放 */
    private onSoundChange(event: string, open: boolean) {
        if (open) {
            this.playBgm();
        } else {
            this.stopBgm();
        }
    }

    /** 播放背景音乐（循环，重复调用不叠加） */
    playBgm() {
        if (!GameGlobal.SoundOpen || !this.bgm) {
            return;
        }
        this.bgm.loop = true;
        this.bgm.play();
    }

    /** 停止背景音乐 */
    stopBgm() {
        if (!this.bgm) {
            return;
        }
        this.bgm.stop();
    }

    /** 播放筹码选择音效 */
    playChipSelect() {
        this.playSfx(this.chipSelect);
    }

    /** 播放游戏开始音效 */
    playGameStart() {
        this.playSfx(this.gameStart);
    }

    /** 播放游戏结束音效 */
    playGameEnd() {
        this.playSfx(this.gameEnd);
    }

    /** 播放赢音效  自己盈利大于0 */
    playWin() {
        this.playSfx(this.win);
    }

    /** 播放准备音效  开始下注时播放 */
    playReady() {
        this.playSfx(this.ready);
    }


    /** 播放筹码落盘音效（高频触发，playOneShot 支持叠加不互相打断） */
    playChipFall() {
        this.playSfx(this.chipFall);
    }

    /** 播放倒计时音效（下注倒计时 3 2  每秒触发，playOneShot 支持连续触发不互相打断） */
    playCountDown() {
        this.playSfx(this.countDown);
    }

    /** 播放倒计时结束音效（下注倒计时 1  结束音效） */
    playCountDownEnd() {
        this.playSfx(this.countDownEnd);
    }

    /** 通用单次音效播放：受静音开关控制，音量取 AudioSource 上配置的 volume */
    private playSfx(source: AudioSource) {
        if (!GameGlobal.SoundOpen || !source || !source.clip) {
            return;
        }
        source.playOneShot(source.clip, source.volume);
    }
}
