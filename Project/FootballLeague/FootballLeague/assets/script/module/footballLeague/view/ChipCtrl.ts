import { _decorator, SpriteFrame, instantiate, Vec3 } from 'cc';
import { GameComponent } from 'db://oops-framework/module/common/GameComponent';
import { UIChipItem } from "db://assets/script/module/footballLeague/view/UIChipItem";
import { oops } from 'db://oops-framework/core/Oops';
import { ConstantCfgMgr, ConstantKey } from '../../common/ConstantCfgMgr';
import { AudioPath } from '../WheelGlobal';
import { GameGlobal } from '../../common/GameGlobal';
import GameModelMgr from '../../mvc/GameModelMgr';
import { GameEvent } from '../../common/GameEvent';

const { ccclass, property } = _decorator;

@ccclass('ChipCtrl')
export class ChipCtrl extends GameComponent {
    @property(UIChipItem)
    private chipItemTem: UIChipItem;

    private chipItems: Array<UIChipItem> = [];
    private _chipValue: number = null;

    start() {
        this.on(GameEvent.MSG_SCENE_CHANGE, this.on_scene_change, this);
    }

    refresh_gears() {
        this._chipValue = null;
        this.chipItems.forEach((item) => {
            item.node.active = false;
        })

        let chipValueArr: Array<number> = [];
        let cfg = oops.network.getCommonConfig();
        if (!cfg || !cfg.costs || cfg.costs.length == 0) {
            console.error("jsNet costs cfg is nil");
            let cfgBets = ConstantCfgMgr.getValue(ConstantKey.Bets);
            if (!cfgBets) {
                console.error("default costs cfg is nil");
                return;
            }

            for (let index = 0; index < cfgBets.length; index++) {
                let chipValue = cfgBets[index];
                chipValueArr.push(chipValue);
            }
        } else {
            for (let index = 0; index < cfg.costs.length; index++) {
                let chipValue = cfg.costs[index].coins;
                chipValueArr.push(chipValue);
            }
        }

        if (chipValueArr.length == 0) {
            return;
        }

        chipValueArr.sort((a, b) => a - b);
        let maxLen = Math.min(chipValueArr.length, 5);

        for (let index = 0; index < maxLen; index++) {
            let gearsIndex = index + 1;
            let chipValue = GameModelMgr.footballLeagueModel.get_scene_chip_value(chipValueArr[index]);
            let chipItem: UIChipItem | null = null;

            if (index < this.chipItems.length) {
                chipItem = this.chipItems[index];
            } else {
                let nod = instantiate(this.chipItemTem.node);
                chipItem = nod.getComponent(UIChipItem);
                if (chipItem) {
                    nod.parent = this.node;
                    this.chipItems.push(chipItem);
                }
            }

            if (!chipItem) continue;
            chipItem.node.active = true;

            chipItem.init(
                chipValue,
                gearsIndex,
                gearsIndex == GameGlobal.ChipIndex,
                this.on_click_chip_item.bind(this)
            );

            if (gearsIndex == GameGlobal.ChipIndex) {
                this._chipValue = chipValue;
            }
        }
    }

    private on_scene_change() {
        this.refresh_gears();
    }

    update_item_icon_coins(coinsSp: SpriteFrame) {
        this.chipItems.forEach(item => {
            item.show_conis_icon(coinsSp);
        });
    }

    get_bet_value(): number {
        return this._chipValue;
    }

    get_chip_item_pos(chipValue: number) {
        let startPos: Vec3;
        for (let index = 0; index < this.chipItems.length; index++) {
            if (chipValue == this.chipItems[index].get_chip_value() && this.chipItems[index].node.active) {
                let pos = this.chipItems[index].node.getWorldPosition();
                startPos = new Vec3(pos.x, pos.y + 55, 0);
            }
        }
        return startPos;
    }


    private on_click_chip_item(chipValue: number, chipIndex: number) {
        GameGlobal.playAudio(AudioPath.SelectChip);
        this._chipValue = chipValue;
        GameGlobal.ChipIndex = chipIndex;
        GameModelMgr.footballLeagueModel.cs_chip_change_req(chipIndex);
        // JP 是服务端维护的全局单池；切换下注档位不应刷新或重算它。
        for (let index = 0; index < this.chipItems.length; index++) {
            if (chipValue == this.chipItems[index].get_chip_value()) {
                this.chipItems[index].update_select(true);
            }
            else {
                this.chipItems[index].update_select(false);
            }
        }
    }
}


