import MessageRouter from "../shared/MessageRouter";
import Account from "./Account";
import Bottombar from "./Bottombar";
import ClientPlayer from "./client/ClientPlayer";
import ClientScene from "./client/ClientScene";
import { Effect } from "./effect/BaseEffect";
import Game from "./Game";
import { gBetAmounts, gBetAmountsExtra, gGameData } from "./GameData";
import { gConst, IBetResp, IEnterGameResp, IRoundResultResp } from "./interface/ISuperAce";
import { checkTradeCode, setMaintenanceView, setRechargeView } from "../shared2/GlobalViewsLoader";

import { ETradeCode } from "../shared3/interface/IGame";


export default class PlayerAccount extends ClientPlayer {

    accountDiamond: number = 0;
    roundId: number = 0;
    isExtra: boolean = false;
    private static instance: PlayerAccount;

    private constructor(msgRouter: MessageRouter, private account: Account) {
        super(msgRouter);
    }

    static async createPlayer(account: Account): Promise<PlayerAccount> {
        let msgRouter = new MessageRouter();
        await msgRouter.init(gConst.gameName);
        let scene = new ClientScene(msgRouter);
        await scene.initScene();
        this.instance = new PlayerAccount(msgRouter, account);
        (<any>window).msgRouter = msgRouter;
        return this.instance;
    }

    async enterGame(): Promise<IEnterGameResp> {
        let resp = await super.enterGame();
        this.setAccountDiamond(resp.account.diamond);
        // this.account.setMyProfile(resp.account.avatar);
        return resp;
    }

    async betNormal(betAmountIndex: number): Promise<IBetResp> {
        // console.log("betNormal start");
        // 同步余额
        let betAmounts =this.isExtra ? gBetAmountsExtra : gBetAmounts
        let betAmount = betAmounts[betAmountIndex];
        if (this.accountDiamond < betAmount) {
            await Game.Instance.synchronize();
        }

        if (this.accountDiamond < betAmount) {
            Bottombar.Instance.resetSpin();
            Bottombar.Instance.showSpin();
            // SlotsFortuneSlot.Instance.stopAuto();
            setRechargeView(true)
        }

        // this.decreaseAmount(betAmount);
        // if (this.roundId != 0) {
        //     console.log("betNormal: this.roundId != 0");
        // }
        let resp = await super.betNormal(betAmount, gBetAmounts[betAmountIndex]);
        if (resp.code == ETradeCode.insufficient) {
            checkTradeCode(resp.code);
            Bottombar.Instance.resetSpin();
            Bottombar.Instance.showSpin();
            return null;
        }
        //console.log("betNormal end", this.roundId);

        return resp;
    }

    async betFree(): Promise<IBetResp> {
        //console.log("betFree start");
        try {
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
        //console.log("stop start", roundId);]
        try {
            if (roundId == 0) {
                console.log("stopRound: this.roundId == 0");
            }
            let resp = await super.stopRound(roundId);
            //console.log("stop end");
            (<any>window).playerRoundId = roundId;
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
        (<any>window).playerAccountDiamond = this.accountDiamond;
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
        }
        this.accountDiamond = Number(this.accountDiamond) + Number(amount);
        this.account.setAccountDiamond(this.accountDiamond);
        Bottombar.Instance.showIncreaseAmount(amount);
    }

    private initPlayerAccount(enterGameResp: IEnterGameResp): IEnterGameResp {
        this.accountDiamond = enterGameResp.account.diamond;
        if (enterGameResp == null) {
            setMaintenanceView(true);
        }
        return enterGameResp;
    }
}
