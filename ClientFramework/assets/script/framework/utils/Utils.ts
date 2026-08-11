import { _decorator } from "cc";

const { ccclass, property } = _decorator;
declare function unescape(s: string): string;

@ccclass
export class Utils {
    //获得查询字符串
    public static getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    }

    // 对Date的扩展，将 Date 转化为指定格式的String   
    // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
    // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
    // 例子：   
    // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
    // (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
    //Utils.getFormateDate(new Date(data["time_add"] * 1000), "yyyy-M-d h:m:s");
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

    //clone对象
    public static cloneObj(obj) {
        var a = JSON.stringify(obj)
        return JSON.parse(a)
    }

    public static getCookie(cookieName) {
        var strCookie = document.cookie;
        var arrCookie = strCookie.split("; ");
        for (var i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (cookieName == arr[0]) {
                return arr[1];
            }
        }
        return "";
    }

    public static delCookie(name) {
        var exp = new Date();
        exp.setTime(exp.getTime() - 1);
        var cval = Utils.getCookie(name);
        console.log('____删除cookie:', cval)
        if (cval != null)
            document.cookie = name + "=" + cval + ";expires=" + exp.toUTCString();
    }

    /**
     * JS使用POST方式进行跳转
     * @param URL 跳转链接
     * @param PARAMS 参数{a:1,b:2}
     */
    postOpenWindow(URL, PARAMS) {
        var temp_form = document.createElement("form");
        temp_form.action = URL;
        temp_form.target = "_blank";
        temp_form.method = "post";
        temp_form.style.display = "none";

        for (var x in PARAMS) {
            var opt = document.createElement("textarea");
            opt.name = x;
            opt.value = PARAMS[x];
            temp_form.appendChild(opt);
        }

        document.body.appendChild(temp_form);
        temp_form.submit();
    }

    //获取浏览器参数
    public static getQuery(name: string): string {
        if (!window.location || !window.location.search) return null;

        const url = window.location.href;
        const currentUrl: URL = new URL(url);
        const searchParams: URLSearchParams = new URLSearchParams(currentUrl.search);

        const targetName = name.toLocaleLowerCase();
        let result: string = "";
        for (const [key, value] of searchParams.entries()) {
            if (key.toLocaleLowerCase() === targetName) {
                result = value;
                return result;
            }
        }
        return result;
    }

    public static getName(name: string, maxLen: number = 0) {
        name = decodeURI(name);
        name = name.replace(/[\r\n]+/g, '');
        if (maxLen == 0) {
            return name;
        }
        if (name.length > maxLen) {
            name = name.slice(0, maxLen) + "..."
        }
        return name;
    }

    public static getRound(incrId: number): number {
        return incrId & 0xffffffff;
    }


    /**
    * 数字转换单位
    * 数字 >= 1000 且 < 100000000，除以1000，带有“k”单位；
    * 数字 >= 100000000，除以100000000，带有“M”单位；
    */
    public static formatNumber(num: number): string {
        if (num >= 100000000) { // 亿
            return (num / 100000000).toFixed(2) + 'M';
        } else if (num >= 1000) { // 千
            return (num / 1000).toFixed(1) + 'k';
        } else {
            return num.toString();
        }
    }

    public static simplifyNumber(num: number): string {
        if (num == null || isNaN(num)) return '0';

        const absNum = Math.abs(num);
        const sign = num < 0 ? '-' : '';

        if (absNum >= 1000000) {
            // 超过6位数，使用M单位（百万）
            const value = absNum / 1000000;
            // 保留1位小数，如果小数部分为0则不显示
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
            return sign + formatted + 'M';
        } else if (absNum >= 1000) {
            // 超过3位数，使用K单位（千）
            const value = absNum / 1000;
            // 保留1位小数，如果小数部分为0则不显示
            const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1);
            return sign + formatted + 'K';
        } else {
            // 小于1000，直接返回原数字
            return sign + absNum.toString();
        }
    }



    //生成随机数，>=a,<b (1, 10)
    public static random(a: number, b: number): number {
        var diff: number = b - a - 1;
        var r: number = Math.random() * diff;
        return Math.round(r) + a;
    }

    public static limit($from: number, $end: number): number {
        $from = Math.min($from, $end);
        $end = Math.max($from, $end);
        var range: number = $end - $from;
        return $from + Math.random() * range;
    }

    /**
     * 获取一个区间的随机数(整数)
     * @param $from 最小值
     * @param $end 最大值
     * @returns {number}
     */
    public static limitInteger($from: number, $end: number): number {
        return Math.floor(this.limit($from, $end + 1));
    }
}
