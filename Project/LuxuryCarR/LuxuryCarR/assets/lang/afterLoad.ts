import { langContent, langInCodes, langNode } from "./node";
import { ELang } from "./langEnum";

export function afterLoad() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    if (![ELang.ar, ELang.en, ELang.id, ELang.tr, ELang.ur, ELang.hi].includes(lang as ELang)) lang = ELang.en;

    langNode[lang] = {
        game: { 
            autoPlay: "Canvas/Game/BottomBar/AutoBet/Button/bg1/Label",
            // seven_screen 的停止按钮使用图片，没有文本组件。
            stopAuto: "",
            players: "",
     
            card1Pot: "",
            // 以下字段属于旧版水果/扑克场景，LuxuryCarR 没有对应节点。

            card1Mine: "",
            card2Pot: "",
            card2Mine: "",
            card3Pot: "",
            card3Mine: "",
        },
        help: {
            title: "Canvas/Views/RuleView/RuleWindow/Title",
            content: "Canvas/Views/RuleView/RuleWindow/RuleLabel"
        },
        ready: {
            content: ""
        },
        start: {
            content: ""
        },
        gameHistory: {
            title: "Canvas/Views/MyHistoryView/MyHistoryWindow/Title"
        },
        betLimit: {
            content: "",
        }
    }

    let contents = langContent;
    let ids = langNode;
    let labels = ids[lang];
    for (var key1 in labels) {
        let items = labels[key1];
        for (var key2 in items) {
            let lebal = ids[lang][key1][key2];
            let content = contents[lang][key1][key2];
            if (content && lebal) {
                console.log(lebal); // 方便找出哪个节点写错了
                const node = cc.find(lebal);
                if (!node) {
                    console.warn(`[Language] node not found: ${lebal}`);
                    continue;
                }
                let labelComponent = node.getComponent(cc.Label);
                if (labelComponent) {
                    if (lang != ELang.en) labelComponent.useSystemFont = true;
                    if ([ELang.ar, ELang.ur].includes(lang as ELang) && lebal == labels.help.content) {
                        labelComponent.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                    }
                    labelComponent.string = content;
                }
                let richTextComponent = node.getComponent(cc.RichText);
                if (richTextComponent) {
                    if (lang != ELang.en)  richTextComponent.useSystemFont = true;
                    if ([ELang.ar, ELang.ur].includes(lang as ELang) && lebal == labels.help.content) {
                        richTextComponent.horizontalAlign = cc.macro.TextAlignment.RIGHT;
                    }
                    richTextComponent.string = content;
                }
            }
        }
    }

    (<any>window).langContent = contents[lang];
    (<any>window).langInCode = langInCodes[lang];
}
