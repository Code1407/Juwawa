
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableReward {
    static TableName: string = "Reward";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableReward.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** 倍数 */
    get Multiple(): number {
        return this.data.Multiple;
    }
}
    