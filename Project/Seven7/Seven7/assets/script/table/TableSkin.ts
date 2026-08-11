
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableSkin {
    static TableName: string = "Skin";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableSkin.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** Bundle名字 */
    get BundleName(): string {
        return this.data.BundleName;
    }
}
    