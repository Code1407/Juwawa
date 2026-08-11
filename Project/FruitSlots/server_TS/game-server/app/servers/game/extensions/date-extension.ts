Date.prototype.dateFormat = function (format = "YYYY-MM-DD HH:mm:ss"): string {
  function fixedTwo(value: number): string {
    return value < 10 ? "0" + value : String(value);
  }

  var showTime = format;
  if (showTime.includes("SSS")) {
    const S = this.getMilliseconds();
    showTime = showTime.replace("SSS", "0".repeat(3 - String(S).length) + S);
  }
  if (showTime.includes("YY")) {
    const Y = this.getFullYear();
    showTime = showTime.includes("YYYY")
      ? showTime.replace("YYYY", String(Y))
      : showTime.replace("YY", String(Y).slice(2, 4));
  }
  if (showTime.includes("M")) {
    const M = this.getMonth() + 1;
    showTime = showTime.includes("MM")
      ? showTime.replace("MM", fixedTwo(M))
      : showTime.replace("M", String(M));
  }
  if (showTime.includes("D")) {
    const D = this.getDate();
    showTime = showTime.includes("DD")
      ? showTime.replace("DD", fixedTwo(D))
      : showTime.replace("D", String(D));
  }
  if (showTime.includes("H")) {
    const H = this.getHours();
    showTime = showTime.includes("HH")
      ? showTime.replace("HH", fixedTwo(H))
      : showTime.replace("H", String(H));
  }
  if (showTime.includes("m")) {
    var m = this.getMinutes();
    showTime = showTime.includes("mm")
      ? showTime.replace("mm", fixedTwo(m))
      : showTime.replace("m", String(m));
  }
  if (showTime.includes("s")) {
    var s = this.getSeconds();
    showTime = showTime.includes("ss")
      ? showTime.replace("ss", fixedTwo(s))
      : showTime.replace("s", String(s));
  }

  return showTime;
};

Date.prototype.addDays = function (n: number): Date {
  return new Date(this.getTime() + n * 24 * 60 * 60 * 1000);
};

export {}; 