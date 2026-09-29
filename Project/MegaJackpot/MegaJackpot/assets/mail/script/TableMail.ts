
export class TableMail {
    static TableName: string = "Mail";

    private data: any;

    init(ID: number, data: any) {
        this.data = data && data[ID];
        this.ID = ID;

        if (!this.data) {
            console.error(`TableMail config not found, ID: ${ID}`);
        }
    }

    /** 编号【KEY】 */
    ID: number = 0;

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
    /** 邮件图标路径 */
    get IconPath(): string {
        return this.data.IconPath;
    }
}
    