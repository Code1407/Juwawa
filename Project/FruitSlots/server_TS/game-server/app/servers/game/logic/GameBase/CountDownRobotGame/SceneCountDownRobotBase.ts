import { FrontendSession, Logger } from "pinus";

import IGamePlayer, { IPlayerstatus } from "../../GamePlayer";
import { PlayerCountDownRobotBase, CoundDownEntity } from "./PlayerCountDownRobotBase";
import { GameSceneBase } from "../GameSceneBase";
import IGameScene, { ISceneStatus } from "../../GameScene";
import { IRoundStepCountDownRobot, MachineCountDownRobotBase } from "./MachineCountDownRobotBase";
import { EGameStatus, getRandomNumInt, strServiceMaintenance } from "../../../interface/IGame";
import GameServer from "../../../GameServer";

type CountDownRobotPlayer = PlayerCountDownRobotBase<CoundDownEntity>;
type CountDownRobotMachine = MachineCountDownRobotBase<IRoundStepCountDownRobot>;

export class CountDownRobotPlayerList<PlayerType extends CountDownRobotPlayer> { [uid: string]: PlayerType }
interface IRobotPlayer {
    name: string;
    icon: string;
}

interface IRobotPolic {
    playerNum: string;
    betNum1: string;
    betNum2: string;
    betNum3: string;
    betNum4: string;
    betMultiple:number,
}
export abstract class SceneCountDownRobotBase<PlayerType extends CountDownRobotPlayer, MachineType extends CountDownRobotMachine> 
    extends GameSceneBase 
{
    abstract onSceneInit();
    abstract onNewRound();
    abstract getEmptyItemAmount(): number[];
    abstract onNewDay();
    machine: MachineType;
    robotPolic: IRobotPolic;
    private robotPlayer: IRobotPlayer[];
    protected robotList = new CountDownRobotPlayerList<PlayerType>();
    protected playerList = new CountDownRobotPlayerList<PlayerType>();
    protected removeList = new CountDownRobotPlayerList<PlayerType>();

    onScenebeat() {}

    todayRound(): number {
        return this.machine.todayRound();
    }

    async newRound() {
        for (let uid in this.playerList) {
            this.playerList[uid].newRound();
        }
        for (let uid in this.removeList) {
            delete this.removeList[uid];
        }

        this.onNewRound();
        for (let uid in this.robotList) {
            this.robotList[uid].onNewRound();
        }
        setTimeout(()=>{
            this.initRoundRobotList();
        },2000)
    }
    private checkPolicSt(st:string):boolean{
        let polic:IRobotPolic = JSON.parse(st);
        if (polic?.betMultiple){
            return true;
        }
        return false;
    }
    private checkRobotPlayer(st:string):boolean{
        let players:IRobotPlayer[] = JSON.parse(st);
        if(players?.length >= 2){
            return true;
        }
        return false;
    }
    

    async initRobotPolic(){
        var robotPolicSt = await this.redis.getRobotPolic();
        if(robotPolicSt && robotPolicSt != "null" && this.checkPolicSt(robotPolicSt)){
            this.robotPolic = JSON.parse(robotPolicSt);
        }
        else{
            this.robotPolic =  {
                playerNum: "0,0",
                betNum1:"1,5",
                betNum2:"2,4",
                betNum3:"2,4",
                betNum4:"2,4",
                betMultiple: 100,
                };
        }
    }
    async initRoundRobotList(){
        await this.initRobotPolic();
        let arr =  this.robotPolic.playerNum.split(",");
        let curRoundNum = getRandomNumInt(Number.parseInt(arr[0]) ,Number.parseInt(arr[1]));
        let count = Object.keys(this.robotList).length;
        if(count < curRoundNum){
            let addNum = curRoundNum-count;
            for (let index = 0; index < addNum; index++) {
                this.addRobotPlayer();
            }
        }
    }
    async addRobotPlayer(){
        if(Object.keys(this.robotList).length >= this.robotPlayer.length){
            return;
        }
        let index = getRandomNumInt(0, this.robotPlayer.length-1);
        let i = 0;
        while (this.checkRobotIDUsed(index) && i++ < 10) {
            index = getRandomNumInt(0, this.robotPlayer.length-1);
        }
        //console.log("robot id="+index);
        const element = this.robotPlayer[index];
        await this.createRobotPlayer(encodeURI(element.name),encodeURI(element.icon));
    }
    private checkRobotIDUsed(index:number):boolean{
        const element = this.robotPlayer[index];
        for (let uid in this.robotList) {
            if(element.name==this.robotList[uid].userName()){
                return true;
            }
        }
        return false;
    }

    removeRobot(uid:string){
        delete this.robotList[uid];
    }

   
    async save() {
        try {
            for (let uid in this.playerList) {
                await this.playerList[uid].save();
            }
            for (let uid in this.removeList) {
                await this.removeList[uid].save();
            }
        } catch(e) {
            this.logger.error(e.message);
        }
    }

    getRoundAmountTotal(): number[] {
        let itemAmountTotal = this.getEmptyItemAmount();
        for (let uid in this.playerList) {
            let itemAmount = this.playerList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        for (let uid in this.removeList) {
            let itemAmount = this.removeList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        return itemAmountTotal;
    }

    constructor(protected machineCtor: new(scene: SceneCountDownRobotBase<PlayerType, MachineType>)=>MachineType,protected playerCtor: new(scene: SceneCountDownRobotBase<PlayerType, MachineType>)=>PlayerType,
        gameServer: GameServer, gameName: string, logger: Logger) 
    {
        super(gameServer, gameName, logger);
    }

    addPlayer(uid: string, player: PlayerType) {
        this.playerList[uid] = player;
    }

    async initScene() {
        this.initSceneBase();
        var robotPlayerSt = await this.redis.getRobotPlayer();
        if (robotPlayerSt && this.checkRobotPlayer(robotPlayerSt)) {
            this.robotPlayer = JSON.parse(robotPlayerSt);
        } else {
            this.robotPlayer = [];
        }
        await this.onSceneInit();
        let machine = new this.machineCtor(this);
        this.machine = machine;
        await machine.initMachine();
    }
    async createRobotPlayer(uid: string, Profile: string) {
        let newPlayer = new this.playerCtor(this);
        this.robotList[uid] = newPlayer;
        newPlayer.uid = uid;
        newPlayer.setRobot(uid,Profile);
        let count = 0;
        for (let uid in this.robotList) {
            count++;
        }
    }
    robotBetHandler(){
        for (let uid in this.robotList) {
            this.robotList[uid].onRobotHandler();
        }
    }

    robotBetRoundStart(){
        let index = 0;
        let random = 0;
        for (let uid in this.robotList) {
            random = getRandomNumInt(1, 2);
            if(random == 1){
                index++;
                this.robotList[uid].onRobotHandler(index*1000+1000);
            }
            if(index >= 3){
                break;
            }
        }
    }
    async createPlayer(msg: any, session: FrontendSession,
        playerCtor: new(scene: IGameScene)=>PlayerType): Promise<PlayerType>
    {
        let uid = msg.uid;
        let token = msg.token;
        let extra = msg.extra
        let ua = msg.ua;
        let sdk = this.gameServer.sdk[this.gameName()];

        let account = await this.queryUserAccount(uid, token, extra);
        if (!account) return null;
    
        await this.bindSession(uid, session);

        let player = this.playerList[uid];
        if (!player) {
            player = this.removeList[uid];
            if (player) delete this.removeList[uid];
        }
        if (!player) {
            player = new playerCtor(this);
        }
        player.setAccont(account, uid, token, extra, ua, sdk);
        player.loginInfo(ua);
        this.playerList[uid] = player;

        return player;
    }

    getPlayer(uid: string): IGamePlayer {
        return this.playerList[uid];
    }

    async removePlayer(uid: string) {
        if (this.isStop()) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.send2Player("onMaintenance", uid, strServiceMaintenance);
        } else {
            let oldSessions = this.sessionService.getByUid(uid)
            if (oldSessions && oldSessions.length) {
                oldSessions.forEach(session => {
                    session.closed("removePlayer: " + uid);
                });
            }
        }

        let player = this.playerList[uid];
        if (player) {
            await player.quit("quit");
            delete this.playerList[uid];
            this.removeList[uid] = player;
        }
    }

    onRoundStep(roundStep: IRoundStepCountDownRobot) {
        this.broadcast("onRoundStep", roundStep);
        this.robotBetHandler();
    }

    newDay() {
        this.today = new Date();
        this.machine.onNewDay();
        this.dingdingWarn.onNewDay();

        for (let uid in this.playerList) {
            this.playerList[uid].onNewDay();
        }
        for (let uid in this.removeList) {
            this.removeList[uid].onNewDay();
        }
        this.broadcast("onNewDay", null);

        this.onNewDay();
    }

    getItemAmountTotal(): number[] {
        let itemAmountTotal = this.getEmptyItemAmount();
        for (let uid in this.playerList) {
            let itemAmount = this.playerList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        for (let uid in this.removeList) {
            let itemAmount = this.removeList[uid].getItemAmount();
            for (let i = 0; i < itemAmount.length; i++) {
                itemAmountTotal[i] += itemAmount[i];
            }
        }
        return itemAmountTotal;
    }

    status(): ISceneStatus {
        let sdkName = this.gameServer.app.getServerId();
        let playerStatus: IPlayerstatus[] = [];
        for (let uid in this.playerList) {
            playerStatus.push(this.playerList[uid].status());
        }
        for (let uid in this.removeList) {
            playerStatus.push(this.removeList[uid].status());
        }
        return {
            sdkName: sdkName,
            scene: this.gameName(), 
            status: this.machine.status(),
            playerStatus: playerStatus,
        };
    }

    isStop(): boolean {
        return this.machine.status() == EGameStatus.stop;
    }

    async destroy(): Promise<ISceneStatus> {
        await this.machine.destroy();
        this.onMaintenance();

        let rets: Promise<any>[] = [];
        for (let uid in this.playerList) {
            rets.push(this.playerList[uid].quit("force2quit"));
            delete this.playerList[uid];
        }
        for (let uid in this.removeList) {
            rets.push(this.removeList[uid].quit("force2quit"));
            delete this.removeList[uid];
        }
        await Promise.all(rets);
        return this.status();
    }

    async restart(): Promise<ISceneStatus> {
        await this.machine.restart();
        await this.dingdingWarn.initValue(this.today);
        return this.status();
    }

    async forceRemovePlayer(uid: string): Promise<void> {
        if (this.isStop()) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.onMaintenance2Player(uid);
        } else {
            let oldSessions = this.sessionService.getByUid(uid)
            if (oldSessions && oldSessions.length) {
                oldSessions.forEach(session => {
                    session.closed("removePlayer: " + uid);
                });
            }
        }

        delete this.playerList[uid];
    }

    async forceDestroy(): Promise<void> {
        this.machine.forceDestroy();
        this.logger.error("forceDestroy");
    }
}