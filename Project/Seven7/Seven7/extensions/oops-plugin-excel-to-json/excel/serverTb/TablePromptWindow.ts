
export class TablePromptWindow {
    static TableName: string = "/game/PromptWindow.json";
    static Table: any = null!;

    static load() {
        var fs = require('fs');
        var data = fs.readFileSync(__dirname + this.TableName, 'utf8');
        this.Table = JSON.parse(data);
    }

    private data: any;

    init(id: number, id1: number, id2: number) {
        this.data = TablePromptWindow.Table[id];
        this.id = id;        this.id1 = id1;        this.id2 = id2;
    }

    /** 编号【KEY】 */
    id: number = 0;    /** 双主键【KEY】 */
    id1: number = 0;    /** 双主键【KEY】 */
    id2: number = 0;

    /** 标题 */
    get title(): string {
        return this.data.title;
    }
}
    