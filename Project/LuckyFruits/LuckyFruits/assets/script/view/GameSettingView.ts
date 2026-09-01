// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { IHistoryItem } from "../interface/ILuckyFruits";
import Audio from "../Audio";
import Game from "../Game";
import { gGameData } from "../GameData";


const { ccclass, property } = cc._decorator;

@ccclass
export default class GameSettingView extends cc.Component {

    @property(cc.Node)
    closeButton: cc.Node = null;
    @property(cc.Node)
    switchButton: cc.Node = null;
    @property(cc.Node)
    onNode: cc.Node = null;
    @property(cc.Node)
    offNode: cc.Node = null;

    start() {
        this.settingBtn();
        this.onNode.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.audioOn = !Audio.Instance.audioOn;
            Audio.Instance.playClick();
            this.onNode.active = Audio.Instance.audioOn;
            this.offNode.active = !Audio.Instance.audioOn;
            gGameData.soundVol = Audio.Instance.audioOn ? 1 : 0;
            let playerSettings = {
                soundVol: gGameData.soundVol,
                lastBetAmountButton: gGameData.betAmountIndex
            }
            Game.Instance.player.updateSettings(playerSettings);
            Audio.Instance.PlayBgm();

        });
        this.offNode.on(cc.Node.EventType.TOUCH_START, () => {
            Audio.Instance.audioOn = !Audio.Instance.audioOn;
            // Audio.Instance.playClick();
            this.onNode.active = Audio.Instance.audioOn;
            this.offNode.active = !Audio.Instance.audioOn;
            gGameData.soundVol = Audio.Instance.audioOn ? 1 : 0;
            let playerSettings = {
                soundVol: gGameData.soundVol,
                lastBetAmountButton: gGameData.betAmountIndex
            }
            Game.Instance.player.updateSettings(playerSettings);
            Audio.Instance.PlayBgm();
        });

        this.closeButton.on(cc.Node.EventType.TOUCH_START, () => {
            // Audio.Instance.playClick();
            this.node.active = false;
        });

        if (this.offNode.active == false) {
            Audio.Instance.stop00();
        }
    }

    settingBtn() {
        this.onNode.active = Audio.Instance.audioOn;
        this.offNode.active = !Audio.Instance.audioOn;

    }

    // update (dt) {}
}
