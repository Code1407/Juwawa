
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableLanguageInit {
    static TableName: string = "LanguageInit";

    private data: any;

    init(ID: string) {
        var table = JsonUtil.get(TableLanguageInit.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: string = null!;

    /** 英文 */
    get EN(): string {
        return this.data.EN;
    }
    /** 越南语 */
    get VN(): string {
        return this.data.VN;
    }
}
    