// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ELang } from "./langEnum_shared3";

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
    static Instance: LangManager;
    @property()
    findTextNode = false;
    protected onLoad(): void {
        LangManager.Instance = this;
    }
    async start() {
        if (this.findTextNode) {
            this.DepthFind();
        }
    }
    SetLang(lang: number) {
        try {
            let texts = (<any>window).textsMap[lang];
            let paths = (<any>window).paths;
            //console.log(texts);
            for (let path in paths) {
                if (texts[path]) {
                    try {
                        this.SetTextToPath(lang, texts[path], paths[path]);
                    }
                    catch (e) {
                        console.warn(e);
                        console.warn(`no path`, paths[path]);
                    }
                }
                else
                    console.warn(`no text`, paths[path], paths, texts);
            }
        }
        catch (e) {
            console.warn(e);
            console.warn(`lang`, lang);
            console.warn(`textMap`, (<any>window).textsMap);
        }
    }
    SetTextToPath(lang: number, text: string, path: string) {
        if (path[0] == '/')
            path = path.substring(1);
        let targetNode = cc.find(path.substring(path.indexOf("/")), this.node);
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
    //多语言开发工具，直接挂在Canvas根节点，勾选findTextNode，运行后在log中获取到所有文本目录+内容，可直接复制粘贴到lang目录下相关文件
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
            toLog += `path${i}:"${getNodePath(labels[i])}",\n`
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
    wd = new RegExp("[A-Za-z][A-Za-z]");
    GetLabelsInChildren(node: cc.Node, labelNodes: cc.Node[]) {

        node.children.forEach(element => {
            if (element.getComponent(LangManager) == null) {
                this.GetLabelsInChildren(element, labelNodes);
            }
        });
        let lb = node.getComponent(cc.Label);
        if (lb != null) {
            if (this.wd.test(lb.string) && lb.string.length > 1)
                labelNodes.push(node);
        }
        let rt = node.getComponent(cc.RichText);
        if (rt != null) {
            if (this.wd.test(rt.string) && rt.string.length > 1 && !labelNodes.includes(node))
                labelNodes.push(node);
        }
    }
}

export function getLang() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
    if (lang && lang.length > 2)
        lang = lang.substring(0, 2);
    lang = Number(ELang[lang]);
    if (Number.isNaN(lang) || (<any>window).textsMap[lang] == null)
        lang = ELang.en;
    return lang as ELang;
}
export function getNodePath(node: cc.Node) {
    let path: string;
    while (node && !(node instanceof cc.Scene)) {
        if (path) {
            path = node.name + '/' + path;
        }
        else {
            path = node.name;
        }
        node = node.parent;
    }
    return path;
}