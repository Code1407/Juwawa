
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableSceneMultiple {
    static TableName: string = "SceneMultiple";

    private data: any;

    init(id: number) {
        var table = JsonUtil.get(TableSceneMultiple.TableName);
        this.data = table[id];
        this.id = id;
    }

    /** 场景编号【KEY】 */    id: number = 0;

    /** 场景名称 */
    get sceneName(): string {
        return this.data.sceneName;
    }
    /** 转盘倍数 */
    get wheelMultiple(): any {
        return this.data.wheelMultiple;
    }
}
    