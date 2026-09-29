
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableRankCommon {
    static TableName: string = "RankCommon";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableRankCommon.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

}
    