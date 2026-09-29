
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableActivity {
    static TableName: string = "Activity";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableActivity.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** 活动类型 */
    get Type(): number {
        return this.data.Type;
    }
    /** 开启类型(0:不开启  1:单游戏  2:平台) */
    get OpenType(): number {
        return this.data.OpenType;
    }
    /** 活动名称多语言 */
    get NameLangKey(): string {
        return this.data.NameLangKey;
    }
    /** 活动描述多语言 */
    get DescLangKey(): string {
        return this.data.DescLangKey;
    }
}
    