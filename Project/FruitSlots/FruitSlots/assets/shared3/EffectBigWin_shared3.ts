// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { toThousands } from "../shared/Common";
import AudioCtrl from "./AudioCtrl_shared3";
import WinUI from "./WinUI_shared3";
import { GameDelay } from "./CCAsync";
import { NodePool } from "./PrefabPool_shared3";

export const bigWinMultiple = 10;
export const megaWinMultiple = 20;
export const epicWinMultiple = 30;
export const legenWinMultiple = 50;

let gPlayerSettings = () => (<any>window).gPlayerSettings;

export let gameWinvos = [
    `winvo1`,
    `winvo2`,
    `winvo3`,
    `winvo4`,
    `winvo5`,
    `winvo6`,
    `winvo7`,
    `winvo8`,
    `winvo9`,
]

export let gameBigWinvos = [
    `bigwin_vo1`,
    `bigwin_vo2`,
    `bigwin_vo3`,
    `bigwin_vo4`,
]

export let winvos = [
    `win_big_vo`,
    `win_mega_vo`,
    `win_epic_vo`,
    `win_legendary_vo`,
]

export let winbgs = [
    `win_big`,
    `win_mega`,
    `win_epic`,
    `win_legendary`,
]


const { ccclass, property } = cc._decorator;

@ccclass
export default class EffectBigWin extends cc.Component {
    static Instance: EffectBigWin;
    @property(cc.Node)
    bigWin: cc.Node = null;
    @property(cc.Node)
    megaWin: cc.Node = null;
    @property(cc.Node)
    epicWin: cc.Node = null;
    @property(cc.Node)
    legenWin: cc.Node = null;
    @property(cc.Node)
    bg: cc.Node = null;
    @property(cc.ParticleSystem)
    parFx: cc.ParticleSystem = null;
    protected start(): void {
        EffectBigWin.Instance = this;
        this.bg?.on(cc.Node.EventType.TOUCH_START, () => {
            this.winHideOnce?.();
            this.winHideOnce = null;
        })
        this.bg?.on(cc.Node.EventType.TOUCH_START, () => {
            this.winHideOnce?.();
            this.winHideOnce = null;
        })
        this.bg?.on(cc.Node.EventType.TOUCH_START, () => {
            this.winHideOnce?.();
            this.winHideOnce = null;
        })
        this.bg?.on(cc.Node.EventType.TOUCH_START, () => {
            this.winHideOnce?.();
            this.winHideOnce = null;
        })
    }
    async TryShow(totalBet: number, revenue: number, bgms: string[] = [], duration = 10) {
        if (revenue / totalBet >= legenWinMultiple) {
            await this.LegenWinShow(revenue, bgms, duration);
        }
        else if (revenue / totalBet >= epicWinMultiple) {
            await this.EpicWinShow(revenue, bgms, duration);
        }
        else if (revenue / totalBet >= megaWinMultiple) {
            await this.MegaWinShow(revenue, bgms, duration);
        }
        else if (revenue / totalBet >= bigWinMultiple) {
            await this.BigWinShow(revenue, bgms, duration);
        }
    }
    async BigWinShow(revenue: number, bgms: string[] = [], duration = 10) {
        AudioCtrl.PlayOnce(winvos[0]);
        await this.WinShow(this.bigWin, bgms, winbgs[0], revenue, duration);
    }
    async MegaWinShow(revenue: number, bgms: string[] = [], duration = 10) {
        AudioCtrl.PlayOnce(winvos[1]);
        await this.WinShow(this.megaWin, bgms, winbgs[1], revenue, duration);
    }
    async EpicWinShow(revenue: number, bgms: string[] = [], duration = 10) {
        AudioCtrl.PlayOnce(winvos[2]);
        await this.WinShow(this.epicWin, bgms, winbgs[2], revenue, duration);
    }
    async LegenWinShow(revenue: number, bgms: string[] = [], duration = 10) {
        AudioCtrl.PlayOnce(winvos[3]);
        await this.WinShow(this.legenWin, bgms, winbgs[3], revenue, duration);
    }
    async WinShow(winPrefab: cc.Node, bgms: string[], audioClip: string, revenue: number, duration = 10) {
        await new Promise(async (res, rej) => {
            let win = NodePool.Spawn(winPrefab);
            win.active = true;
            win.stopAllActions();
            let winUI = win.getComponent(WinUI);
            this.bg.active = true;
            this.parFx?.resetSystem();
            win.opacity = 0;
            win.scale = 0.2;
            cc.tween(win).to(1 / 2, { scale: 1 }, { easing: cc.easeBackOut().easing }).start();
            cc.tween(win).to(1 / 2, { opacity: 255 }, { easing: cc.easeBackOut().easing }).start();
            let auDuration = AudioCtrl.clips.get(audioClip)?.clip?.duration || duration;
            let numTween = { value: 0 };
            let repeat = cc.tween(numTween).repeatForever(cc.tween(numTween).delay(0).call(() => {
                winUI.winAmount.string = toThousands(numTween.value);
            })).start();
            cc.tween(numTween).to(Math.min(revenue / 20, Math.max(auDuration - 3, auDuration / 3)), { value: revenue }).call(() => {
                winUI.winAmount.string = toThousands(revenue);
                repeat.stop();
            }).start();
            let an = win.getComponent(cc.Animation);
            an?.play();
            let auSource = AudioCtrl.clips.get(audioClip);
            if (auSource != null)
                auSource.play();
            for (let i = 0; i < bgms.length; i++) {
                let bgm = bgms[i];
                AudioCtrl.clips.get(bgm).volume = 0;
            }
            let winHide = () => {
                this.parFx?.stopSystem();
                if (auSource != null) {
                    cc.tween(auSource).to(1 / 2, { volume: 0 }).call(() => {
                        auSource.stop();
                        auSource.volume = gPlayerSettings().soundVol;
                    }).start();
                }
                for (let i = 0; i < bgms.length; i++) {
                    let bgm = bgms[i];
                    cc.tween(AudioCtrl.clips.get(bgm)).to(1 / 2, { volume: gPlayerSettings().soundVol }).start();
                }
                cc.tween(win).to(1 / 3, { scale: 0.2 }, { easing: cc.easeCubicActionIn().easing }).start();
                cc.tween(win).to(1 / 3, { opacity: 0 }, { easing: cc.easeCubicActionIn().easing })
                    .call(() => {
                        win.active = false;
                        NodePool.Recycle(win);
                        this.bg.active = false;
                        res(0);
                    }).start();
            }
            this.winHideOnce = () => {
                winHide();
                winHide = null;
            }
            await GameDelay(this.node, auDuration - 1);
            winHide?.();
        })
    }
    winHideOnce: () => void;
}
