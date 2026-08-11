
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableZhuanPan {
    static TableName: string = "ZhuanPan";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableZhuanPan.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** 奖励ID */
    get RewardID(): number {
        return this.data.RewardID;
    }
}
    