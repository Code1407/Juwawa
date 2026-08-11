export class DateUtil {

    public static addDays(date: Date, n: number): Date {
        return new Date(date.getTime() + n * 24 * 60 * 60 * 1000)
    }

  public static format(
    time: string | number | Date,
    format = "YYYY-MM-DD HH:mm:SS"
  ) {
    let date = new Date(time);

    function fixedTwo(value: number): string {
      return value < 10 ? "0" + value : String(value);
    }

    var showTime = format;
    if (showTime.includes("SSS")) {
      const S = date.getMilliseconds();
      showTime = showTime.replace("SSS", "0".repeat(3 - String(S).length) + S);
    }
    if (showTime.includes("YY")) {
      const Y = date.getFullYear();
      showTime = showTime.includes("YYYY")
        ? showTime.replace("YYYY", String(Y))
        : showTime.replace("YY", String(Y).slice(2, 4));
    }
    if (showTime.includes("M")) {
      const M = date.getMonth() + 1;
      showTime = showTime.includes("MM")
        ? showTime.replace("MM", fixedTwo(M))
        : showTime.replace("M", String(M));
    }
    if (showTime.includes("D")) {
      const D = date.getDate();
      showTime = showTime.includes("DD")
        ? showTime.replace("DD", fixedTwo(D))
        : showTime.replace("D", String(D));
    }
    if (showTime.includes("H")) {
      const H = date.getHours();
      showTime = showTime.includes("HH")
        ? showTime.replace("HH", fixedTwo(H))
        : showTime.replace("H", String(H));
    }
    if (showTime.includes("m")) {
      var m = date.getMinutes();
      showTime = showTime.includes("mm")
        ? showTime.replace("mm", fixedTwo(m))
        : showTime.replace("m", String(m));
    }
    if (showTime.includes("s")) {
      var s = date.getSeconds();
      showTime = showTime.includes("ss")
        ? showTime.replace("ss", fixedTwo(s))
        : showTime.replace("s", String(s));
    }

    return showTime;
  }
}
