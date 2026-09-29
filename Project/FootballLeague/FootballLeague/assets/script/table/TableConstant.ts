
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableConstant {
    static TableName: string = "Constant";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableConstant.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 常量编号【KEY】 */    id: number = 0;

    /** 常量值 */
    get value(): any {
        return this.data.value;
    }
}
    