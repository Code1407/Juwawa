import { Toggle } from 'cc';
import { Sprite } from 'cc';
import { SpriteFrame } from 'cc';
import { _decorator, Component, find, Node } from 'cc';
import { UIRewardItem } from './UIRewardItem';
import GameModelMgr from '../../mvc/GameModelMgr';
import { EGameState } from '../WheelGlobal';
import { oops } from 'db://oops-framework/core/Oops';
import { GameEvent } from '../../common/GameEvent';
import { Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UITeamControl')
export class UITeamControl extends Component {
    //ToggleGroup
    @property([Toggle])
    public toggles: Toggle[] = [];

    //游戏背景
    @property({type: Node, displayName: '游戏背景'})
    public gameBackgroundNode: Node = null;

    //顶部标签背景
    @property({type: Node, displayName: '顶部标签背景'})
    public topLabelBackgroundNode: Node = null;

    //顶部标签节点
    @property({type: [Node], displayName: '顶部标签节点'})
    public topLabelNode: Node[] = [];

    //中部球队默认背景
    @property({type: [Node], displayName: '中部球队默认背景'})
    public middleTeamDefaultNode: Node[] = [];

    //中部倒计时节点
    @property({type: Node, displayName: '中部倒计时节点'})
    public middleTeamCountdownNode: Node = null;

    //底部充值按钮
    @property({type: Node, displayName: '底部充值按钮'})
    public bottomRechargeNode: Node = null;


    //三张背景
    @property({type: [SpriteFrame], displayName: '三张背景'})
    public threeTeamBackgroundNode: SpriteFrame[] = [];
    //顶部标签背景
    @property({type: [SpriteFrame], displayName: '顶部标签背景'})
    public topLabelSpriteFrame: SpriteFrame[] = [];
    //Toggle选中背景
    @property({type: [SpriteFrame], displayName: 'Toggle选中背景'})
    public topLabelSelectedSpriteFrame: SpriteFrame[] = [];
    //中部球队默认背景
    @property({type: [SpriteFrame], displayName: '中部球队默认背景'})
    public middleTeamDefaultSpriteFrame: SpriteFrame[] = [];
    //中部球队倒计时背景
    @property({type: [SpriteFrame], displayName: '中部球队倒计时背景'})
    public middleTeamCountdownSpriteFrame: SpriteFrame[] = [];
    //中部倒计时提示文本背景
    @property({type: [SpriteFrame], displayName: '中部倒计时提示文本背景'})
    public middleTeamCountdownTextSpriteFrame: SpriteFrame[] = [];
    //底部充值按钮背景
    @property({type: [SpriteFrame], displayName: '底部充值按钮背景'})
    public bottomRechargeSpriteSpriteFrame: SpriteFrame[] = [];


    //JP节点
    @property({type: Node, displayName: 'JP节点'})
    public jpNode: Node = null;

    private _isInternalChange: boolean = false;



    //根据Index修改背景
    public setGameBackgroundSpriteFrame(index: number) {
        const backgroundFrame = this.getSceneSpriteFrame(this.threeTeamBackgroundNode, index, "threeTeamBackgroundNode");
        this.setNodeSpriteFrame(this.gameBackgroundNode, backgroundFrame, "gameBackgroundNode");  //主背景

        const topLabelFrame = this.getSceneSpriteFrame(this.topLabelSpriteFrame, index, "topLabelSpriteFrame");
        this.setNodeSpriteFrame(this.topLabelBackgroundNode, topLabelFrame, "topLabelBackgroundNode"); //Toggle背景

        //底部充值按钮背景
        const bottomRechargeFrame = this.getSceneSpriteFrame(this.bottomRechargeSpriteSpriteFrame, index, "bottomRechargeSpriteSpriteFrame");
        this.setNodeSpriteFrame(this.bottomRechargeNode, bottomRechargeFrame, "bottomRechargeNode"); //底部充值按钮背景

        const countdownNode = this.middleTeamCountdownNode && this.middleTeamCountdownNode.getChildByName("qiuwang1");
        const countdownFrame = this.getSceneSpriteFrame(this.middleTeamCountdownSpriteFrame, index, "middleTeamCountdownSpriteFrame");
        this.setNodeSpriteFrame(countdownNode, countdownFrame, "middleTeamCountdownNode/qiuwang1"); //中部倒计时背景

        const countdownTextNode = countdownNode && countdownNode.getChildByName("lantiao");
        const countdownTextFrame = this.getSceneSpriteFrame(this.middleTeamCountdownTextSpriteFrame, index, "middleTeamCountdownTextSpriteFrame");
        this.setNodeSpriteFrame(countdownTextNode, countdownTextFrame, "middleTeamCountdownNode/qiuwang1/lantiao"); //中部倒计时背景

        //8个球队背景
        const teamDefaultFrame = this.getSceneSpriteFrame(this.middleTeamDefaultSpriteFrame, index, "middleTeamDefaultSpriteFrame");
        for (let i = 0; i < this.middleTeamDefaultNode.length; i++) {
            const teamBgNode = this.middleTeamDefaultNode[i]
                && this.middleTeamDefaultNode[i].getChildByName("item")
                && this.middleTeamDefaultNode[i].getChildByName("item").getChildByName("bg1");
            this.setNodeSpriteFrame(teamBgNode, teamDefaultFrame, `middleTeamDefaultNode[${i}]/item/bg1`);
        }
        
        //顶部3个toggle选中标签个背景
        const topLabelSelectedFrame = this.getSceneSpriteFrame(this.topLabelSelectedSpriteFrame, index, "topLabelSelectedSpriteFrame");
        for (let i = 0; i < this.topLabelNode.length; i++) {
            this.setNodeSpriteFrame(this.topLabelNode[i], topLabelSelectedFrame, `topLabelNode[${i}]`);
        }
    }

    private getSceneSpriteFrame(spriteFrames: SpriteFrame[], index: number, debugName: string): SpriteFrame | null {
        const frame = spriteFrames && spriteFrames[index];
        if (!frame) {
            console.error(`UITeamControl ${debugName} missing SpriteFrame, sceneIndex:${index}`);
            return null;
        }
        return frame;
    }

    private setNodeSpriteFrame(node: Node | null, spriteFrame: SpriteFrame | null, debugName: string) {
        if (!node) {
            console.error(`UITeamControl ${debugName} missing node`);
            return;
        }
        if (!spriteFrame) {
            return;
        }
        const sprite = node.getComponent(Sprite);
        if (!sprite) {
            console.error(`UITeamControl ${debugName} missing Sprite component`);
            return;
        }
        sprite.spriteFrame = spriteFrame;
    }


    

    start() {
        //ToggleGroup 监听
        this.initToggles();
        this.setGameBackgroundSpriteFrameByServer(GameModelMgr.footballLeagueModel.get_team_id() - 1);

         oops.message.dispatchEvent(GameEvent.MSG_JACKPOT_UPDATE, {
            value: GameModelMgr.footballLeagueModel.get_jackpot_value(),
            serverTime: oops.network.ServerTime
        });
            
    }

     /**
     * 初始化所有 Toggle 的监听事件
     */
    initToggles() {
        for (let i = 0; i < this.toggles.length; i++) {
            const toggle = this.toggles[i];
            
            // 创建组件回调事件
            toggle.checkEvents = []; 
            let componentEventHandler =  new Component.EventHandler();
            componentEventHandler.target = this.node; // 事件回调所在的节点（当前脚本挂载的节点）
            componentEventHandler.component = 'UITeamControl'; // 脚本类名
            componentEventHandler.handler = 'onToggleCheckChanged'; // 回调方法名
            
            // 传递参数：将 Toggle 的索引作为参数传递，方便区分是哪个按钮
            componentEventHandler.customEventData = i.toString();

            // 将回调事件 push 到 Toggle 的 checkEvents 数组中
            toggle.checkEvents.push(componentEventHandler);
        }
    }

    //禁止toggles点击
    public disableToggles() {
        for (let i = 0; i < this.toggles.length; i++) {
            const toggle = this.toggles[i];
            toggle.interactable = false;
        }

        //父节点透明度降低
        this.topLabelBackgroundNode.opacity = 175;
        
    }

    public enableToggles() {
        for (let i = 0; i < this.toggles.length; i++) {
            const toggle = this.toggles[i];
            toggle.interactable = true;
        }
        this.topLabelBackgroundNode.opacity = 255;
    }


        /**
     * 统一处理 Toggle 选中状态改变的回调函数
     * @param toggleInstance 触发该事件的 Toggle 组件实例（系统自动传入，原 isChecked 位置）
     * @param eventData 自定义事件数据（我们传入的索引字符串）
     */
    onToggleCheckChanged(toggleInstance: Toggle, eventData: string) {
        if (this._isInternalChange || !toggleInstance.isChecked) {
            return;
        }

        if (GameModelMgr.footballLeagueModel.get_game_state() == EGameState.Run) {
            oops.gui.toast("common_wait", true);
            this.selectToggle(GameModelMgr.footballLeagueModel.get_scene_index());
            return;
        }

        let teamId = Number(eventData) + 1;

        this.setGameBackgroundSpriteFrameByServer(Number(eventData));
        GameModelMgr.footballLeagueModel.cs_team_change_req(teamId);
    }

    //接受到后端返回进行切换背景
    public setGameBackgroundSpriteFrameByServer(index: number) {
        index = Math.max(0, Math.min(2, Number(index) || 0));
        GameModelMgr.footballLeagueModel.set_team_id(index + 1);
        this.selectToggle(index);
        this.setGameBackgroundSpriteFrame(index);

        //球队队标进行修改   倍率进行修改

        for (let i = 0; i < this.middleTeamDefaultNode.length; i++) {
            this.middleTeamDefaultNode[i].getComponent(UIRewardItem).setTeamInfo(index);
        }

        let jpNode = this.getJpNode();
        if (jpNode) {
            jpNode.active = index == 2;

             //显示
            this.middleTeamCountdownNode.getChildByName("qiuwang1").active = index !== 2;
        }


        if (index == 2) {
        
            //修改时间位置 与大小
           this.middleTeamCountdownNode.getChildByName("bg").position = new Vec3(0, 60, 0);
           this.middleTeamCountdownNode.getChildByName("bg").scale = new Vec3(0.8, 0.8, 1);
        }else{
            //修改时间位置 与大小
           this.middleTeamCountdownNode.getChildByName("bg").position = new Vec3(-64, -32, 0);
           this.middleTeamCountdownNode.getChildByName("bg").scale = new Vec3(1, 1, 1);
        }


          
    }

    private selectToggle(index: number) {
        if (!this.toggles || !this.toggles[index]) {
            return;
        }
        this._isInternalChange = true;
        this.toggles[index].isChecked = true;
        this._isInternalChange = false;
    }

    private getJpNode(): Node {
        if (this.jpNode) {
            return this.jpNode;
        }
        this.jpNode = find("game/Wheels/BetTime/Jackpot", this.node)
            || find("uiFootballLeague_main/game/Wheels/BetTime/Jackpot")
            || find("Canvas/uiFootballLeague_main/game/Wheels/BetTime/Jackpot");
        return this.jpNode;
    }
}


