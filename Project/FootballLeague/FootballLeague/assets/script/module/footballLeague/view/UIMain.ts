import { game ,_decorator, Asset, Node, AudioSource, find, instantiate, Vec3, tween, Tween, UITransform, Color, SpriteFrame, Label, Toggle, isValid } from 'cc';
import { oops } from "db://oops-framework/core/Oops";
import { GameComponent } from "db://oops-framework/module/common/GameComponent";
import { ChipCtrl } from "./ChipCtrl";
import GameModelMgr from "../../mvc/GameModelMgr";
import { WheelCtrl } from './WheelCtrl';
import { EventMessage } from 'db://oops-framework/core/common/event/EventMessage';
import { GameEvent } from '../../common/GameEvent';
import { AudioPath, EGameState } from '../WheelGlobal';
import { UtilTime } from '../../../framework/utils/UtilTime';
import { ConstantCfgMgr, ConstantKey } from '../../common/ConstantCfgMgr';
import { CountDown } from './CountDown';
import { UIID } from '../../common/GameUIConfig';
import { UIFootballLeagueResult } from './UIFootballLeagueResult';
import { UIGameHistoryScroll } from './UIGameHistoryScroll';
import { UITodayRevenue } from './UITodayRevenue';
import { UITodayRank1Info } from './UITodayRank1Info';
import { Utils } from '../../../framework/utils/Utils';
import { BetTypeOverTip } from './BetTypeOverTip';
import { GameGlobal } from '../../common/GameGlobal';
import { SelfCoinsBar } from '../../common/SelfCoinsBar';
import { UITeamControl } from './UITeamControl';
import { UIFootballLeagueJackpotHint } from './UIFootballLeagueJackpotHint';

import { sp } from 'cc'; 
import { Game } from 'cc';
import JackpotView from '../../common/JackpotView';
import { AudioControl } from '../AudioControl';


const { ccclass, property } = _decorator;

@ccclass('UIMain')
export class UIMain extends GameComponent {
    @property(UIFootballLeagueResult)
    private uiResult: UIFootballLeagueResult;

    @property(UIGameHistoryScroll)
    private uiHistoryScroll: UIGameHistoryScroll;

    @property(SelfCoinsBar)
    private selfCoinsBar: SelfCoinsBar; 

    @property(UITodayRevenue)
    private uiDayRevenue: UITodayRevenue;

    @property(UITodayRank1Info)
    private uiRank1Info: UITodayRank1Info;

    @property(ChipCtrl)
    private chipsCtrl: ChipCtrl = null;

    @property(UITeamControl)
    private uiTeamControl: UITeamControl = null;

    @property(BetTypeOverTip)
    private betTypeOverTip: BetTypeOverTip = null;


    @property(Node)
    jackpotView: Node = null;

    @property(Node)
    private btn_exit: Node;
    @property(Node)
    private btn_self_history: Node;
    @property(Node)
    private btn_help: Node;
    @property(Node)
    private btn_audio: Node;
    @property(Node)
    private audio_off: Node;

    @property(Node)
    private chipFlyRoot: Node;
    @property(Node)
    private chipFlyItem: Node;

    @property(Node)
    private nod_countDown: Node;

    @property(Label)
    private lb_round: Label;

    @property(SpriteFrame)
    private remote_icon_coins: SpriteFrame = null;
    private remote_coin_icon_refs: { frame: SpriteFrame, texture: Asset, source: Asset }[] = [];

    @property(AudioSource)
    private audio_run: AudioSource = null;

    //游戏开始动画 skeleton 
    @property({type: Node,displayName: "startAnim"})
    startAnim: Node = null;

    //结束动画
    @property({type: Node,displayName: "endAnim"})
    endAnim: Node = null;


    //音效控制脚本
    @property(AudioControl)
    private audioControl: AudioControl = null;


    private lb_selfBetTotal: Label = null;
    private lb_allBetTotal: Label = null;
    private lb_hotTeamName: Label = null;


  
    private countDown: CountDown = null;
    private selectTime: Node = null;
    //selectimeBg
    private selectTimeBg: Node = null;
    private autoSpinToggle: Toggle = null;

    private gameState: EGameState = EGameState.Bet;
    private openAuto: boolean = false;
    private curCutDown: number = 0;
    private chipFlyPool: Node[] = [];

    private cfgBetTime: number = 0;

    private _gameHide: boolean = false;
    private _gameHideRound: number = 0;
    private _stopRunAnim: boolean = false;

    private _rewardInfo: ScOpenRewardPush = null;
    private _jackpotWinAmount: number = 0;
    private _jackpotRefreshPending: boolean = false;
    private uiJackpotHint: UIFootballLeagueJackpotHint = null;
    private _hotRewardInfo: ScHotBetRewardPush = null;
    private _betTypeMax: number = 0;

    private _isClicking: boolean = false;
    private _isAutoSpinInternalChange: boolean = false;
    private _autoBetRound: number = 0;
    private _autoBetting: boolean = false;
    private readonly CLICK_DELAY = 200;
    /** JP 中奖面板与全服跑马灯统一延迟展示，避免和开奖动画重叠。 */
    private readonly JACKPOT_DISPLAY_DELAY = 2;
    //1 ["阿尔阿赫利", "巴黎圣日耳曼", "拜仁慕尼黑", "曼联", "利雅得胜利", "利雅得新月", "海湾FC", "阿尔艾因"]
    //2 ["莱斯特城", "阿森纳", "曼城", "利物浦", "里尔", "朗斯", "凯尔特人", "比利亚雷亚尔"]
    //3 ["塞维利亚", "切尔西", "皇家马德里", "AC米兰", "阿斯顿维拉", "马赛", "摩纳哥", "纽卡斯尔联"]

    //对应场景的球队名称
    public TeamName = [["Al Ahly SC", "Paris Saint-Germain", "FC Bayern Munich", "Manchester United", "Al Nasr SC", "Al Hilal SFC", "Gulf FC", "Al Ain Club"],
                        ["Leicester City", "Arsenal", "Manchester City", "Liverpool", "Lille", "Lens", "Celtic", "Villarreal"],
                        ["Sevilla FC", "Chelsea FC", "Real Madrid CF", "AC Milan", "Aston Villa FC", "Olympique de Marseille", "AS Monaco FC", "Newcastle United FC"]];

    onAdded(args: any) {
        return true;
    }

    onLoad(): void {

        this.initSkeleton();

        this.btn_exit.on(Node.EventType.TOUCH_START, this.on_click_exit_btn);
        this.btn_self_history.on(Node.EventType.TOUCH_START, this.on_click_my_history.bind(this));
        this.btn_help.on(Node.EventType.TOUCH_START, this.on_click_help);
        this.btn_audio.on(Node.EventType.TOUCH_START, this.on_click_audio.bind(this));

        this.countDown = this.nod_countDown.getComponent(CountDown);
        this.selectTime = find("qiuwang1/selectTip", this.nod_countDown);
        this.selectTime.active = false;
        this.selectTimeBg = find("qiuwang1/lantiao", this.nod_countDown);
        this.selectTimeBg.active = false;

        this.cfgBetTime = ConstantCfgMgr.getValue(ConstantKey.BetTime);
        this.openAuto = false;
        this.init_bet_count_labels();
        this.init_auto_spin();
    }

    start() {
        this.on(EventMessage.GAME_PLAYER_BASE_DATA_UPDATE, this.on_player_base_data_update, this);
        this.on(EventMessage.GAME_COINS_CHANGE_PUSH, this.on_player_coins_update, this);
        this.on(EventMessage.GAME_REWARD_RECEIVE, this.on_player_reward, this);
        this.on(GameEvent.MSG_PLAYER_ENTER_GAME_PUSH, this.on_player_enter_game_push, this);
        this.on(GameEvent.MSG_CUR_GAME_INFO, this.on_cur_game_info, this);
        this.on(GameEvent.MSG_GAME_PREPARE_PUSH, this.on_game_prepare_push, this);
        this.on(GameEvent.MSG_UPDATE_SELF_BET, this.on_update_self_bet, this);
        this.on(GameEvent.MSG_OPEN_REWARD, this.on_open_reward, this);
        this.on(GameEvent.MSG_JACKPOT_DATA_CHANGED, this.on_jackpot_data_changed, this);
        this.on(GameEvent.MSG_JACKPOT_WIN, this.on_jackpot_win, this);
        this.on(GameEvent.MSG_JACKPOT_HINT, this.on_jackpot_hint, this);
        this.on(GameEvent.MSG_UPDATE_HOT_REWARDS, this.on_update_hot_rewards, this);
        this.on(GameEvent.MSG_BET_TYPE_COUNT_OVER, this.on_bet_type_over_push, this);
        this.on(GameEvent.MSG_SHOW_SELF_BET_HISTORY, this.on_self_bet_data_resp, this);
        this.on(GameEvent.MSG_SCENE_CHANGE, this.on_scene_change, this);

        this.on(EventMessage.GAME_NET_CONNECT, this.on_net_connect, this);
        this.on(EventMessage.GAME_NET_DISCONNECT, this.on_net_dis_connect, this);
        this.on(EventMessage.GAME_SYNC_SERVER_TIME, this.on_sync_server_time, this);

        this.setGameShow();
        this.setGameHide();
        this.init();
    }

    private init() {
        WheelCtrl.Instance.init(this.on_click_reward_item.bind(this));
        this.chipsCtrl.refresh_gears();
        this.selfCoinsBar.refresh_coins_value();
        this.refresh_conis_icon();
        this.refresh_bet_type_max();
        GameModelMgr.footballLeagueModel.cs_cur_game_info_req();
        GameModelMgr.footballLeagueModel.cs_game_history_req();
        this.initAudioState();
        this.refresh_bet_count_labels();
    }

    private initAudioState(){
        let noAudio = Utils.getQuery("noAudio");
        if(noAudio == "1"){
            GameGlobal.SoundOpen = false;
        }else if(noAudio == "0"){
            GameGlobal.SoundOpen = true;
        }
        this.audioControl.playBgm();
        this.audio_off.active = !GameGlobal.SoundOpen;
    }

    private init_auto_spin() {
        let autoSpinNode = find("game/AutoSpin", this.node)
            || find("uiFootballLeague_main/game/AutoSpin")
            || find("Canvas/uiFootballLeague_main/game/AutoSpin");
        if (!autoSpinNode) {
            return;
        }

        this.autoSpinToggle = autoSpinNode.getComponent(Toggle);
        if (!this.autoSpinToggle) {
            return;
        }

        this.autoSpinToggle.node.on(Toggle.EventType.TOGGLE, this.on_auto_spin_toggle, this);
        this.set_auto_spin_checked(false);
    }

    initSkeleton(){
        let _this =this
        this.startAnim.active = false;
        this.startAnim.getComponent(sp.Skeleton).setCompleteListener(()=>{
            _this.startAnim.active = false;
         })
        this.endAnim.active = false;
        this.endAnim.getComponent(sp.Skeleton).setCompleteListener(()=>{
            _this.endAnim.active = false;
         })
    }

    //#region Event
    protected onGameShow(): void {
        if (!oops.network.IsConnect) {
            return;
        }
        this._stopRunAnim = false;
        oops.network.onSyncTime();
    }

    protected onGameHide(): void {
        this._gameHide = true;
        this._stopRunAnim = true;
        this.countDown.clear();
        WheelCtrl.Instance.clear();
        this._gameHideRound = GameModelMgr.footballLeagueModel.get_cur_round();


        this.stop_auto_spin();
    }

    private on_net_connect() {
        this.uiHistoryScroll.needRefesh = true;
        this.chipsCtrl.refresh_gears();
        this.refresh_conis_icon();
        this.refresh_bet_type_max();
        GameModelMgr.footballLeagueModel.cs_cur_game_info_req();
        GameModelMgr.footballLeagueModel.cs_game_history_req();
    }

    private on_net_dis_connect() {
        this._stopRunAnim = true;
        this.countDown.clear();
        WheelCtrl.Instance.clear();
    }

    private on_sync_server_time() {
        if (!this._gameHide) {
            return;
        }
        this._gameHide = false;
        let curRound = GameModelMgr.footballLeagueModel.get_cur_round();
        let prepareTime = GameModelMgr.footballLeagueModel.get_cur_prepareTime_Time()
        this.update_round_info();
        this.refresh_bet_count_labels();
        this.uiHistoryScroll.show_game_history_by_client();

        if (this.check_betTime_is_valid(prepareTime)) {
            this.cut_down(prepareTime);
        } else {
            this.countDown.clear();
            //还没到下一局，但是游戏结果已经下发，给玩家弹一个结果弹窗
            if (this._rewardInfo && this._rewardInfo.round == curRound) {
                this.gameState = EGameState.Final;
                GameModelMgr.footballLeagueModel.set_game_state(EGameState.Final);
                this.enable_scene_switch();
                this.uiResult.show();
            }
        }

        if (this._hotRewardInfo) {
            WheelCtrl.Instance.show_bet_hot_rewards(GameModelMgr.footballLeagueModel.get_hot_rewards(this._hotRewardInfo));
            this._hotRewardInfo = null;
        }

        if (this._gameHideRound != curRound) {
            WheelCtrl.Instance.clear_item_bet_info();
        }

        this._gameHideRound = 0;
    }
    //#endregion


    //#region NET MSG
    private on_player_base_data_update(event: string, args: any) {
        this.selfCoinsBar.refresh_coins_value();
    }

    private on_player_coins_update(event: string, args: any) {

    }

    private on_player_reward(event: string, args: any) {
        this.selfCoinsBar.refresh_coins_value();
    }

    //进入到服务器
    private on_player_enter_game_push(event: string, args: any) {

    }

    //当前游戏信息
    private on_cur_game_info(event: string, args: any) {
        let msg = args as CsCurGameInfoResp;
        this.gameState = msg.gameState;
        GameModelMgr.footballLeagueModel.set_game_state(this.gameState);
        this.refresh_scene_toggle_state();
        this.update_round_info();
        this.refresh_bet_count_labels();

        if (this.gameState > EGameState.Run) {
            this.selectTime.active = false;
            this.selectTimeBg.active = false;
            this.countDown.clear();
            return;
        }
        if (this.gameState == EGameState.Bet) {
            this.start_bet_cut_down(msg.prepareTime);
        } else if (this.gameState == EGameState.Run) {
            this.start_run_cut_down(msg.prepareTime)
        }
        WheelCtrl.Instance.change_game_status(this.gameState);
        WheelCtrl.Instance.refresh_scene_info();
        WheelCtrl.Instance.update_item_bet_info();

        this.uiDayRevenue.update_revenue();
        this.uiRank1Info.update_rank1_info();
        WheelCtrl.Instance.show_bet_hot_rewards(GameModelMgr.footballLeagueModel.get_hot_rewards(msg));
        this.try_auto_bet_once();
    }

    //游戏开始准备推送
    private on_game_prepare_push(event: string, args: any) {
        let msg = args as ScGamePreparePush;
        this.gameState = EGameState.Bet;
        GameModelMgr.footballLeagueModel.set_game_state(EGameState.Bet);
        this.enable_scene_switch();
        this._rewardInfo = null;
        this._hotRewardInfo = null;
        this.refresh_bet_count_labels();
        if (this._gameHide) {
            return;
        }

        this._isClicking = false;
        this.update_round_info();
        WheelCtrl.Instance.change_game_status(EGameState.Bet);
        WheelCtrl.Instance.clear();
        this.betTypeOverTip.on_close();
        this.start_bet_cut_down(msg.prepareTime);
        this.try_auto_bet_once();


        //播放开始动作
        this.play_start_anim();
    }

    play_start_anim() {
        this.startAnim.active = true;
        this.startAnim.getComponent(sp.Skeleton).setAnimation(0, "animation", false);
        this.audioControl.playReady();
    }

    play_end_anim() {
        this.endAnim.active = true;
        this.endAnim.getComponent(sp.Skeleton).setAnimation(0, "animation", false);
        this.audioControl.playGameEnd();
    }

    //更新我的下注信息
    private on_update_self_bet(event: string, args: any) {
        this.selfCoinsBar.refresh_coins_value();
        WheelCtrl.Instance.update_item_bet_info();
        this.refresh_bet_count_labels();
    }

    //开奖信息
    private on_open_reward(event: string, args: any) {
        let msg = args as ScOpenRewardPush;
        this._rewardInfo = msg;
        this.gameState = EGameState.Run;
        GameModelMgr.footballLeagueModel.set_game_state(EGameState.Run);
        this.disable_scene_switch();
        this.refresh_bet_count_labels();
        this.uiHistoryScroll.set_latest_open_reward(msg);
        if (this._gameHide) {
            this.uiHistoryScroll.open_rewards(GameModelMgr.footballLeagueModel.get_zhuanpan_id());
            return;
        }

        this.betTypeOverTip.on_close();
        let zhuanpanId = GameModelMgr.footballLeagueModel.get_zhuanpan_id();
        if (!zhuanpanId) {
            return;
        }
        WheelCtrl.Instance.change_game_status(EGameState.Run);
        this.countDown.clear();
        this.curCutDown = 5;
        this.countDown.setTime(5);
        this.countDown.onSecond = this.countDown_second_func.bind(this);
        this.enter_run(zhuanpanId - 1);
    }

    private on_jackpot_win(event: string, args: any) {
        this._jackpotWinAmount = Math.max(0, Math.floor(Number(args) || 0));
        if (this.gameState == EGameState.Final) {
            this.show_jackpot_win();
        }
    }

    /** JP 数据在开奖期间到达时，等待转盘停在结果格后再更新奖池展示。 */
    private on_jackpot_data_changed() {
        if (this.gameState === EGameState.Run && !this._gameHide) {
            this._jackpotRefreshPending = true;
            return;
        }
        this.refresh_jackpot_value();
    }

    private refresh_jackpot_value() {
        this._jackpotRefreshPending = false;
        oops.message.dispatchEvent(
            GameEvent.MSG_JACKPOT_UPDATE,
            {
                value: GameModelMgr.footballLeagueModel.get_jackpot_value(),
                serverTime: oops.network.ServerTime
            }
        );
    }

    showJackpotView(jackpotAmount: number) {
        const amount = Math.max(0, Math.floor(Number(jackpotAmount) || 0));
        if (amount <= 0 || !this.jackpotView) {
            return;
        }
        const jackpotView = this.jackpotView.getComponent(JackpotView);
        if (!jackpotView) {
            console.error("JackpotView component is missing");
            return;
        }
        jackpotView.winAmount = amount;
        jackpotView.setNumberLabel(amount);
        this.jackpotView.active = true;
    }

    /**
     * 与 FruitSlots 保持一致：JP 全服提示延后展示，避免与本局结算 UI 同时出现。
     * FootballLeague 使用 Cocos 3.x 的本地跑马灯组件承载提示内容。
     */
    onJackpotHint(hint: ScJackpotHintPush) {
        const amount = Math.max(0, Math.floor(Number(hint && hint.amount) || 0));
        if (amount <= 0) {
            return;
        }
        const userName = String(hint && hint.userName || "");
        this.scheduleOnce(() => {
            if (!this.uiJackpotHint) {
                // 跑马灯固定挂在 uiFootballLeague_main/Hint（UUID: 76fd8/wtxLLJOFiaFB5Y37）下。
                const hintRoot = find("Hint", this.node);
                if (!hintRoot) {
                    console.error("FootballLeague jackpot hint root is missing");
                    return;
                }
                const marqueeNode = new Node('JackpotHintMarquee');
                marqueeNode.layer = hintRoot.layer;
                marqueeNode.parent = hintRoot;
                marqueeNode.setPosition(0, 0, 0);
                marqueeNode.addComponent(UITransform);
                this.uiJackpotHint = marqueeNode.addComponent(UIFootballLeagueJackpotHint);
            }
            this.uiJackpotHint.show(userName, amount);
        }, this.JACKPOT_DISPLAY_DELAY+3);
    }

    private on_jackpot_hint(event: string, args: ScJackpotHintPush) {
        this.onJackpotHint(args);
    }

    private on_update_hot_rewards(vent: string, args: any) {
        let msg = args as ScHotBetRewardPush;
        this._hotRewardInfo = msg;
        if (this._gameHide) {
            return;
        }
        WheelCtrl.Instance.refresh_scene_info();
        WheelCtrl.Instance.update_item_bet_info();
        WheelCtrl.Instance.show_bet_hot_rewards(GameModelMgr.footballLeagueModel.get_hot_rewards(msg));
        this.refresh_bet_count_labels();
    }

    private on_bet_type_over_push() {
        this.betTypeOverTip.on_show();
    }

    private on_self_bet_data_resp(event: string, args: any) {
        let data = {
            coinIcon: this.remote_icon_coins,
            betData: args
        }
        oops.gui.openAsync(UIID.FootballLeagueUI_MyBetsHistory, data);
    }
    //#endregion

    private update_round_info() {
        let curRound = GameModelMgr.footballLeagueModel.get_cur_round();
        let r = Utils.getRound(curRound);
        this.lb_round.string = oops.language.getLanguage("common_Round_text", r);
    }

    private init_bet_count_labels() {
        this.lb_selfBetTotal = this.get_label_by_path("game/ChipCount/heidi1/str");
        this.lb_allBetTotal = this.get_label_by_path("game/ChipCount/heidi2/str");
        this.lb_hotTeamName = this.get_label_by_path("game/ChipCount/heidi3/str");
        this.refresh_bet_count_labels();
    }

    private get_label_by_path(path: string): Label {
        let labelNode = find(path, this.node)
            || find("uiFootballLeague_main/" + path)
            || find("Canvas/uiFootballLeague_main/" + path);
        return labelNode ? labelNode.getComponent(Label) : null;
    }

    private refresh_bet_count_labels() {
        if (this.lb_selfBetTotal) {
            this.lb_selfBetTotal.string = this.format_bet_count(GameModelMgr.footballLeagueModel.getSelfBetClientTotalAllScene());
        }
        if (this.lb_allBetTotal) {
            this.lb_allBetTotal.string = this.format_bet_count(GameModelMgr.footballLeagueModel.getAllBetTotalAllScene());
        }
        if (this.lb_hotTeamName) {
            const sceneType = GameModelMgr.footballLeagueModel.get_scene_type();
            const teamId = GameModelMgr.footballLeagueModel.get_hot_team_id(sceneType);
            this.lb_hotTeamName.string = this.TeamName[sceneType - 1]?.[teamId - 1] || this.TeamName[sceneType - 1]?.[7];
        }
    }

    private format_bet_count(value: number): string {
        return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('en-US');
    }

    private start_bet_cut_down(prepareTime: number) {
        WheelCtrl.Instance.clear_item_bet_info();
        if (!this.check_betTime_is_valid(prepareTime)) {
            return;
        }
        this.cut_down(prepareTime);
    }

    private cut_down(prepareTime) {
        let t = this.cfgBetTime - (UtilTime.getTime() - prepareTime);
        this.curCutDown = t;
        this.countDown.onComplete = this.bet_countDown_complete.bind(this);
        this.countDown.onSecond = this.countDown_second_func.bind(this);
        this.countDown.setTime(t);
        this.selectTime.active = true;
        this.selectTimeBg.active = true;
        WheelCtrl.Instance.change_game_status(EGameState.Bet);
    }

    bet_countDown_complete() {
        this.selectTime.active = false;
        this.selectTimeBg.active = false;
    }

    countDown_second_func(node: Node, second: number) {
        this.curCutDown = second;
        if (this.gameState == EGameState.Bet) {
            WheelCtrl.Instance.enter_bet(second);

            if (second == 1) {
                this.play_end_anim();
            }

            if (second <= 3 && second > 0) {
                this.audioControl.playCountDown();
            }else if (second == 0) {
                this.audioControl.playCountDownEnd();
            }
        }
    }

    private start_run_cut_down(timestamp: number) {
        let t = (this.cfgBetTime + 5) - (UtilTime.getTime() - timestamp);
        WheelCtrl.Instance.enter_bet(t);
    }

    private play_chip_fly_to_reward(rewardId: number, startPos: Vec3) {
        let rewardPos = WheelCtrl.Instance.get_reward_item_world_pos(rewardId);
        let endPos: Vec3 = this.chipFlyRoot.getComponent(UITransform)!.convertToNodeSpaceAR(rewardPos);
        if (startPos == null || endPos == null) {
            return;
        }

        let item = null;
        if (this.chipFlyPool.length <= 0) {
            item = instantiate(this.chipFlyItem);
            item.parent = this.chipFlyRoot;
        } else {
            item = this.chipFlyPool.pop();
        }

        if (item == null) {
            console.error("play_chip_fly_to_reward is nil");
            return;
        }
        Tween.stopAllByTarget(item);
        item.setWorldPosition(startPos);
        item.active = true;
        tween(item)
            .to(0.3, { position: endPos })
            .call(() => {
                //this.audioControl.playChipFall();
                GameGlobal.playAudio(AudioPath.ChipFall);
                item.active = false;
                this.chipFlyPool.push(item);
            })
            .start();
    }

    private check_can_bet(rewardID: number) {
        if (!rewardID || rewardID <= 0) {
            return false;
        }

        if (!this.has_bet_time_remaining()) {
            oops.gui.toast("common_wait", true);
            return false;
        }

        if (!this.check_betTime_is_valid(GameModelMgr.footballLeagueModel.get_cur_prepareTime_Time()-1)) {
            oops.gui.toast("common_wait", true);
            return false;
        }

        if (this.check_bet_type_over(rewardID)) {
            this.betTypeOverTip.on_show();
            return false;
        }

        if (this.chipsCtrl.get_bet_value() <= 0) {
            return false;
        }

        if (!oops.network.checkCoinsEnough(this.chipsCtrl.get_bet_value())) {
            oops.gui.showRechargeUI();
            return false;
        }

        if (!GameModelMgr.playerModel.check_sdk_valid()) {
            //oops.gui.showAccounErrortUI();
            oops.gui.toast("common_bet_error", true);
            return false;
        }

        if (this.gameState != EGameState.Bet) {
            return false;
        }
        return true;
    }

    private async on_click_reward_item(rewardId: number) {
        if (this._isClicking) return;
        this._isClicking = true;

        if (!this.check_can_bet(rewardId)) {
            this._isClicking = false;
            return;
        }

        let betValue = this.chipsCtrl.get_bet_value()
        if (betValue <= 0) {
            return;
        }

        let pos = this.chipsCtrl.get_chip_item_pos(betValue);
        this.play_chip_fly_to_reward(rewardId, pos);

        let msg: CsBetReq = {
            team_id: GameModelMgr.footballLeagueModel.get_team_id(),
            sceneType: GameModelMgr.footballLeagueModel.get_scene_type(),
            betList: [
                {
                    rewardID: rewardId,
                    chipValue: betValue,
                    chipCount: 1
                }
            ]
        };
        GameModelMgr.footballLeagueModel.cs_bet_req(msg);
        GameModelMgr.playerModel.set_player_coins(-betValue);
        GameModelMgr.footballLeagueModel.set_cur_bet_map_client(rewardId, betValue)
        this.refresh_bet_count_labels();
        GameGlobal.playAudio(AudioPath.Click);

        // 冷却时间
        await new Promise(res => setTimeout(res, this.CLICK_DELAY));
        this._isClicking = false;
    }

    private check_betTime_is_valid(timestamp: number) {
        if (timestamp <= 0) {
            return false;
        }
        let nowTime = UtilTime.getTime();
        let timeOffset = nowTime - timestamp;
        let valid = timeOffset <= this.cfgBetTime && timeOffset >= 0;
        return valid;
    }

    /** 预留网络往返时间；显示倒计时少于 3 秒时不再发起下注。 */
    private has_bet_time_remaining(): boolean {
        const prepareTime = GameModelMgr.footballLeagueModel.get_cur_prepareTime_Time();
        const remainingTime = this.cfgBetTime - (UtilTime.getTime() - prepareTime);
        return remainingTime >= 3;
    }

    private check_bet_type_over(rewardId: number): boolean {
        let betMap = GameModelMgr.footballLeagueModel.get_cur_bet_map_client();
        if (betMap.has(rewardId)) {
            return false;
        }

        return betMap.size >= this._betTypeMax
    }


    //#region 滚动
    private async enter_run(resultIndex) {
        this._stopRunAnim = false;

        for (let i = 0; this.curCutDown > 2; i++) {
            if (this._stopRunAnim) {
                this.uiHistoryScroll.open_rewards(resultIndex + 1);
                return;
            }
            //GlobalWheel.playAudio(AudioPath.Run, 0.4);
            this.play_audio_run();
            await new Promise(resolve => setTimeout(resolve, 60));
            WheelCtrl.Instance.enter_run(this.curCutDown);
        }
        let target = resultIndex + 1;
        let begin = WheelCtrl.Instance.runIndex;
        if (target < begin) target += 8;
        if (target - begin <= 4) {
            for (let i = begin; i < target; i++) {
                if (this._stopRunAnim) {
                    this.uiHistoryScroll.open_rewards(resultIndex + 1);
                    return;
                }
                //GlobalWheel.playAudio(AudioPath.Run, 0.4);
                this.play_audio_run();
                await new Promise(resolve => setTimeout(resolve, 60 + (i - begin) * 8));
                WheelCtrl.Instance.enter_run(this.curCutDown);
            }
        }
        begin = WheelCtrl.Instance.runIndex;
        if (target < begin) target += 8;
        for (let i = begin; i < target; i++) {
            if (this._stopRunAnim) {
                this.uiHistoryScroll.open_rewards(resultIndex + 1);
                return;
            }
            if (i < target - 2) {
                //GlobalWheel.playAudio(AudioPath.Run, 0.4);
                this.play_audio_run();
            }
            await new Promise(resolve => setTimeout(resolve, 90 + (i - begin) * 10));
            WheelCtrl.Instance.enter_run(this.curCutDown);
        }
        await this.enter_run2_final(resultIndex);
    }

    private async enter_run2_final(resultIndex) {
        let inFinal = false;
        let i = 0;
        while (!inFinal) {
            if (this._stopRunAnim) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 250 + (i++ * 10)));
            //GlobalWheel.playAudio(AudioPath.Run, 0.4);
            this.play_audio_run();
            inFinal = WheelCtrl.Instance.enter_run2_final(resultIndex);
        }
        // while (this.gameState != EGameState.Final) {
        //     await new Promise(resolve => setTimeout(resolve, 100));
        // }
        GameGlobal.playAudio(AudioPath.Final);
        this.enter_final();
    }

    private async enter_final() {
        this.gameState = EGameState.Final;
        GameModelMgr.footballLeagueModel.set_game_state(EGameState.Final);
        // 盘面滚动已结束，此时才把本局结算后的 JP 值交给数字滚动组件。
        if (this._jackpotRefreshPending) {
            this.refresh_jackpot_value();
        }
        this.enable_scene_switch();
        this.selfCoinsBar.refresh_coins_value();
        this.uiDayRevenue.update_revenue();
        this.uiRank1Info.update_rank1_info();
        this.uiHistoryScroll.update_items(GameModelMgr.footballLeagueModel.get_zhuanpan_id());

        let errcode = GameModelMgr.footballLeagueModel.get_result_errorcode();
        if(errcode && errcode != 0){
            oops.gui.showErrorCode(errcode);
        }else{
            this.uiResult.show();
            this.show_jackpot_win();
            //打印自己盈利
            if(GameModelMgr.footballLeagueModel.getCurWinNum() > 0){
                this.audioControl.playWin();
            }
            
        }
    }

    private show_jackpot_win() {
        const amount = this._jackpotWinAmount || GameModelMgr.footballLeagueModel.get_jackpot_win_amount();
        if (amount <= 0) {
            return;
        }
        this._jackpotWinAmount = 0;
        this.scheduleOnce(() => this.showJackpotView(amount), this.JACKPOT_DISPLAY_DELAY);
    }

    private play_audio_run() {
        if (!GameGlobal.SoundOpen) {
            return;
        }
        if (this._gameHide) {
            return;
        }
        this.audio_run.play();
    }

    //#endregion

    //#region Click Event
    private on_click_exit_btn() {
        oops.network.quit();
    }

    private on_click_help() {
        GameGlobal.playAudio(AudioPath.Click);
        oops.gui.openAsync(UIID.FootballLeagueUI_Help);
    }

    private on_click_my_history() {
        GameGlobal.playAudio(AudioPath.Click);
        GameModelMgr.footballLeagueModel.cs_self_bet_history_req();
    }

    private on_click_audio() {
        GameGlobal.SoundOpen = !GameGlobal.SoundOpen;
        this.audio_off.active = !GameGlobal.SoundOpen;
        if (GameGlobal.SoundOpen) {
            GameGlobal.playAudio(AudioPath.Click);
        }
        GameModelMgr.footballLeagueModel.cs_audio_change_req(GameGlobal.SoundOpen);
    }

    private on_auto_spin_toggle(toggle: Toggle) {
        if (this._isAutoSpinInternalChange) {
            return;
        }

        this.openAuto = toggle.isChecked;
        GameGlobal.playAudio(AudioPath.Click);
        if (!this.openAuto) {
            return;
        }

        if (!GameModelMgr.footballLeagueModel.check_can_open_auto()) {
            this.stop_auto_spin();
            oops.gui.toast("common_wait", true);
            return;
        }

        this.try_auto_bet_once();
    }

    private try_auto_bet_once() {
        if (!this.openAuto || this._autoBetting || this.gameState != EGameState.Bet) {
            return;
        }

        if (!this.has_bet_time_remaining()) {
            return;
        }

        let curRound = GameModelMgr.footballLeagueModel.get_cur_round();
        if (!curRound || this._autoBetRound == curRound) {
            return;
        }

        let requests = GameModelMgr.footballLeagueModel.get_repeat_bet_requests_all_scene();
        if (requests.length <= 0) {
            return;
        }

        let total = GameModelMgr.footballLeagueModel.get_repeat_total_all_scene();
        if (total <= 0) {
            this.stop_auto_spin();
            return;
        }

        if (!oops.network.checkCoinsEnough(total)) {
            this.stop_auto_spin();
            oops.gui.showRechargeUI();
            return;
        }

        if (!GameModelMgr.playerModel.check_sdk_valid()) {
            this.stop_auto_spin();
            oops.gui.toast("common_bet_error", true);
            return;
        }

        this._autoBetRound = curRound;
        this._autoBetting = true;
        for (let i = 0; i < requests.length; i++) {
            GameModelMgr.footballLeagueModel.cs_bet_req(this.clone_bet_req(requests[i]));
            this.add_client_bet_by_request(requests[i]);
        }
        GameModelMgr.playerModel.set_player_coins(-total);
        this.refresh_bet_count_labels();
        this._autoBetting = false;
    }

    private add_client_bet_by_request(req: CsBetReq) {
        let sceneType = req.sceneType || req.team_id || GameModelMgr.footballLeagueModel.get_scene_type();
        for (let item of req.betList || []) {
            let betValue = (Number(item.chipValue) || 0) * (Number(item.chipCount) || 0);
            if (item.rewardID > 0 && betValue > 0) {
                GameModelMgr.footballLeagueModel.set_scene_bet_map_client(sceneType, item.rewardID, betValue);
            }
        }
    }

    private clone_bet_req(req: CsBetReq): CsBetReq {
        let betList: BetData[] = [];
        for (let item of req.betList || []) {
            betList.push({
                rewardID: item.rewardID,
                chipValue: item.chipValue,
                chipCount: item.chipCount
            });
        }
        return {
            team_id: req.team_id || req.sceneType || GameModelMgr.footballLeagueModel.get_team_id(),
            sceneType: req.sceneType,
            betList: betList
        };
    }

    private stop_auto_spin() {
        this.openAuto = false;
        this.set_auto_spin_checked(false);
    }

    private set_auto_spin_checked(value: boolean) {
        if (!this.autoSpinToggle) {
            return;
        }
        this._isAutoSpinInternalChange = true;
        this.autoSpinToggle.isChecked = value;
        this._isAutoSpinInternalChange = false;
    }
    //#endregion


    refresh_conis_icon() {
        let cfg = oops.network.getgetClientConfig();
        if (cfg && cfg.coinUrl && cfg.coinUrl != "") {
            oops.res.loadRemote(cfg.coinUrl, { ext: '.png' }, (error, imageAsset) => {
                if (imageAsset) {
                    this.remote_icon_coins = SpriteFrame.createWithImage(imageAsset);
                    this.retainCoinIcon(this.remote_icon_coins, imageAsset as Asset);
                    WheelCtrl.Instance.update_item_icon_coins(this.remote_icon_coins);
                    this.chipsCtrl.update_item_icon_coins(this.remote_icon_coins);
                    this.uiDayRevenue.update_icon_coins(this.remote_icon_coins);
                    this.uiRank1Info.update_icon_coins(this.remote_icon_coins);
                    this.selfCoinsBar.refresh_coins_icon_by_sp(this.remote_icon_coins);
                }
            });
        }
    }

    //#region 共享金币图标引用管理
    protected onDestroy(): void {
        this.releaseCoinIcons();
        super.onDestroy();
    }

    private retainCoinIcon(frame: SpriteFrame, source: Asset) {
        const texture = this.getSpriteFrameTexture(frame);
        if (frame && isValid(frame)) {
            frame.addRef();
        }
        if (texture && isValid(texture)) {
            texture.addRef();
        }
        if (source && isValid(source)) {
            source.addRef();
        }
        this.remote_coin_icon_refs.push({ frame, texture, source });
    }

    private releaseCoinIcons() {
        for (let i = 0; i < this.remote_coin_icon_refs.length; i++) {
            const ref = this.remote_coin_icon_refs[i];
            if (ref.frame && isValid(ref.frame)) {
                ref.frame.decRef();
            }
            if (ref.texture && isValid(ref.texture)) {
                ref.texture.decRef();
            }
            if (ref.source && isValid(ref.source)) {
                ref.source.decRef();
            }
        }
        this.remote_coin_icon_refs.length = 0;
        this.remote_icon_coins = null;
    }

    private getSpriteFrameTexture(spriteFrame: SpriteFrame): Asset {
        if (!spriteFrame) {
            return null;
        }
        return (spriteFrame.texture || (spriteFrame as any)._texture) as Asset;
    }
    //#endregion

    refresh_bet_type_max() {
        let maxValue = 0;
        let cfg = oops.network.getCommonConfig();
        //@ts-ignore
        if (!cfg || !cfg.custom || !cfg.custom.betTypeMax) {
            console.error("jsNet cfg.custom.betTypeMax is nil");
            let max = ConstantCfgMgr.getValue(ConstantKey.BetTypeMax);
            if (!max) {
                console.error("default betTypeMax cfg is nil");
                return;
            }
            maxValue = max
        } else {
            //@ts-ignore
            maxValue = cfg.custom.betTypeMax;
        }
        this._betTypeMax = maxValue;
        this.betTypeOverTip.refresh_tip_content(maxValue);
    }

    private on_scene_change() {
        this.chipsCtrl.refresh_gears();
        WheelCtrl.Instance.update_item_bet_info();
        this.uiHistoryScroll.needRefesh = true;
        GameModelMgr.footballLeagueModel.cs_game_history_req();
        this.uiDayRevenue.update_revenue();
        this.uiRank1Info.update_rank1_info();
        this.refresh_bet_count_labels();
    }

    private refresh_scene_toggle_state() {
        if (this.gameState == EGameState.Run) {
            this.disable_scene_switch();
        } else {
            this.enable_scene_switch();
        }
    }

    private disable_scene_switch() {
        const teamControl = this.get_team_control();
        if (teamControl) {
            teamControl.disableToggles();
        }
    }

    private enable_scene_switch() {
        const teamControl = this.get_team_control();
        if (teamControl) {
            teamControl.enableToggles();
        }
    }

    private get_team_control(): UITeamControl {
        if (!this.uiTeamControl) {
            this.uiTeamControl = this.node.getComponent(UITeamControl) || this.node.getComponentInChildren(UITeamControl);
        }
        return this.uiTeamControl;
    }
}


