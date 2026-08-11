import { DateTimeFormatOptions, timeZones, timeZones2 } from "./interface/IBranch_Rank";

export function GetTimeZoneTicks(timezone: string) {//把时区转为时间戳时差
    let strAry = timezone.split(`:`)
    let hour = Number(strAry[0]);
    let min = Number(strAry[1]);
    let tick = hour * 60 * 60 * 1000 + min * 60 * 1000;
    return tick;
}

export function convertToLocalTime(timestamp: number, timeZone: string): string {
    if (!timestamp) {
        console.warn("timestamp is null")
        return
    };
    try {//某些环境没有 Intl 这个命名空间
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timeZones[timeZone] || timeZone, // 使用给定时区
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        // 使用Intl.DateTimeFormat进行格式化
        const formatter = new Intl.DateTimeFormat('en-US', options);
        return formatter.format(new Date(timestamp));
    }
    catch (e) {
        console.warn(e);
        return DateTimeFormat(timestamp, { year: true, month: true, day: true, char: "/", timeZone: timeZone }) + ", " +
            DateTimeFormat(timestamp, { hour: true, minute: true, second: true, char: ":", timeZone: timeZone })
    }
}

export function DateTimeFormat(timestamp: number, options: DateTimeFormatOptions) {
    const date = new Date(timestamp + (options.timeZone ? GetTimeZoneTicks(timeZones2[options.timeZone] || options.timeZone) : 0));
    let str = "";
    if (options.year) {
        str += `${StringPadStart(4, "0", date.getUTCFullYear().toString())}`;
    }
    if (options.month) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getUTCMonth() + 1).toString())}`;
    }
    if (options.day) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getUTCDate()).toString())}`;
    }
    if (options.hour) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getUTCHours()).toString())}`;
    }
    if (options.minute) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getUTCMinutes()).toString())}`;
    }
    if (options.second) {
        str += `${str.length > 0 ? options.char : ""}${StringPadStart(2, "0", (date.getSeconds()).toString())}`;
    }
    return str;
}

export function get_time_str(time_span: number): string {
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



function StringPadStart(length: number, char: string, input: string) {
    let output = '';
    let offset = length - input.length;
    for (let i = 0; i < offset; i += char.length)
        output += char;
    output += input;
    return output;
}