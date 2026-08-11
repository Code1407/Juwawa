
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableLanguageNotice {
    static TableName: string = "LanguageNotice";

    private data: any;

    init(ID: string) {
        var table = JsonUtil.get(TableLanguageNotice.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: string = null!;

    /** 多语言ID */
    get LanguageKey(): string {
        return this.data.LanguageKey;
    }
}
    