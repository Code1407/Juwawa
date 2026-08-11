let md5 = require('md5-node');

export default class Md5Signer {
    lastSource: string;

    constructor(private uppercase: boolean = true) {
        this.lastSource = "";
    }

    getSourceString(): string {
        return this.lastSource;
    }

    digest(src: string): string {
       this.lastSource = src;

       console.log("s1:",src);

       let sign = md5(src);

       console.log("s2:",sign.toUpperCase());

       return this.uppercase ? sign.toUpperCase() : sign;
    };

}
