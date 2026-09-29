
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class TableLanguage {
    static TableName: string = "Language";

    private data: any;

    init(Key: string) {
        var table = JsonUtil.get(TableLanguage.TableName);
        this.data = table[Key];
        this.Key = Key;
    }

    /** 编号【KEY】 */    Key: string = null!;

    /** 英文 */
    get EN(): string {
        return this.data.EN;
    }
    /** 阿拉伯语 */
    get AR(): string {
        return this.data.AR;
    }
    /** 越南语 */
    get VI(): string {
        return this.data.VI;
    }
    /** 孟加拉语 */
    get BN(): string {
        return this.data.BN;
    }
    /** 西班牙语 */
    get ES(): string {
        return this.data.ES;
    }
    /** 印地语 */
    get HI(): string {
        return this.data.HI;
    }
    /** 印尼语 */
    get ID(): string {
        return this.data.ID;
    }
    /** 葡萄牙语 */
    get PT(): string {
        return this.data.PT;
    }
    /** 泰语 */
    get TH(): string {
        return this.data.TH;
    }
    /** 土耳其语 */
    get TR(): string {
        return this.data.TR;
    }
    /** 乌尔都语 */
    get UR(): string {
        return this.data.UR;
    }
    /** 菲律宾语 */
    get TL(): string {
        return this.data.TL;
    }
}
    