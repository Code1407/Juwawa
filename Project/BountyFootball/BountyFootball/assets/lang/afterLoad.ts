import { langContent, langInCodes, langNode } from "./node";
import { ELang } from "./langEnum";

export function afterLoad() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    if (![ELang.ar, ELang.en, ELang.id, ELang.tr, ELang.ur, ELang.hi, ELang.vn].includes(lang as ELang)) lang = ELang.en;

    langNode[lang] = <any>{
        game: { 
            balance: "Canvas/Game/BottomBar/Account/MyDiamond/BalanceBg/Number/MyName/Balance",
            todayRound: "Canvas/Game/TodayRound/TodayRoundstr",
            finalRoundResult: "Canvas/Views/RoundFinal/RoundFinalView/MyResult/Result/Label",
            finalRoundWin: "Canvas/Views/RoundFinal/RoundFinalView/MyResult/Earnings/Label1",
            finalRoundCost: "Canvas/Views/RoundFinal/RoundFinalView/MyResult/Bet/Label1",
            finalRoundRankTitle: "Canvas/Views/RoundFinal/RoundFinalView/Rank/Label",
        },
        help: {
            title: "Canvas/Views/RuleView/RuleWindow/Title",
            content: "Canvas/Views/RuleView/RuleWindow/RuleLabel"
        },
        history: {
            title: "Canvas/Views/MyHistoryView/MyHistoryWindow/Title",
            columnName1: "Canvas/Views/MyHistoryView/MyHistoryWindow/ColumnName1",
            columnName2: "Canvas/Views/MyHistoryView/MyHistoryWindow/ColumnName2",
            columnName3: "Canvas/Views/MyHistoryView/MyHistoryWindow/ColumnName3",
            // 指向 MyHistoryItemContainer 模板内的 Round:Label，初始化时国际化模板，
            // 后续 cc.instantiate 克隆出的实例会继承翻译后的文本
            round: "Canvas/Views/MyHistoryView/MyHistoryWindow/ScrollView/view/Content/MyHistoryItemContainer/MyHistoryItem/BetTime/Round/Label",
        }
    }

    let contents = langContent;
    let ids = langNode;
    let labels = ids[lang];
    let isRTL = [ELang.ar, ELang.ur].includes(lang as ELang);
    for (var key1 in labels) {
        let items = labels[key1];
        if (!items || typeof items !== 'object') continue;
        for (var key2 in items) {
            let path = ids[lang][key1][key2];
            let content = contents[lang][key1]?.[key2];
            if (content && path) {
                try {
                    let node = cc.find(path);
                    if (!node) {
                        console.warn("[i18n] node not found:", path);
                        continue;
                    }
                    let labelComponent = node.getComponent(cc.Label);
                    if (labelComponent) {
                        // RuleLabel (help.content) 是 LTR 编号列表，所有语言强制左对齐，不应用 RTL 转换
                        // let forceLeft = (key1 === "help" && key2 === "content");
                        // if (forceLeft) {
                        //     labelComponent.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
                        // } else if (isRTL && labelComponent.horizontalAlign == cc.Label.HorizontalAlign.LEFT) {
                        //     labelComponent.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                        // }
                        if (lang != ELang.en) labelComponent.useSystemFont = true;
                        labelComponent.string = content;
                    }
                    let richTextComponent = node.getComponent(cc.RichText);
                    if (richTextComponent) {
                        if (isRTL && richTextComponent.horizontalAlign == cc.macro.TextAlignment.LEFT) {
                            richTextComponent.horizontalAlign = cc.macro.TextAlignment.RIGHT;
                        }
                        if (lang != ELang.en) richTextComponent.useSystemFont = true;
                        richTextComponent.string = content;
                    }
                } catch (e) {
                    console.warn("[i18n] error applying text to:", path, e);
                }
            }
        }
    }

    (<any>window).langContent = contents[lang];
    (<any>window).langInCode = langInCodes[lang];
}
