
import { SdkState } from "../../framework/commom/FrameDefine";
import IMvc from "../mvc/IMvc";

export default class PlayerProxy extends IMvc {
    //玩家基础信息
    private pBaseData: PlayerBaseData = null;
    //sdk状态
    private sdkState: SdkState = SdkState.Invalid;

    init(): void { }

    update_player_base_data(data: PlayerBaseData): void {
        this.pBaseData = data;
    }

    update_player_coins(coins: number) {
        if (!this.pBaseData) {
            console.error("pBaseData is null");
            return;
        }
        this.pBaseData.coins = coins;
    }

    update_sdk_state(state: number) {
        this.sdkState = state;
    }


    //////////////////////////////////////////
    get_palyer_base_data(): PlayerBaseData {
        return this.pBaseData;
    }

    get_player_coins(): number {
        return this.pBaseData && this.pBaseData.coins || 0;
    }

    check_sdk_valid(): boolean {
        return this.sdkState == SdkState.Valid;
    }

    clear(): void {
        this.pBaseData = null;
        this.sdkState = SdkState.Invalid;
    }
}