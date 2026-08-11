export class GameUtil {

    public static getFormateDate(data: Date, formate: string): string {
        var o = {
            "M+": data.getMonth() + 1,                 //月份   
            "d+": data.getDate(),                    //日   
            "h+": data.getHours(),                   //小时   
            "m+": data.getMinutes(),                 //分   
            "s+": data.getSeconds(),                 //秒   
            "q+": Math.floor((data.getMonth() + 3) / 3), //季度   
            "S": data.getMilliseconds()             //毫秒   
        };
        if (/(y+)/.test(formate))
            formate = formate.replace(RegExp.$1, (data.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(formate))
                formate = formate.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return formate;
    }
    
    public static loadJson(configName: string): Promise<any | null> {
        return new Promise((resolve) => {
            let path = `${configName}`;
            cc.resources.load(path, cc.JsonAsset, (err, asset: cc.JsonAsset) => {
                if (err || !asset) {
                    if (err) console.error("[MessageRouter] resources load error:", err);
                    return resolve(null);
                }
                resolve(asset.json);
            });
        });
    }

    public static getRound(incrId: number): number {
        return incrId & 0xffffffff;
    }

    public static getLanguage(str: string, ...args: any[]) {
        for (let i = 0; i < args.length; i++) {
            while (str.includes(`{${i}}`) && args[i].toString() != `{${i}}`)
                str = str.replace(`{${i}}`, args[i].toString());
        }
        return str;
    }
}
