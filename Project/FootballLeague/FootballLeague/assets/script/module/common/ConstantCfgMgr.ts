
import { TableConstant } from "db://assets/script/table/TableConstant";

export namespace ConstantKey {
    /**押注时间 */
    export const BetTime: number = 1;
    /**最大押注种类 */
    export const BetTypeMax: number = 2;
    /**每个场次显示的历史记录条数 */
    export const ShowRankCount: number = 3;
    /**押注挡位 */
    export const Bets: number = 4;

    /**场景下注倍率，按普通 / 进阶 / 大师场景顺序配置 */
    export const BetMultiple: number = 6;

    /**新增游戏球队 0-2 变量*/
    export const GameTeam: number = 5;
    
}

export class ConstantCfgMgr {

    private static table: TableConstant = new TableConstant();
    private static intArrayMap: Map<number, number[]> = new Map();

    //新增游戏球队 0-2 变量
    private static GameTeamMap: Map<number, number> = new Map([
        [0, 1],
        [1, 2],
        [2, 3],
    ]);

    //新增游戏球队 0-2 变量
    public static getGameTeam(team: number): number {
        return this.GameTeamMap.get(team);
    }
    //设置新增游戏球队 0-2 变量
    public static setGameTeam(team: number, value: number) {
        this.GameTeamMap.set(team, value);
    }

    public static getValue(id: number): any {
        this.table.init(id);
        return this.table.value;
    }

    public static getNumber(id: number): number {
        let value = this.getValue(id);
        if (value == null) {
            return 0;
        }
        return parseInt(value, 10)
    }

    public static getIntArray(id: number): number[] {
        if (this.intArrayMap.has(id)) {
            return this.intArrayMap.get(id);
        }
        let value = this.getValue(id);
        if (value == null) {
            return null;
        }
        let result = value.split('|').map(Number);
        this.intArrayMap.set(id, result);
        return result;
    }
}

