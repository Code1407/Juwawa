// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { Effect } from "./effect/BaseEffect";
import { gBetAmounts, gGameData } from "./GameData";
import AmountSelectorUI from "./ui/AmountSelectorUI";
import Game from "./Game";
import { lineCount } from "./interface/IMageJackpot";
import { setRechargeView, updateAutoQuit } from "../shared2/GlobalViewsLoader";
import { EGameStatus } from "../shared3/interface/IGame";
import AudioCtrl from "../shared3/AudioCtrl_shared3";
import { AudioClip } from "./AudioClip_MageJackpot";
import { LocalizedSprite } from "../lang/LocalizedSprite";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bottombar extends cc.Component {

    /** 兼容当前 Cocos 版本的 Toggle 状态变更事件名。 */
    private readonly toggleChangedEvent: string = ((<any>cc.Toggle).EventType || {}).TOGGLE || "toggle";
    /** 急速下每列仅保留一个滚动步，再以短回弹停稳。 */
    static readonly TurboSpinRemain: number = 1;
    /** Auto/Turbo 按下时相对各自原始尺寸的放大倍率。 */
    private static readonly TogglePressScale: number = 1.1;

    @property(cc.Label)
    winAmount: cc.Label = null;

    @property({type: [cc.SpriteFrame],displayName:"小结算背景"})
    m_SpriteMode: cc.SpriteFrame[] = [];

    @property(cc.Node)
    freeNode: cc.Node = null;

    @property(cc.Label)
    freeTime: cc.Label = null;

    @property(cc.Node)
    diamondImage: cc.Node = null;

    @property(cc.Node)
    increaseAmount: cc.Node = null;

    private inSwitch: boolean = false;
    private freeWinTotal: number = 0;
    private colorGolden = new cc.Color(0xFE, 0xEC, 0x51);
    private canPress: boolean = true;
    // A new value animation invalidates any older animation that is still waiting
    // on its timer.  Without this, two consecutive wins can overwrite each other.
    private winAmountUpdateId: number = 0;
    /** 下注流程使用的冷却状态。 */
    coolDown: boolean = false;
    /** 手动下注后，Spin 动画结束前允许再按一次来快速停轮。 */
    private isSpinAnimationWindow: boolean = false;
    /** 本局已关闭下注按钮；只在下一次进入下注阶段时恢复。 */
    private isSpinDisabledForRound: boolean = false;


    //下注按钮
    @property({type: cc.Node,displayName:"下注按钮"})
    betNode: cc.Node = null;

    //急速复选框
    @property({type: cc.Node,displayName:"急速复选框"})
    autoBetNode: cc.Node = null;

    //自动复选框
    @property({type: cc.Node,displayName:"自动复选框"})
    autoSpinNode: cc.Node = null;

    private autoSpinBaseScale: number = 1;
    private turboBaseScale: number = 1;


    @property({type: [cc.SpriteFrame],displayName:"免费模式背景"})
    private m_spriteFrame: cc.SpriteFrame[] = [];

    static get Instance() {
        return cc.find("Canvas/Bottombar").getComponent(Bottombar);
    }

    private get autoToggle(): cc.Toggle {
        return this.autoSpinNode && this.autoSpinNode.getComponent(cc.Toggle);
    }

    private get turboToggle(): cc.Toggle {
        return this.autoBetNode && this.autoBetNode.getComponent(cc.Toggle);
    }

    isFreeStatus(): boolean {
        return !!this.freeNode && this.freeNode.active;
    }

    isAuto(): boolean {
        return !!this.autoToggle && this.autoToggle.isChecked;
    }

    isAutoBet(): boolean {
        return this.isAuto();
    }

    isTurboMode(): boolean {
        return !!this.turboToggle && this.turboToggle.isChecked;
    }

    setAutoBet(auto: boolean): void {
        const toggle = this.autoToggle;
        if (toggle) toggle.isChecked = auto;
        (<any>window).isAutoBetActive = auto;
    }

    setCanPress(canPress: boolean) {
        this.canPress = canPress;
    }

    canSpin() {
        return !this.isFreeStatus() && !this.isAuto()
            && gGameData.status == EGameStatus.bet && this.canPress;
    }

    canStop() {
        return !this.isFreeStatus() && !this.isAuto()
            && gGameData.status == EGameStatus.run && this.canPress;
    }

    hideAutoButton() {
        if (this.autoSpinNode) this.autoSpinNode.active = false;
    }

    inSwitchStatus() {
        return this.inSwitch;
    }

    getWinAmountLabel() {
        return this.winAmount;
    }

    getFreeWinTotal() {
        return this.freeWinTotal;
    }

    resetNormal() {
        this.winAmount.string = "0";
        this.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
    }

    resetFree() {
        this.winAmount.string = "0";
        this.freeTime.string = gGameData.freeCount.toString();
        this.hideSpin();

        //免费模式次数显示
       console.log("免费模式次数显示",gGameData.freeCount);
    }

    showIncreaseAmount(amount: number) {
        Effect.flyIncrAmount(this.increaseAmount.parent, this.increaseAmount, amount);
    }

    initBottomData() {
        this.freeWinTotal = 0;
    }

    async setWinAmount(amount: number): Promise<void> {
        const updateId = ++this.winAmountUpdateId;
        this.winAmount.node.color = amount == 0 ? cc.Color.WHITE : this.colorGolden;
        this.winAmount.node.color = this.freeWinTotal == 0 && amount == 0 ? cc.Color.WHITE : this.colorGolden;
        
        // Keep zero-value resets valid; the old calculation used 0 / 0 here.
        let split = Math.max(1, Math.min(10, Math.ceil(Math.abs(amount))));
        let amountSplit = amount / split;
        let winAmount = this.freeWinTotal;
        this.freeWinTotal += this.isFreeStatus() ? amount : 0;
        this.winAmount.string = Math.round(winAmount).toString();
        for (let i = 0; i < split; i++) {
            if (updateId != this.winAmountUpdateId) return;
            winAmount += amountSplit;
            this.winAmount.string = Math.round(winAmount).toString();
            await new Promise(resolve => setTimeout(resolve, 50));
        }

       
         this.showWinAmountAnimation(winAmount);
           
        

    }
    //显示小结算   播放骨骼动画
    showWinAmountAnimation(amount: number) {
        this.winAmount.node.parent.active = amount != 0;
        if (this.winAmount.node.parent.active) {
             let winAnimnode = this.winAmount.node.parent.getChildByName("Animnode");
            winAnimnode.getComponent(sp.Skeleton).setAnimation(0, "win", false);
            winAnimnode.getComponent(sp.Skeleton).addAnimation(0, "static", true);

            let Animation = winAnimnode.getComponent(sp.Skeleton);
            //直接换图  回修改内存中这个spine动画插槽， 所有用到这个动画资源的动画都会被修改
			// let att = Animation.skeletonData.getRuntimeData().defaultSkin.attachments[0]["shared/JackpotBoard/midWin_board"];

            // console.log("直接换图---------",Animation.skeletonData.getRuntimeData().defaultSkin.attachments);
			// let region = this.CreateRegion(this.m_SpriteMode[0].getTexture()) 
			// att.region = region
			// att.setRegion(region)
			// att.updateOffset()
        }
        this.node.getChildByName("Title").active = amount == 0;  
    }


    //替换Skeleton动画内部图片  texture不能有另外的使用  不能异步
	CreateRegion(texture:cc.Texture2D,bAuto = false) {
		try {
			//@ts-ignore
			let skeletonTexture = new sp.SkeletonTexture()//ts接口未开 
			skeletonTexture.setRealTexture(texture)
			let page = new sp.spine.TextureAtlasPage()
			page.name = texture.name
			page.uWrap = sp.spine.TextureWrap.ClampToEdge
			page.vWrap = sp.spine.TextureWrap.ClampToEdge
			page.texture = skeletonTexture
			page.texture.setWraps(page.uWrap, page.vWrap)
			page.width = texture.width
			page.height = texture.height

			let region = new sp.spine.TextureAtlasRegion()
			region.page = page
			region.width = texture.width
			region.height = texture.height
			region.originalWidth = texture.width
			region.originalHeight = texture.height

			region.rotate = false
			region.u = 0
			region.v = 0
			region.u2 = 1
			region.v2 = 1
			region.texture = skeletonTexture
			return region
		} catch (error) {
			console.log("-------CreateRegion error")
			return null
		}
	}


    hideSpin() {
        if (!this.isAuto()) {
            // newRound 会在发起下注请求后立即调用这里。Spin 动画尚未结束时
            // 不能关闭点击，否则玩家无法在转动期间快速停轮。
            if (this.isSpinAnimationWindow) return;
            this.setCanPress(false);
        }
    }
    showSpin() {
        if (!this.isAuto()) {
            // 只有下一局回到下注阶段才能解除本局结束后的按钮禁用。
            if (gGameData.status == EGameStatus.bet) {
                this.isSpinDisabledForRound = false;
                this.isSpinAnimationWindow = false;
                this.playSpinIdleAnimation();
            }
            if (this.isSpinDisabledForRound) return;
            this.setCanPress(true);
        }
    }
    setBetAmount(betAmount: number) {
        let totalAmount = betAmount;  //去掉30倍显示 * 30
        AmountSelectorUI.Instance.setBetAmountLabel(totalAmount);
        if (this.isFreeStatus()) {
            this.switch2Normal();
        }
    }

    setFreeTime(freeTime: number) {
        this.freeTime.string = freeTime.toString();
        if (!this.isFreeStatus() && freeTime > 0) {
            this.switch2Free();
        }

        if (freeTime == 0) {
           //切换状态
           this.freeTime.node.active = false;
           //
           this.freeNode.getChildByName("lage_4_1").getComponent(cc.Sprite).spriteFrame = this.m_spriteFrame[1];
        }else{
            this.freeNode.getChildByName("lage_4_1").getComponent(cc.Sprite).spriteFrame = this.m_spriteFrame[0];
        }

        LocalizedSprite.refreshSprite(this.freeNode.getChildByName("lage_4_1").getComponent(cc.Sprite));
               
        console.log("免费模式次数显示123",freeTime);
    }


    //免费模式隐藏下注按钮
    async switch2Free() {
        this.inSwitch = true;

        this.freeWinTotal = 0;
        this.freeNode.active = true;
        this.freeTime.node.active = true;
        this.betNode.active = false;


        this.node.getChildByName("BetAmountSelector").active = false;
        this.node.getChildByName("Auto").active = false;
        this.node.getChildByName("Spin").active = false;
        this.node.getChildByName("Turbo").active = false;
        this.node.getChildByName("Account").active = false;

        await new Promise(resolve => setTimeout(resolve, 4000));
        this.setWinAmount(0);
        this.inSwitch = false;


    }

    async switch2Normal() {
        this.inSwitch = true;

        this.freeWinTotal = 0;
        this.freeNode.active = false;
        this.betNode.active = true;

        this.node.getChildByName("BetAmountSelector").active = true;
        this.node.getChildByName("Auto").active = true;
        this.node.getChildByName("Turbo").active = true;
        this.node.getChildByName("Account").active = true;

        await new Promise(resolve => setTimeout(resolve, 4000));
        this.setWinAmount(0);
        this.inSwitch = false;
    }

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.betNode.on(cc.Node.EventType.TOUCH_END, this.onSpin, this);
        // 复选框只监听 Toggle 的状态变更，不再依赖触摸结束事件。
        this.autoSpinNode.on(this.toggleChangedEvent, this.onAutoToggle, this);
        this.autoBetNode.on(this.toggleChangedEvent, this.onTurboToggle, this);

        // Toggle 本身只负责勾选状态；按压反馈由 Bottombar 统一控制，避免
        // 依赖场景里 Button/Toggle 的 transition 配置。
        this.autoSpinBaseScale = this.autoSpinNode.scale;
        this.turboBaseScale = this.autoBetNode.scale;
        this.autoSpinNode.on(cc.Node.EventType.TOUCH_START, this.onAutoSpinTouchStart, this);
        this.autoSpinNode.on(cc.Node.EventType.TOUCH_END, this.onAutoSpinTouchEnd, this);
        this.autoSpinNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onAutoSpinTouchEnd, this);
        this.autoBetNode.on(cc.Node.EventType.TOUCH_START, this.onTurboTouchStart, this);
        this.autoBetNode.on(cc.Node.EventType.TOUCH_END, this.onTurboTouchEnd, this);
        this.autoBetNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onTurboTouchEnd, this);


        let Title = this.node.getChildByName("Title")
        LocalizedSprite.refreshSprite(Title.getChildByName("lage_36").getComponent(cc.Sprite));
    }

    onDestroy() {
        this.betNode?.off(cc.Node.EventType.TOUCH_END, this.onSpin, this);
        this.autoSpinNode?.off(this.toggleChangedEvent, this.onAutoToggle, this);
        this.autoBetNode?.off(this.toggleChangedEvent, this.onTurboToggle, this);
        this.autoSpinNode?.off(cc.Node.EventType.TOUCH_START, this.onAutoSpinTouchStart, this);
        this.autoSpinNode?.off(cc.Node.EventType.TOUCH_END, this.onAutoSpinTouchEnd, this);
        this.autoSpinNode?.off(cc.Node.EventType.TOUCH_CANCEL, this.onAutoSpinTouchEnd, this);
        this.autoBetNode?.off(cc.Node.EventType.TOUCH_START, this.onTurboTouchStart, this);
        this.autoBetNode?.off(cc.Node.EventType.TOUCH_END, this.onTurboTouchEnd, this);
        this.autoBetNode?.off(cc.Node.EventType.TOUCH_CANCEL, this.onTurboTouchEnd, this);
        (<any>window).isAutoBetActive = false;
    }

    //游戏滚动条停止后可以下注时调用
    showSpinbtnAnim() {
        if (this.isAuto()) return;
        if (this.isSpinAnimationWindow || this.isSpinDisabledForRound) return;
        const animationNode = this.betNode.getChildByName("AnimNode") || this.betNode.children.find(node => !!node.getComponent(sp.Skeleton));
        if (animationNode) {
            animationNode.getComponent(sp.Skeleton).setAnimation(0, "idle", true);
        }
    }

    private onSpin() {
        if (!this.m_isAutoBetActive && this.isSpinDisabledForRound) return;
        AudioCtrl.PlayAsync(AudioClip.click);

        if (this.m_isAutoBetActive){
            //自动下注下注按钮不响应
            this.SwitchAutoBet(false);

            //停止自动下注
            this.setAutoBet(false);
            updateAutoQuit();

            return;
        }         


        console.log("onSpin-----------");



        if (this.canSpin() && !this.coolDown) {
            if (Game.Instance.player.accountDiamond < gBetAmounts[gGameData.betAmountIndex] * lineCount) {
                setRechargeView(true);
                return;
            }
            this.playSpinAnimation();
            Game.Instance.newRound();
            return;
        }
        if (this.canStop()) {
            this.disableSpinForRound();
            // 手动二次点击与急速模式采用同一套 Slots 快速停轮策略：
            // 所有转轴并行停靠、移除 Jackpot suspense，并只保留一个滚动步。
            Game.Instance.setQuickStopEnabled(true);
            Game.Instance.finishRound(Bottombar.TurboSpinRemain);
        }
    }

    /** 播放一次 Spin，并把这段动画作为手动快速停轮的唯一点击窗口。 */
    private playSpinAnimation() {
        const animationNode = this.getSpinAnimationNode();
        this.isSpinDisabledForRound = false;
        this.isSpinAnimationWindow = true;
        this.setCanPress(true);
        if (!animationNode) {
            this.disableSpinForRound();
            return;
        }

        const skeleton = animationNode.getComponent(sp.Skeleton);
        skeleton.setAnimation(0, "spin", false);
        skeleton.setCompleteListener((entry: any) => {
            if (entry && entry.animation && entry.animation.name != "spin") return;
            this.disableSpinForRound();
        });
    }

    /** 关闭本局的 Spin 响应，并切换到 Spine 的 disable 状态。 */
    private disableSpinForRound() {
        if (this.isSpinDisabledForRound) return;
        this.isSpinAnimationWindow = false;
        this.isSpinDisabledForRound = true;
        this.setCanPress(false);

        const animationNode = this.getSpinAnimationNode();
        if (!animationNode) return;
        const skeleton = animationNode.getComponent(sp.Skeleton);
        skeleton.setCompleteListener(null);
        skeleton.setAnimation(0, "disable", true);
    }

    private getSpinAnimationNode(): cc.Node {
        return this.betNode.getChildByName("AnimNode")
            || this.betNode.children.find(node => !!node.getComponent(sp.Skeleton));
    }

    /** 下一局开放下注时，恢复下注按钮的循环待机动画。 */
    private playSpinIdleAnimation() {
        const animationNode = this.getSpinAnimationNode();
        if (!animationNode) return;
        const skeleton = animationNode.getComponent(sp.Skeleton);
        skeleton.setCompleteListener(null);
        skeleton.setAnimation(0, "idle", true);
    }

    //自动开始后 下注按钮切换为停止模式
    m_isAutoBetActive: boolean = false;
    private SwitchAutoBet(isAutoBet: boolean) {
        this.m_isAutoBetActive = isAutoBet;
        this.betNode.getChildByName("SpineAnim").getComponent(sp.Skeleton).setAnimation(0, isAutoBet ? "auto" : "idle", true);
    }


    //面免模式需要隐藏相关节点  显示免费次数




    onAutoToggle() {
        const auto = this.isAuto();
        if (!auto) {
            this.SwitchAutoBet(false);
            this.setAutoBet(false);
            updateAutoQuit();
            AudioCtrl.PlayAsync(AudioClip.click);
            return;
        }
        const canStartAuto = !this.isFreeStatus()
            && gGameData.status == EGameStatus.bet && this.canPress;
        if (!canStartAuto || this.coolDown || Game.Instance.player.accountDiamond < gBetAmounts[gGameData.betAmountIndex] * lineCount) {
            this.setAutoBet(false);
            if (Game.Instance.player.accountDiamond < gBetAmounts[gGameData.betAmountIndex] * lineCount) setRechargeView(true);
            return;
        }
        updateAutoQuit();
        AudioCtrl.PlayAsync(AudioClip.click);
        this.setCanPress(false);
        Game.Instance.newRound();

        //切换按钮
        this.SwitchAutoBet(true);
    }

    onTurboToggle() {
        AudioCtrl.PlayAsync(AudioClip.click);

        // 与 SuperAce Quick 对齐：急速中不延长 Jackpot suspense；若当前
        // 已处于等待状态，立刻关闭等待特效并压缩尚未停稳的各列。
        if (gGameData.status == EGameStatus.run) {
            const isTurboMode = this.isTurboMode();
            Game.Instance.setQuickStopEnabled(isTurboMode);
            if (isTurboMode) {
                Game.Instance.finishRound(Bottombar.TurboSpinRemain);
            }
        }
    }

    private onAutoSpinTouchStart() {
        this.playTogglePress(this.autoSpinNode, this.autoSpinBaseScale);
    }

    private onAutoSpinTouchEnd() {
        this.restoreToggleScale(this.autoSpinNode, this.autoSpinBaseScale);
    }

    private onTurboTouchStart() {
        this.playTogglePress(this.autoBetNode, this.turboBaseScale);
    }

    private onTurboTouchEnd() {
        this.restoreToggleScale(this.autoBetNode, this.turboBaseScale);
    }

    private playTogglePress(node: cc.Node, baseScale: number) {
        cc.Tween.stopAllByTarget(node);
        cc.tween(node)
            .to(0.08, { scale: baseScale * Bottombar.TogglePressScale })
            .start();
    }

    private restoreToggleScale(node: cc.Node, baseScale: number) {
        cc.Tween.stopAllByTarget(node);
        cc.tween(node)
            .to(0.1, { scale: baseScale })
            .start();
    }

    // update (dt) {}
}
