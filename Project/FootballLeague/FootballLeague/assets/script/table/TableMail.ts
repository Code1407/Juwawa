
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableMail {
    static TableName: string = "Mail";

    private data: any;

    init(ID: number) {
        var table = JsonUtil.get(TableMail.TableName);
        this.data = table[ID];
        this.ID = ID;
    }

    /** 编号【KEY】 */    ID: number = 0;

    /** 邮件类型 */
    get Type(): number {
        return this.data.Type;
    }
    /** 客户端邮件显示模板类型 */
    get ViewType(): number {
        return this.data.ViewType;
    }
    /** 内容多语言key */
    get ContentLangKey(): string {
        return this.data.ContentLangKey;
    }
    /** 页签多语言key */
    get TabLangKey(): string {
        return this.data.TabLangKey;
    }
}
    