
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableJuBaoPenMult {
    static TableName: string = "JuBaoPenMult";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableJuBaoPenMult.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

}
    