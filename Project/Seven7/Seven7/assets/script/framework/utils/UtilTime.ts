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

    public static get_time_str(time_span: number): string {
        const pad = (n: number) => ('0' + n).slice(-2);
        if (time_span <= 0) {
            return "00:00";
        }
        if (time_span < 60) {
            return `00:${pad(Math.floor(time_span))}`;
        }
        if (time_span < 3600) {
            const m = Math.floor(time_span / 60);
            const s = Math.floor(time_span % 60);
            return `${pad(m)}:${pad(s)}`;
        }
        if (time_span < 86400) {
            const h = Math.floor((time_span / 3600) % 24);
            const m = Math.floor((time_span / 60) % 60);
            return `${pad(h)}:${pad(m)}`;
        }
        const d = Math.floor(time_span / 86400);
        const h = Math.floor((time_span / 3600) % 24);
        return `${d}:${pad(h)}`; 
    }
}
