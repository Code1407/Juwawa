
export class TableReward {
    static TableName: string = "/game/Reward.json";
    static Table: any = null!;

    static load() {
        var fs = require('fs');
        var data = fs.readFileSync(__dirname + this.TableName, 'utf8');
        this.Table = JSON.parse(data);
    }

    private data: any;

    init(id: number) {
        this.data = TableReward.Table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 倍数 */
    get multiple(): number {
        return this.data.multiple;
    }
}
    