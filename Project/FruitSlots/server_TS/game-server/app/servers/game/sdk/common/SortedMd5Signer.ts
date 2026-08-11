import Md5Signer from "./Md5Signer";

enum KeyPosition {
    FIRST = 0,
    MIX,
    LAST,
}

export default class SortedMd5Signer extends Md5Signer {

    constructor(protected key?: string, protected keyName?: string,
                protected separator: string = "&", protected keyPosition: KeyPosition = KeyPosition.LAST) {
        super();
    }

    sort(map: Map<string, any> | Object): string {
        if (!map) return "";
        let dict: Map<string, any>;
        if (typeof map == "object") {
            dict = new Map(Object.entries(map));
        } else {
            dict = map;
        }

        if (this.keyPosition == KeyPosition.MIX && this.keyName && this.key) {
            dict.set(this.keyName, this.key);
        }

        const sortedArray = Array.from(dict).sort((a, b) => a[0].localeCompare(b[0]));
        // 使用reduce方法来拼接字符串
        let encodedString = sortedArray.reduce((acc, [key, value]) => {
            if (key == "sign") {
                return acc;
            }

            const encodedKey = key;
            const encodedValue = value.toString();

            // 如果acc不是空字符串，添加 '&' 来分隔新的键值对
            return acc + (acc ? this.separator : '') + `${encodedKey}=${encodedValue}`;
        }, '');

        if (this.key) {
            const keyString = this.keyName ? `${this.keyName}=${this.key}` : this.key;
            if (this.keyPosition == KeyPosition.FIRST) {
                encodedString = `${keyString}${this.separator}${encodedString}`;
            } else if (this.keyPosition == KeyPosition.LAST) {
                encodedString = `${encodedString}${this.separator}${keyString}`;
            }
        }

        return encodedString;
    }

    digest(src: Map<string, any> | string | Object): string {
        if (!src) return "";

        if (typeof src === 'string') {
            return super.digest(src);
        }

        this.lastSource = this.sort(src);

        return super.digest(this.lastSource);
    }

}
