
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableZhuanPan {
    static TableName: string = "ZhuanPan";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableZhuanPan.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 编号【KEY】 */    id: number = 0;

    /** 奖励 */
    get Rewards(): any {
        return this.data.Rewards;
    }
}
    