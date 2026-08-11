import { oops } from "db://oops-framework/core/Oops";
export class UtilTime {
    public static getTime(): number {
        let time = oops.network.ServerTime;
        return Math.floor(time / 1000);
    }

    public static getSysTime(): number {
        const timestamp = Date.now();
        return Math.ceil(timestamp / 1000);
    }

    //根据一个时间戳，获取今日0点时间戳(毫秒级时间戳)
    public static getTodayZeroTimestamp(curTimestamp: number): number {
        const date = new Date(curTimestamp);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }
}