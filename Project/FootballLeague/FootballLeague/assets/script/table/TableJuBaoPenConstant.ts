
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableJuBaoPenConstant {
    static TableName: string = "JuBaoPenConstant";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableJuBaoPenConstant.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

}
    