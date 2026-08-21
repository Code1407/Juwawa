import MessageRouter from "../shared/MessageRouter";
import Account from "./Account";
import Bottombar from "./Bottombar";
import ClientPlayer from "./client/ClientPlayer";
import ClientScene from "./client/ClientScene";
import { Effect } from "./effect/BaseEffect";
import Game from "./Game";
import { gBetAmounts, gGameData } from "./GameData";
import { setMaintenanceView, setRechargeView } from "../shared2/GlobalViewsLoader";
import { gConst, lineCount, IBetResp, IEnterGameResp, IRoundResultResp } from "./interface/IFruitSlots";
import SpinUI from "./ui/SpinUI";
import Views from "./Views";

export default class PlayerAccount extends ClientPlayer {

    accountDiamond: number = 0;
    roundId: number = 0;
    private static instance: PlayerAccount;

    private constructor(msgRouter: MessageRouter, private account: Account) {
        super(msgRouter);
    }

    static async createPlayer(account: Account): Promise<PlayerAccount> {
        let msgRouter = new MessageRouter();
        await msgRouter.init(gConst.gameName);
        (<any>window).msgRouter = msgRouter;
        let scene = new ClientScene(msgRouter);
        await scene.initScene();
        this.instance = new PlayerAccount(msgRouter, account);
        return this.instance;
    }

    async enterGame(): Promise<IEnterGameResp> {
        let resp = await super.enterGame();

        if (!resp || !resp.account) {
            console.error("enterGame returned invalid response:", resp);
            setMaintenanceView(true);
            return null;
        }

        this.setAccountDiamond(resp.account.diamond);
        this.account.setMyProfile(resp.account.avatar);
        return resp;
    }

    async betNormal(betAmount: number): Promise<IBetResp> {
        // console.log("betNormal start");
        try {
            // 同步余额
            if (this.accountDiamond < betAmount * lineCount) {
                await Game.Instance.synchronize();
            }

            if (this.accountDiamond < betAmount * lineCount) {
                setRechargeView(true);
                SpinUI.Instance.setAutoBet(false);
                Bottombar.Instance.resetSpin();
                Bottombar.Instance.showSpin();
                return null;
            }

            // 余额统一由服务端 ScCoinsUpdatePush 更新，避免客户端先扣款后，
            // 又被异步到达的下注响应或结算消息覆盖。
            if (this.roundId != 0) {
                console.log("betNormal: this.roundId != 0");
            }
            let resp = await super.betNormal(betAmount);
            //console.log("betNormal end", this.roundId);

            return resp;
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async betFree(): Promise<IBetResp> {
        //console.log("betFree start");
        try {
            while (this.roundId != 0) {
                console.log("betFree: this.roundId != 0");
                await this.stopRound(this.roundId);
            }
            let resp = await super.betFree();
            if (!resp.result) {
                gGameData.freeCount = 0;
                Bottombar.Instance.setBetAmount(gBetAmounts[gGameData.betAmountIndex]);
                Bottombar.Instance.resetSpin();
                Bottombar.Instance.showSpin();
                Bottombar.Instance.resetNormal();
            }
            //console.log("betFree end", this.roundId);
            return resp;
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async stopRound(roundId: number): Promise<IRoundResultResp> {
        //console.log("stop start", roundId);
        try {
            if (roundId == 0) {
                console.log("stopRound: this.roundId == 0");
            }
            let resp = await super.stopRound(roundId);
            //console.log("stop end");
            return resp;
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async stopRoundCurrent(): Promise<IRoundResultResp> {
        return this.stopRound(this.roundId);
    }

    setAccountDiamond(amount: number) {
        this.accountDiamond = amount;
        this.account.setAccountDiamond(this.accountDiamond);
    }

    decreaseAmount(amount: number) {
        this.accountDiamond -= amount;
        this.account.setAccountDiamond(this.accountDiamond);
    }

    async increaseAmount(amount: number, flyDiamond: boolean = false) {
        if (!amount) return;

        if (flyDiamond) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            let frequency = 0;
            let multiple = amount / gBetAmounts[gGameData.betAmountIndex];
            if (multiple > 60) frequency = 30;
            else if (multiple > 20) frequency = Math.round(multiple / 2);
            else frequency = Math.min(amount, 10);
            Effect.flyDiamond(Bottombar.Instance.getWinAmountLabel().node, Bottombar.Instance.diamondImage, frequency);
            let delay = Bottombar.Instance.isAutoBet() ? 500 : 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        // 派彩已经由服务端计入账户，并通过 ScCoinsUpdatePush 下发。
        // 这里仅播放中奖表现，不能再次在客户端累加余额。
        Bottombar.Instance.showIncreaseAmount(amount);
    }

    private initPlayerAccount(enterGameResp: IEnterGameResp): IEnterGameResp {
        if (!enterGameResp || !enterGameResp.account) {
            setMaintenanceView(true);
            return null;
        }

        this.accountDiamond = enterGameResp.account.diamond;
        return enterGameResp;
    }
}
