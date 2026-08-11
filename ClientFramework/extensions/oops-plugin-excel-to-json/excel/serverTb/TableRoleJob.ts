
export class TableRoleJob {
    static TableName: string = "/game/RoleJob.json";
    static Table: any = null!;

    static load() {
        var fs = require('fs');
        var data = fs.readFileSync(__dirname + this.TableName, 'utf8');
        this.Table = JSON.parse(data);
    }

    private data: any;

    init(id: number) {
        this.data = TableRoleJob.Table[id];
        this.id = id;
    }

    /** 编号【KEY】 */
    id: number = 0;

    /** 武器类型 */
    get weaponType(): any {
        return this.data.weaponType;
    }
}
    