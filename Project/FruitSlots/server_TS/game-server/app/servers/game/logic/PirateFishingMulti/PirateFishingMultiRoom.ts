import { delay } from "bluebird";
import { EEntityType, IEntityInfo, IEntityKilledInfo, IEntityRandomKey, IVec } from "../../interface/IPirateFishingMulti";
import PirateFishingMultiScene from "./PirateFishingMultiScene";
import { CoolDown } from "./PirateFishingMultiPlayer";

export class PirateFishingMultiRoom {
    DestroyEntity(betAmount: number, entity: IEntityInfo) {
        this.idKilled[entity.InsId] = { betAmount: betAmount, entity: entity };
    }

    uids: string[] = [];
    playerBlackList: string[] = [];//不是主动退出而是被踢出房间的不能再进入相同房间
    idKilled: { [insId: number]: IEntityKilledInfo } = {};//当鱼被杀死后，记下杀死这条鱼所对应的档位
    knifeFishAttacked: { [insId: number]: IEntityInfo } = {};//当刀鱼释放攻击后，计入名单，不能再接受这条刀鱼的第二次攻击消息
    tigerBossTotalBet: number = 0;
    tigerBossStatus: number = 0;

    timeMachineInit = 0;

    entityRandomKeyBase: IEntityRandomKey = {
        typeKey: 0,
        pathKey: 0
    } // 每局都会刷新的初始随机数，用于传给客户端计算随机数

    randomKey = 0; // 每局都会刷新的初始随机数，用于传给客户端计算随机数

    round: number = 0;

    wheelCd: CoolDown = new CoolDown();

    constructor(private scene: PirateFishingMultiScene, private screen: IVec, private machineDuration: number) {
        this.wheelCd.ms = 15000;
    }

    Screen(): IVec {
        return this.screen;
    }

    MachineDuration(): number {
        return this.machineDuration;
    }

    isStop(): boolean {
        return this.scene.isStop() || this.uids.length < 1;
    }

    FindEntities(codes: number[]): IEntityInfo[] {
        let result: IEntityInfo[] = [];
        codes.forEach(code => {
            let id = Math.floor(code / 1000);
            let type = Math.floor(code % 1000);
            if (EEntityType[type] != null && this.idKilled[id] == null)
                result.push({ type: type, InsId: id, });
        });
        return result;
    }

    initMachine_new() {
        this.ResetData();
        this.StartLoop();
    }

    ResetData() {
        this.entityRandomKeyBase.typeKey = Math.random();
        this.entityRandomKeyBase.pathKey = Math.random();
        this.randomKey = Math.random();
        this.timeMachineInit = new Date().getTime();
        this.idKilled = {};
        this.knifeFishAttacked = {};
        this.tigerBossStatus = 0;
        this.tigerBossTotalBet = 0;
        this.round++;
    }

    async StartLoop() {
        while (!this.isStop()) {

            if (this.machineDuration != null)
                await delay(this.machineDuration)
            else
                await delay(1000 * (5 * 60 + 30));
            if (this.isStop())
                return;

            this.ResetData();
            //console.log("onMachineInit_new");
            if (!this.isStop()) {
                this.scene.onMachineInit_new(this.uids, {
                    overflowed: false,
                    timeMachineInit: this.timeMachineInit,
                    entityRandomKey: this.entityRandomKeyBase,
                    randomKey: this.randomKey,
                    idKilled: this.idKilled,
                    roomRound: this.round,
                });
            }

        }
        //共5分30秒
    }

    xy(x: number, y: number): IVec {
        return { x: x * this.screen.x / 2, y: y * this.screen.y / 2 };
    }
}