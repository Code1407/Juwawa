import { _decorator, Node, Button, find, EventTouch, instantiate, Vec3, Vec2, Sprite, tween, Tween, UITransform, Color, Label } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { UIPlayerInfo } from "db://assets/script/module/seven7/view/UIPlayerInfo";
import { TableReward } from "db://assets/script/table/TableReward";
import { UtilTime } from "db://assets/script/framework/utils/UtilTime"
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { ConstantCfgMgr, ConstantKey } from '../../common/ConstantCfgMgr';
import { GameEvent } from '../../common/GameEvent';
import GameModelMgr from '../../mvc/GameModelMgr';
import { BundleName } from '../../../framework/commom/FrameDefine';
import { UIID } from '../../common/GameUIConfig';
import { CountDown } from './CountDown';
import { ChipsCtrl } from './ChipsCtrl';
import { RewardsCtrl } from './RewardsCtrl';
import { Game } from './Game';
import { Utils } from '../../../framework/utils/Utils';
import { UISeven7HistroyContent } from './UISeven7HistroyContent';
import { GameGlobal } from '../../common/GameGlobal';
import { AudioPath } from '../Seven7Global';

const { ccclass, property } = _decorator;

export enum GameState {
    NONE = 0,
    PREPARE = 1,
    OPENREWARD = 2
}

@ccclass('UISeven7Main')
export class UISeven7Main extends GameComponent {
    @property(ChipsCtrl)
    private chipsCtrl: ChipsCtrl = null;

    @property(RewardsCtrl)
    private rewardsCtrl: RewardsCtrl = null;

    @property(UIPlayerInfo)
    private UIPlayerInfo: UIPlayerInfo;

    @property(UISeven7HistroyContent)
    private gameHistoryView: UISeven7HistroyContent;

    @property(Game)
    private game: Game;

    @property(CountDown)
    UICountDown: CountDown;

    @property(Node)
    offAudioNode: Node;

    @property(Node)
    chipFlyRoot: Node;

    @property(Node)
    chipFlyItem: Node;

    @property(Node)
    worldFlyNode: Node;

    @property(Label)
    timeLabel: Label;

    @property(Label)
    lb_round: Label;

    private _gameState: GameState = GameState.NONE;

    private _betMap: Map<number, number> = new Map();
    private _rewardTable: TableReward = new TableReward();

    private _xOffset: number = 85;
    private _yOffset: number = 35;
    private _chipFlyItemPool: Node[] = [];

    private swingAngle: number = 30; // 摆动角度
    private swingDuration: number = 0.1; // 单次摆动持续时间
    private currentTween: Tween = null;

    private _cfgMaxFruitNum: number = 0;
    private _cfgPrepareTime: number = 0;

    private _gameHide: boolean = false;
    private _gameHideRound: number = 0;

    private _worldBetInfo: ScUpdateWorldBetPush = null;
    private _rewardInfo: ScOpenRewardPush = null;

    private _isClicking: boolean = false;
    private readonly CLICK_DELAY = 200;

    onAdded(args: any) {
        return true;
    }

    onLoad(): void {
        var backBtn = find("btns/btn_back", this.node);
        backBtn.on(Node.EventType.TOUCH_START, this.btn_back.bind(this))

        var myBetsHistory = find("btns/btns_right/btn_myBetsHistory", this.node);
        myBetsHistory.on(Node.EventType.TOUCH_START, this.btn_myBetsHistory)

        var helpBtn = find("btns/btns_right/btn_help", this.node);
        helpBtn.on(Node.EventType.TOUCH_START, this.btn_help)

        var gameHistoryBtn = find("btns/btns_right/btn_gameHistory", this.node);
        gameHistoryBtn.on(Node.EventType.TOUCH_START, this.btn_gameHistory)

        var audioBtn = find("btns/btns_right/btn_audio", this.node);
        audioBtn.on(Node.EventType.TOUCH_START, this.btn_audio.bind(this))

        var btn_repeat = find("btns/btn_repeat", this.node);
        btn_repeat.on(Node.EventType.TOUCH_START, this.btn_repeat.bind(this))

        this._cfgPrepareTime = ConstantCfgMgr.getValue(ConstantKey.CountdownTime)
    }

    start() {
        this.on(EventMessage.GAME_PLAYER_BASE_DATA_UPDATE, this.on_player_base_data_update, this);
        this.on(EventMessage.GAME_COINS_CHANGE_PUSH, this.on_player_coins_update, this);
        this.on(EventMessage.GAME_REWARD_RECEIVE, this.on_player_reward, this);
        this.on(GameEvent.MSG_PLAYER_ENTER_GAME_PUSH, this.on_player_enter_game_push, this);
        this.on(GameEvent.MSG_CUR_GAME_INFO, this.on_cur_game_info, this);
        this.on(GameEvent.MSG_GAME_PREPARE_PUSH, this.on_game_prepare_push, this);
        this.on(GameEvent.MSG_UPDATE_SELF_BET, this.on_update_self_bet, this);
        this.on(GameEvent.MSG_UPDATE_WORLD_BET, this.on_update_world_bet, this);
        this.on(GameEvent.MSG_OPEN_REWARD, this.on_open_reward, this);
        this.on(GameEvent.MSG_SHOW_GAME_HISTORY, this.on_game_history, this);
        this.on(GameEvent.MSG_SHOW_SELF_BET_HISTORY, this.on_self_bet_history, this);

        this.on(EventMessage.GAME_NET_CONNECT, this.on_net_connect, this);
        this.on(EventMessage.GAME_NET_DISCONNECT, this.on_net_dis_connect, this);
        this.on(EventMessage.GAME_SYNC_SERVER_TIME, this.on_sync_server_time, this);

        this.setGameShow();
        this.setGameHide();

        this.init();
    }

    private init() {
        this.rewardsCtrl.init_rewards(this.onClickRewardItem.bind(this));
        this.game.init();
        this.refresh_bet_fruit_max();
        GameModelMgr.seven7Model.cs_cur_game_info_req();
        GameModelMgr.seven7Model.cs_game_history_req();
        this.initAudioState();
    }

    private initAudioState(){
        let noAudio = Utils.getQuery("noAudio");
        if(noAudio == "1"){
            GameGlobal.SoundOpen = false;
        }else if(noAudio == "0"){
            GameGlobal.SoundOpen = true;
        }

        this.offAudioNode.active = !GameGlobal.SoundOpen;
    }

    /****************Event********************/
    protected onGameShow(): void {
        if (!oops.network.IsConnect) {
            return;
        }
        oops.network.onSyncTime();
        this.UIPlayerInfo.refresh_self_coins();
    }

    protected onGameHide(): void {
        this._gameHide = true;
        this.UICountDown.clear();
        this.game.clear();
        this.clearEffect();
        this._gameHideRound = GameModelMgr.seven7Model.get_cur_round();
    }

    private on_net_connect() {
        this.gameHistoryView.needRefesh = true;
        this.chipsCtrl.refresh_gears();
        this.UIPlayerInfo.refresh_coins_icon();
        this.refresh_bet_fruit_max();
        GameModelMgr.seven7Model.cs_cur_game_info_req();
        GameModelMgr.seven7Model.cs_game_history_req();
    }

    private on_net_dis_connect() {
        this._gameState = GameState.NONE;
        this.UICountDown.clear();
        this.game.clear();
        this.clearEffect();
    }

    private on_sync_server_time() {
        if (!this._gameHide) {
            return;
        }

        this._gameHide = false;
        let curRound = GameModelMgr.seven7Model.get_cur_round();
        this.update_round_info(curRound);
        let prepareTime = GameModelMgr.seven7Model.get_cur_prepareTime_Time()
        this.gameHistoryView.show_game_history_by_client();

        //还在押注期间显示倒计时
        if (this.check_bet_is_valid(prepareTime)) {
            this.cut_down(prepareTime);
        } else {
            this.UICountDown.clear();
            //还没到下一局，但是游戏结果已经下发，给玩家弹一个结果弹窗
            if (this._rewardInfo.round == curRound) {
                oops.gui.openAsync(UIID.Seven7UI_CurBetResult);
            }
        }

        if (this._gameHideRound != curRound || !this._worldBetInfo) {
            this.rewardsCtrl.clear_item_bet_info();
        }

        //显示当前局的押注信息
        if (this._worldBetInfo && curRound == this._worldBetInfo.round) {
            this.rewardsCtrl.update_bet_value(this._worldBetInfo.betMap, false);
        }

        this._gameHideRound = 0;
    }

    /****************NET MSG********************/
    private on_player_base_data_update(event: string, args: any) {
        this.UIPlayerInfo.refresh_self_info();
    }

    private on_player_coins_update(event: string, args: any) {

    }

    private on_player_reward(event: string, args: any) {
        this.UIPlayerInfo.refresh_self_coins();
    }

    //进入到服务器
    private on_player_enter_game_push(event: string, args: any) {
        let msg = args as ScPlayerEnterGamePush;
    }

    //当前游戏信息
    private on_cur_game_info(event: string, args: any) {
        let msg = args as CsCurGameInfoResp;
        this._gameState = msg.gameState;
        this.update_round_info(msg.round);

        if (msg.gameState == 0) {
            this.clearEffect();
            return;
        }
        if (msg.gameState == 1) {//下注中
            this.start_bet_cut_down(msg.prepareTime);

        } else if (msg.gameState == 2) {//开奖中

        }
        if (msg.gameState == 2) {

        }
        this.rewardsCtrl.update_bet_value(msg.betWorld, false);
        this.rewardsCtrl.update_bet_value(msg.betSelf, true);
        this.UIPlayerInfo.refresh_self_coins();
    }

    //游戏开始准备
    private on_game_prepare_push(event: string, args: any) {
        let msg = args as ScGamePreparePush;
        this._gameState = GameState.PREPARE;
        this._worldBetInfo = null;
        this._rewardInfo = null;

        if (this._gameHide) {
            return;
        }
        this._isClicking = false;
        oops.gui.remove(UIID.Seven7UI_CurBetResult, false);
        this.start_bet_cut_down(msg.prepareTime);
        this.update_round_info(msg.round);
    }

    //更新我的下注信息
    private on_update_self_bet(event: string, args: any) {
        this.UIPlayerInfo.refresh_self_coins();
        this.rewardsCtrl.update_self_bet_value();
    }

    //更新全局下注信息
    private on_update_world_bet(event: string, args: any) {
        let msg = args as ScUpdateWorldBetPush;
        this._worldBetInfo = msg;
        if (this._gameHide) {
            return;
        }

        this.rewardsCtrl.update_bet_value(msg.betMap, false);
        if (GameModelMgr.playerModel.check_is_self_by_pid(msg.pid)) {
            return;
        }
        for (let i = 0; i < msg.betList.length; i++) {
            let betInfo = msg.betList[i];
            let rewardId = betInfo.rewardID;
            let chipValue = betInfo.chipValue;
            let chipCount = betInfo.chipCount;
            let pos = this.worldFlyNode.getWorldPosition();
            this.playRepeatChipFlyEff(rewardId, pos, chipValue, chipCount);
        }
    }

    //开奖信息
    private on_open_reward(event: string, args: any) {
        let msg = args as ScOpenRewardPush;
        this._rewardInfo = msg;
        this._gameState = GameState.OPENREWARD;
        if (this._gameHide) {
            this.gameHistoryView.openRewards(msg.rewardID);
            return;
        }
        this.open_reward();
    }

    //开奖历史记录
    private on_game_history(event: string, args: any) {

    }

    //我的下注历史记录
    private on_self_bet_history(event: string, args: any) {

    }


    /******************************************/
    private update_round_info(round: number) {
        let r = Utils.getRound(round);
        this.lb_round.string = oops.language.getLanguage("common_Round_text", r);
    }

    private open_reward() {
        this.UICountDown.stopCountdown();
        this.UICountDown.node.active = false;
        this.stopShakeEffect();
        let rewardIndex = GameModelMgr.seven7Model.getZhuanpanRewardIndex();
        if (rewardIndex > 0 && rewardIndex <= 9) {
            GameGlobal.playAudio(AudioPath.Run);
            let jpRewards = GameModelMgr.seven7Model.get_jp_rewards();
            this.game.startRotate(rewardIndex - 1, GameModelMgr.seven7Model.checkRewardIs77(), jpRewards)
        } else {
            console.error("转盘获取奖励Index错误!")
        }
    }

    //开始倒计时
    private start_bet_cut_down(prepareTime: number) {
        this.clearEffect();
        this._betMap.clear();
        //GameModelMgr.seven7Model.clearData();
        this.rewardsCtrl.clear_item_bet_info();
        this.game.clear();

        if (!this.check_bet_is_valid(prepareTime)) {
            return;
        }

        this.cut_down(prepareTime);
    }

    private cut_down(prepareTime) {
        this.UICountDown.node.active = true;
        let t = this._cfgPrepareTime - (UtilTime.getTime() - prepareTime);
        this.timeLabel.color = t > 3 ? Color.WHITE : Color.RED;
        this.UICountDown.onComplete = this.betCountDownComplete.bind(this);
        this.UICountDown.onSecond = this.betCountDownSecond.bind(this);
        this.UICountDown.setEndTime(prepareTime + this._cfgPrepareTime, () => UtilTime.getTime());
    }
    /******************************************/

    private betCountDownComplete(node: Node) {
        this._gameState = GameState.OPENREWARD;
        this.stopShakeEffect();
        ////////this.UIZhuanPan.loop(this._zhuanPanSpeed);
    }

    private betCountDownSecond(node: Node, countDown: number) {
        if (countDown <= 3) {
            if (this.currentTween == null) {
                this.timeLabel.color = Color.RED;
                this.startShakeEffect();
            }
        } else {
            this.timeLabel.color = Color.WHITE;
        }
    }

    private check_bet_is_valid(prepareTime: number): boolean {
        if (prepareTime <= 0) {
            return false;
        }
        let nowTime = UtilTime.getTime();
        let timeOffset = nowTime - prepareTime;
        return timeOffset <= this._cfgPrepareTime && timeOffset >= 0;
    }

    startShakeEffect() {
        this.stopShakeEffect();
        this.currentTween = tween(this.timeLabel.node)
            .repeatForever(
                tween()
                    .to(this.swingDuration, { eulerAngles: new Vec3(0, 0, this.swingAngle) })
                    .to(this.swingDuration * 2, { eulerAngles: new Vec3(0, 0, -this.swingAngle) })
                    .to(this.swingDuration, { eulerAngles: Vec3.ZERO })
            )
            .start();
    }

    private stopShakeEffect() {
        if (this.currentTween != null) {
            this.currentTween.stop();
            this.currentTween = null;
        }
        Tween.stopAllByTarget(this.timeLabel.node);
        this.timeLabel.node.eulerAngles = Vec3.ZERO;
    }

    private clearEffect() {
        this.stopShakeEffect();
        for (let item of this.chipFlyRoot.children) {
            Tween.stopAllByTarget(item);
            item.active = false;
            if (item != this.chipFlyItem && this._chipFlyItemPool.indexOf(item) < 0) {
                this._chipFlyItemPool.push(item);
            }
        }
    }

    private getChipFlyEndPos(centerPos: Vec2): Vec3 {
        const randomXOffset = (Math.random() - 0.5) * 2 * this._xOffset;
        const randomYOffset = (Math.random() - 0.5) * 2 * this._yOffset;
        return new Vec3(
            centerPos.x + randomXOffset,
            centerPos.y + randomYOffset,
            0
        );
    }

    private recycleChipFlyEff(item: Node) {
        setTimeout(() => {
            item.active = false;
            if (item != this.chipFlyItem && this._chipFlyItemPool.indexOf(item) < 0) {
                this._chipFlyItemPool.push(item);
            }
            //item.destroy();
        }, 1500);
    }

    private playRepeatChipFlyEff(rewardId: number, pos: Vec3, chipID: number, chipCount: number) {
        if (chipCount > 10) {
            chipCount = 10;
        }
        for (let i = 0; i < chipCount; i++) {
            this.playChipFlyEff(rewardId, chipID, pos);
        }
    }

    private playChipFlyEff(rewardId: number, chipValue: number, startPos: Vec3) {
        let rewardPos = this.rewardsCtrl.get_reward_item_world_pos(rewardId);
        let endPos = this.getChipFlyEndPos(new Vec2(rewardPos.x, rewardPos.y));
        endPos = this.chipFlyRoot.getComponent(UITransform)!.convertToNodeSpaceAR(endPos);

        if (startPos == null || endPos == null) {
            return;
        }

        let item = null;
        if (this._chipFlyItemPool.length <= 0) {
            item = instantiate(this.chipFlyItem);
            item.parent = this.chipFlyRoot;
        }
        else {
            item = this._chipFlyItemPool.pop();
        }

        if (item == null) {
            console.error("实例化ChipFlyItem错误!")
            return;
        }
        Tween.stopAllByTarget(item);
        let icon = item.getComponent(Sprite);
        let label = find("Label", item).getComponent(Label);
        const path = this.chipsCtrl.get_chip_icon_path(chipValue);
        super.setSprite(icon, path, BundleName.SkinDefault);
        label.string = Utils.simplifyNumber(chipValue);

        item.setWorldPosition(startPos);
        item.active = true;
        tween(item)
            .to(0.3, { position: endPos })
            .call(() => {
                this.recycleChipFlyEff(item);
            })
            .start();
    }

    private updateBetMap(rewardId, add) {
        let hadBetNum = 0;
        if (this._betMap.has(rewardId)) {
            hadBetNum = this._betMap.get(rewardId);
        }

        this._betMap.set(rewardId, hadBetNum + add);
    }

    private checkFruitIsOver(rewardId: number): boolean {
        if (this._betMap.has(rewardId)) {
            return true;
        }

        this._rewardTable.init(rewardId)
        if (!this._rewardTable.IsFruit) {
            return true;
        }

        let fruitNum = 0
        for (let id of this._betMap.keys()) {
            this._rewardTable.init(id)
            if (this._rewardTable.IsFruit === 1) {
                fruitNum += 1;
            }
        }
        return fruitNum < this._cfgMaxFruitNum;
    }

    private checkCanRepeatByFruit(repeatMap): boolean {
        for (const [rewardID, betInfo] of repeatMap) {
            for (const [chipID, chipCount] of betInfo) {
                if (chipCount > 0) {
                    if (!this.checkFruitIsOver(rewardID)) {
                        return false
                    }
                }
            }
        }
        return true
    }

    private check_can_bet(rewardId = null, repeatBetNum = 0): boolean {
        if (rewardId) {
            if (this.chipsCtrl.get_bet_value() <= 0) {
                return false;
            }
        } else {
            if (repeatBetNum <= 0) {
                return false;
            }
        }

        if (!this.check_bet_is_valid(GameModelMgr.seven7Model.get_cur_prepareTime_Time())) {
            oops.gui.toast("common_wait", true);
            return false;
        }

        if (!GameModelMgr.playerModel.check_sdk_valid()) {
            oops.gui.showAccounErrortUI();
            return false;
        }

        if (this._gameState != GameState.PREPARE) {
            if (this._gameState == GameState.NONE) {
                oops.gui.toast("common_wait", true);
            }
            if (this._gameState == GameState.OPENREWARD) {
                oops.gui.toast("common_wait", true);
            }
            return false;
        }

        if (rewardId) {
            if (!oops.network.checkCoinsEnough(this.chipsCtrl.get_bet_value())) {
                oops.gui.showRechargeUI();
                return false;
            }

            if (!this.checkFruitIsOver(rewardId)) {
                oops.gui.toast("seven7_select_fruits_over", true);
                return false;
            }
        } else {
            if (!oops.network.checkCoinsEnough(repeatBetNum)) {
                oops.gui.showRechargeUI();
                return false;
            }

            let repeatInfo = GameModelMgr.seven7Model.getRepeatBetInfo();
            if (!this.checkCanRepeatByFruit(repeatInfo)) {
                oops.gui.toast("seven7_select_fruits_over", true);
                return false;
            }
        }
        return true;
    }

    private async onClickRewardItem(rewardId: number) {
        if (this._isClicking) return;
        this._isClicking = true;

        if (!this.check_can_bet(rewardId)) {
            this._isClicking = false;
            return;
        }

        let betValue = this.chipsCtrl.get_bet_value()
        if (betValue > 0) {
            this.updateBetMap(rewardId, betValue);
            //GameModelMgr.playerModel.set_player_coins(-betValue);
            let pos = this.chipsCtrl.get_chip_item_world_pos(betValue);
            this.playChipFlyEff(rewardId, betValue, pos);
            let msg: CsBetReq = {
                betList: [
                    {
                        rewardID: rewardId,
                        chipValue: betValue,
                        chipCount: 1
                    }
                ]
            };
            GameModelMgr.seven7Model.cs_bet_req(msg);
        }

        // 冷却时间
        await new Promise(res => setTimeout(res, this.CLICK_DELAY));
        this._isClicking = false;
    }

    private async btn_repeat(event: EventTouch, data: any) {
        if (this._isClicking) return;
        this._isClicking = true;

        let repeatInfo = GameModelMgr.seven7Model.getRepeatBetInfo();
        if (repeatInfo != null && repeatInfo.size > 0) {
            let repeatBetNum = GameModelMgr.seven7Model.getRepeatBetNum();
            if (!this.check_can_bet(null, repeatBetNum)) {
                this._isClicking = false;
                return;
            }

            let list = [];
            for (const [rewardID, betInfo] of repeatInfo) {
                for (const [chipValue, chipCount] of betInfo) {
                    let betNum = chipCount * chipValue;
                    this.updateBetMap(rewardID, betNum);

                    if (chipCount > 0) {
                        let betData: BetData = {
                            rewardID: rewardID,
                            chipValue: chipValue,
                            chipCount: chipCount
                        }
                        list.push(betData);
                        let pos = this.chipsCtrl.get_chip_item_world_pos(chipValue);
                        this.playRepeatChipFlyEff(rewardID, pos, chipValue, chipCount);
                    }
                }
            }

            if (list.length > 0) {
                let msg: CsBetReq = {
                    betList: list
                };
                GameModelMgr.playerModel.set_player_coins(-repeatBetNum);
                GameModelMgr.seven7Model.cs_bet_req(msg);
            }
        }

        // 冷却时间
        await new Promise(res => setTimeout(res, this.CLICK_DELAY));
        this._isClicking = false;
    }

    private btn_back(event: EventTouch, data: any) {
        oops.network.quit();
    }

    private btn_myBetsHistory(event: EventTouch, data: any) {
        oops.gui.openAsync(UIID.Seven7UI_MyBetsHistroy);
        GameGlobal.playAudio(AudioPath.Click);
    }

    private btn_help(event: EventTouch, data: any) {
        oops.gui.openAsync(UIID.Seven7UI_Help);
        GameGlobal.playAudio(AudioPath.Click);
    }

    private btn_gameHistory(event: EventTouch, data: any) {
        oops.gui.openAsync(UIID.Seven7UI_GameHistory);
        GameGlobal.playAudio(AudioPath.Click);
    }

    private btn_audio(event: EventTouch, data: any) {
        GameGlobal.SoundOpen = !GameGlobal.SoundOpen;
        this.offAudioNode.active = !GameGlobal.SoundOpen;
        if (GameGlobal.SoundOpen) {
            GameGlobal.playAudio(AudioPath.Click);
        }
        GameModelMgr.seven7Model.cs_audio_change_req(GameGlobal.SoundOpen);
    }

    refresh_bet_fruit_max() {
        let maxValue = 0;
        let cfg = oops.network.getCommonConfig();
        if (!cfg || !cfg.custom || !cfg.custom.betFruitMax) {
            console.error("jsNet cfg.custom.betFruitMax is nil");
            let max = ConstantCfgMgr.getValue(ConstantKey.FruitSelectNum);
            if (!max) {
                console.error("default betFruitMax cfg is nil");
                return;
            }
            maxValue = max
        } else {
            maxValue = cfg.custom.betFruitMax;
        }
        this._cfgMaxFruitNum = maxValue;
    }


    /**
    * 异步等待指定毫秒数（非阻塞）
    * @param ms 要等待的毫秒数
    * @returns Promise<void>
    */
    public wait(ms: number): Promise<void> {
        return new Promise((resolve) => {//因为用的定时器 在使用unscheduleAllCallbacks的时候会让后面等待的代码不执行
            // 使用 Cocos 引擎的一次性定时器，避免自定义 setInterval/setTimeout 脱离引擎生命周期
            this.scheduleOnce(() => {
                resolve(); // 时间到后触发 resolve，await 结束等待
            }, ms / 1000); // scheduleOnce 的第二个参数是秒数，需转换
        });
    }
}


