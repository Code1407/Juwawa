
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableLanguageType {
    static TableName: string = "LanguageType";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableLanguageType.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** 语言类型 */
    get Type(): string {
        return this.data.Type;
    }
}
    