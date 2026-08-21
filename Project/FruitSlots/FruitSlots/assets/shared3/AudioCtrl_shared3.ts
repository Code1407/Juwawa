// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { isGameHide } from "../shared/Common";
import { pinusRequest } from "../shared/MessageRouter";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioCtrl extends cc.Component {
    static Instance: AudioCtrl = null;
    static clips: Map<string, cc.AudioSource> = new Map();
    private lastSubmittedVolume: number = NaN;
    @property(cc.Slider)
    slider: cc.Slider = null;
    @property()
    getChildrenNames = false
    start() {
        AudioCtrl.Instance = this;
        if (this.getChildrenNames) {
            let toLog: string[] = [];
            for (let child of this.node.children) {
                toLog.push(`${child.name}:"${child.name}"`);
            }
            console.log(toLog.join(`,\n`));
        }
        this.LoadSource();
        this.slider.node.on(cc.Node.EventType.TOUCH_END, this.SaveVol, this);
        this.slider.node.on(cc.Node.EventType.TOUCH_CANCEL, this.SaveVol, this);
    }
    protected onDestroy(): void {
        this.slider?.node.off(cc.Node.EventType.TOUCH_END, this.SaveVol, this);
        this.slider?.node.off(cc.Node.EventType.TOUCH_CANCEL, this.SaveVol, this);
    }
    LoadSource() {
        this.node.children.forEach(element => {
            AudioCtrl.clips.set(element.name, element.getComponent(cc.AudioSource));
        });
    }
    SetVol() {
        AudioCtrl.clips.forEach((clip) => {
            clip.volume = this.slider.progress;
        });
        for (let k in AudioCtrl.allEffId) {
            cc.audioEngine.setVolume(Number(k), this.slider.progress);
        }
        (<any>window).gPlayerSettings.soundVol = this.slider.progress;
    }
    SaveVol() {
        const volume = Math.round(this.slider.progress * 100) / 100; //音效保留两位有效数
        this.slider.progress = volume;
        (<any>window).gPlayerSettings.soundVol = volume;
        if (Number.isFinite(this.lastSubmittedVolume)
            && Math.abs(volume - this.lastSubmittedVolume) < 0.001) {
            return;
        }
        this.lastSubmittedVolume = volume;
        pinusRequest("updateSettings", {
            config: {
                ...(<any>window).gPlayerSettings,
                soundVol: volume,
            }
        });
    }
    static InitVol() {
        const volume = (<any>window).gPlayerSettings.soundVol;
        this.Instance.slider.progress = volume;
        this.Instance.lastSubmittedVolume = volume;
        AudioCtrl.clips.forEach((clip) => {
            clip.volume = (<any>window).gPlayerSettings.soundVol;
        });
        for (let k in AudioCtrl.allEffId) {
            cc.audioEngine.setVolume(Number(k), (<any>window).gPlayerSettings.soundVol);
        }
    }
    static allEffId: { [index: number]: number } = {};
    static async PlayAsync(clip: any, awaitOffset = 0) {
        let auClip = this.clips.get(clip).clip;
        if (auClip == null) {
            console.error("audio clip", `"${clip}"`, "not found");
            return;
        }
        if (!isGameHide()) {
            let id = cc.audioEngine.playEffect(auClip, false);
            this.allEffId[id] = id;
            cc.audioEngine.setVolume(id, (<any>window).gPlayerSettings.soundVol);
            cc.audioEngine.setFinishCallback(id, () => {
                delete this.allEffId[id];
            })
        }
        await new Promise((res, rej) => {
            cc.tween(auClip).delay(auClip.duration + awaitOffset).call(() => {
                res(0);
            }).start();
        })
    }
    static async PlayOnce(clip: any, awaitOffset = 0) {
        let au = this.clips.get(clip);
        if (au == null) {
            console.error("audio clip", `"${clip}"`, "not found");
            return;
        }
        au.play();
        await new Promise((res, rej) => {
            cc.tween(au).delay(au.clip.duration + awaitOffset).call(() => {
                res(0);
            }).start();
        })
    }
    static StopAllSounds() {
        cc.audioEngine.stopAll();
        AudioCtrl.clips.forEach((clip) => {
            clip.stop();
        })
    }
    static HideSounds() {
        AudioCtrl.clips.forEach((clip) => {
            clip.volume = 0;
        });
        for (let k in AudioCtrl.allEffId) {
            cc.audioEngine.setVolume(Number(k), 0);
        }
        (<any>window).gPlayerSettings.soundVol = 0;
    }
    static ShowSounds() {
        AudioCtrl.clips.forEach((clip) => {
            clip.volume = this.Instance.slider.progress;
        });
        for (let k in AudioCtrl.allEffId) {
            cc.audioEngine.setVolume(Number(k), this.Instance.slider.progress);
        }
        (<any>window).gPlayerSettings.soundVol = this.Instance.slider.progress;
    }
}
