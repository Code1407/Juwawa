import { _decorator, Component, v3, instantiate } from 'cc';
import { UISeven7ChipItem } from "db://assets/script/module/seven7/view/UISeven7ChipItem";
import { oops } from 'db://oops-framework/core/Oops';
import { ConstantCfgMgr, ConstantKey } from '../../common/ConstantCfgMgr';
import GameModelMgr from '../../mvc/GameModelMgr';
import { GameGlobal } from '../../common/GameGlobal';
import { AudioPath } from '../Seven7Global';
const { ccclass, property } = _decorator;

@ccclass('ChipsCtrl')
export class ChipsCtrl extends Component {
    @property(UISeven7ChipItem)
    private chipItemTem: UISeven7ChipItem = null;

    private chipItems: Array<UISeven7ChipItem> = [];

    private gearIconMap: Map<number, string> = new Map();

    private _chipValue: number = null;

    start() {
        this.refresh_gears();
    }

    public refresh_gears() {
        this.chipItems.forEach((item) => {
            item.node.active = false;
        })

        this.gearIconMap.clear();

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

        chipValueArr.sort((a, b) => b - a);

        let chipIndex = chipValueArr.length - GameGlobal.ChipIndex;
        chipIndex = Math.max(0, Math.min(chipIndex, chipValueArr.length - 1));

        for (let index = 0; index < chipValueArr.length; index++) {
            let chipValue = chipValueArr[index];
            let chipItem: UISeven7ChipItem | null = null;

            if (index < this.chipItems.length) {
                chipItem = this.chipItems[index];
            } else {
                let nod = instantiate(this.chipItemTem.node);
                chipItem = nod.getComponent(UISeven7ChipItem);
                if (chipItem) {
                    nod.parent = this.node;
                    this.chipItems.push(chipItem);
                }
            }

            if (!chipItem) continue;
            chipItem.node.active = true;

            const iconPath = this.getGearIconPath(chipValueArr.length - index, chipValueArr.length);
            chipItem.init(
                chipValue,
                chipValueArr.length - index,
                iconPath,
                index == chipIndex,
                this.on_click_chip_item.bind(this)
            );

            if (index == chipIndex) {
                this._chipValue = chipValue;
            }

            if (!this.gearIconMap.has(chipValue)) {
                this.gearIconMap.set(chipValue, iconPath);
            }
        }

        this.node.scale = chipValueArr.length <= 4 ? v3(1.25, 1.25, 1.25) : v3(1, 1, 1);
    }

    public get_bet_value(): number {
        return this._chipValue;
    }

    public get_chip_item_world_pos(chipValue: number) {
        for (let index = 0; index < this.chipItems.length; index++) {
            if (chipValue == this.chipItems[index].get_chip_value() && this.chipItems[index].node.active) {
                let pos = this.chipItems[index].node.getWorldPosition();
                return v3(pos.x, pos.y + 55, 0);
            }
        }
        return null
    }

    public get_chip_icon_path(chipValue: number) {
        if (!this.gearIconMap.has(chipValue)) {
            console.error(`chipValue:${chipValue} path is nil`);
            return;
        }
        return this.gearIconMap.get(chipValue);
    }

    private getGearIconPath(gear: number, gearMax: number) {
        let chipIcon = (5 - gearMax) + gear;
        const path = `texture/atlas/main/${chipIcon}`;
        return path;
    }

    private on_click_chip_item(chipValue: number, chipIndex: number) {
        GameGlobal.playAudio(AudioPath.Bet);
        this._chipValue = chipValue;
        GameModelMgr.seven7Model.cs_chip_change_req(chipIndex);
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


