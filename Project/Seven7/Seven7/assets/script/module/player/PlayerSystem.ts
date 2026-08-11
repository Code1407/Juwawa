
import { oops } from "db://oops-framework/core/Oops";
import { EventMessage } from "db://oops-framework/core/common/event/EventMessage";
import { FrameNetMsg } from "../../framework/commom/FrameDefine";
import IMvc from "../mvc/IMvc";
import GameProxyMgr from "../mvc/GameProxyMgr";

export default class PlayerSystem extends IMvc {

    init(): void {
        oops.network.listenMsg(FrameNetMsg.CS_PLAYER_BASE_DATA_RESP, this.cs_player_base_data_resp);
        oops.network.listenMsg(FrameNetMsg.SC_COINS_UPDATE_PUSH, this.sc_coins_update_push);
        oops.network.listenMsg(FrameNetMsg.SC_SDK_STATE_PUSH, this.sc_sdk_state_push);
    }

    //玩家基础信息变化
    private cs_player_base_data_resp(msg: CsPlayerBaseDataResp) {
        if (!msg || !msg.pBaseData) {
            return console.error("CsPlayerBaseDataResp is Null");
        }
        GameProxyMgr.playerProxy.update_player_base_data(msg.pBaseData);
        oops.message.dispatchEvent(EventMessage.GAME_PLAYER_BASE_DATA_UPDATE);
    }

    //玩家积分变化推送
    private sc_coins_update_push(msg: ScCoinsUpdatePush) {
        if (!msg) {
            return console.error("ScCoinsUpdatePush is Null");
        }
        GameProxyMgr.playerProxy.update_player_coins(msg.coins);
        oops.message.dispatchEvent(EventMessage.GAME_COINS_CHANGE_PUSH);
    }

    //玩家SDK变化推送
    private sc_sdk_state_push(msg: ScSdkStatePush) {
        if (!msg) {
            return console.error("ScSdkStatePush is Null");
        }
        GameProxyMgr.playerProxy.update_sdk_state(msg.state);
    }

}


