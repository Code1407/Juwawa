import { ELang } from "../../../common/CommonDefine";
import { paths, textsMap } from "./Path_Mail";

const { ccclass, property } = cc._decorator;

export function ArgsText(str: string, ...args: any[]) {
    for (let i = 0; i < args.length; i++) {
        while (str.includes(`{${i}}`) && args[i].toString() != `{${i}}`)
            str = str.replace(`{${i}}`, args[i].toString());
    }
    return str;
}

@ccclass
export default class LangManager extends cc.Component {
    async start() {
        while ((<any>window).user?.lang == null) {
            await new Promise((res, rej) => {
                setTimeout(() => {
                    res(0);
                }, 50);
            })
        }
        let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
        if (lang && lang.length > 2) lang = lang.substring(0, 2);
        lang = Number(ELang[lang]);
        if (textsMap[lang] == null) lang = Number(ELang.en);
        this.SetLang(lang);
    }
    SetLang(lang: number) {
        try {
            let texts = textsMap[lang];
            //console.log(texts);
            for (let path in paths) {
                if (texts[path]) {
                    try {
                        this.SetTextToPath(lang, texts[path], paths[path]);
                    }
                    catch {
                        console.error(`no path`, paths[path]);
                    }
                }
                else
                    console.error(`no text`, paths[path], paths, texts);
            }
        }
        catch {
            console.error(`lang`, lang);
            console.error(`textMap`, textsMap);
        }
    }
    SetTextToPath(lang: number, text: string, path: string) {
        let allNames = path.split(/\//g).filter((s) => s.length > 0);
        //console.log(path, allNames);
        let targetNode = this.node;
        allNames.shift()
        while (allNames.length > 0) {
            let childName = allNames.shift();
            //console.log(`parent`, targetNode.name, `child`, childName);
            targetNode = targetNode.getChildByName(childName);
        }
        let label = targetNode.getComponent(cc.Label);
        let richText = targetNode.getComponent(cc.RichText);
        if (label != null) {
            if (label.horizontalAlign == cc.Label.HorizontalAlign.LEFT && [ELang.ar, ELang.ur].includes(lang as ELang))
                label.horizontalAlign = cc.Label.HorizontalAlign.RIGHT
            label.string = text;
            if (lang as ELang != ELang.en)
                label.useSystemFont = true;
        }
        if (richText != null) {
            if (richText.horizontalAlign == cc.macro.TextAlignment.LEFT && [ELang.ar, ELang.ur].includes(lang as ELang))
                richText.horizontalAlign = cc.macro.TextAlignment.RIGHT
            richText.string = text;
            if (lang as ELang != ELang.en)
                richText.useSystemFont = true;
        }
        if (label == null && richText == null) {
            console.error(`text not found`, path);
        }
        //console.log(`path`, path, `text`, text);
    }
}