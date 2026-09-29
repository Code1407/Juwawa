
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableFootballLeagueGlobal {
    static TableName: string = "FootballLeagueGlobal";

    private data: any;

    init() {
        var table = JsonUtil.get(TableFootballLeagueGlobal.TableName);
        this.data = table;
        
    }

    

}
    