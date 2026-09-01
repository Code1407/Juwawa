// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { paths, textsMap } from "./Path_EX";
import { ELang } from "./langEnum_EX";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LangManager extends cc.Component {
    @property()
    findTextNode = false;
    async start() {
    (<any>window).ongetUserLang = async() => {
        if (this.findTextNode) {
            setTimeout(() => {
                this.DepthFind();
            }, 1000);
        }
        else {
            while ((<any>window).user?.lang == null) {
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        res(0);
                    }, 50);
                })
            }
            console.log("user.lang", (<any>window).user.lang);
            let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
            console.log("langA", lang);
            if (lang && lang.length > 2)
                lang = lang.substring(0, 2);
            console.log("langB", lang);
            lang = Number(ELang[lang]);
            console.log("langC", lang);
            if (textsMap[lang] == null)
                lang = Number(ELang.en);
            console.log("langD", lang);
            this.SetLang(lang);
        }
        }
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
                    catch (e) {
                        console.warn(e);
                        console.warn(`no path`, path);
                    }
                }
                else
                    console.warn(`no text`, paths[path], paths, texts);
            }
        }
        catch (e) {
            console.warn(e);
            console.warn(`lang`, lang);
            console.warn(`textMap`, textsMap);
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
        }
        if (richText != null) {
            if (richText.horizontalAlign == cc.macro.TextAlignment.LEFT && [ELang.ar, ELang.ur].includes(lang as ELang))
                richText.horizontalAlign = cc.macro.TextAlignment.RIGHT
            richText.string = text;
        }
        if (label == null && richText == null) {
            console.warn(`text not found`, path);
        }
        //console.log(`path`, path, `text`, text);
    }
    paths: string[];
    texts: string[];
    path: string;
    text: string;
    //多语言开发工具，直接挂在Canvas根节点，运行后在log中获取到所有文本目录+内容，可直接复制粘贴到lang目录下相关文件
    //用完后移除
    DepthFind() {
        let labels: cc.Node[] = [];
        this.GetLabelsInChildren(this.node, labels);
        let toLog = "";

        for (let i = 0; i < labels.length; i++) {
            toLog += `path${i}:string;\n`
        }
        console.log(toLog);
        toLog = "";

        for (let i = 0; i < labels.length; i++) {
            toLog += `path${i}:"${this.GetPath(labels[i])}",\n`
        }
        console.log(toLog);
        toLog = "";

        for (let i = 0; i < labels.length; i++) {
            if (labels[i].getComponent(cc.Label) != null)
                toLog += `text.path${i}=\`${labels[i].getComponent(cc.Label).string}\`;\n`
            else
                toLog += `text.path${i}=\`${labels[i].getComponent(cc.RichText).string}\`;\n`
        }
        console.log(toLog);
        toLog = "";

    }
    GetPath(_node: cc.Node): string {
        let parent = _node;
        let names: string[] = [];
        names.push(`/${parent.name}`)
        while (parent != this.node) {
            parent = parent.parent;
            if (parent != null) {
                if (parent.parent != null) {
                    names.push(`/${parent.name}`)
                }
                else {
                    names.push(`${parent.name}`)
                }
            }
        }
        let path: string = "";
        for (let i = 0; i < names.length; i++) {
            path += names[names.length - 1 - i];
        }
        return path;
    }
    wd = new RegExp("[A-Za-z]");
    GetLabelsInChildren(node: cc.Node, lbs: cc.Node[]) {
        node.children.forEach(element => {
            if (element.getComponent(LangManager) == null) {
                this.GetLabelsInChildren(element, lbs);
            }
        });
        let lb = node.getComponent(cc.Label);
        if (lb != null) {
            if (this.wd.test(lb.string))
                lbs.push(node);
        }
        let rt = node.getComponent(cc.RichText);
        if (rt != null) {
            if (this.wd.test(rt.string) && !lbs.includes(node))
                lbs.push(node);
        }
    }
}