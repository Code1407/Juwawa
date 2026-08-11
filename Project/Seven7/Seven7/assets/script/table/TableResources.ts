
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableResources {
    static TableName: string = "Resources";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableResources.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** 资源类型 */
    get Type(): number {
        return this.data.Type;
    }
    /** 资源ID */
    get ResourceID(): number {
        return this.data.ResourceID;
    }
}
    