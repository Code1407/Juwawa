import { langContent, langNode } from "./node";
import { ELang } from "../shared3/langEnum_shared3";

export { langContent };

export function getLang() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    lang = Number(ELang[lang]);
    if (Number.isNaN(lang) || langContent[lang] == null) lang = ELang.en;
    return lang as ELang;
}

export function afterLoad() {
    let lang = getLang()

    langNode[lang] = {
        game: {
            Round: "Canvas/Game/TodayRound/New Label",
            Today: "Canvas/Game/Popups/RankList/No1/head/today/label",
            Mine: "Canvas/Game/BottomBar/Account/MyDiamond/Number/MyName/Label",
            Win: "Canvas/Game/BottomBar/TodayRevenue/Label",
            Auto01: "Canvas/Game/BottomBar/AutoBet/Button/bg1/Label",
            Auto02: "Canvas/Game/BottomBar/AutoBet/Button/bg2/Label",
        },
        help: {
            title: "Canvas/Views/RuleView/RuleWindow/Title",
            content: "Canvas/Views/RuleView/RuleWindow/RuleLabel"
        },
        roundFinal: {
            Result: "Canvas/Views/RoundFinal/RoundFinalView/MyResult/Result/Label",
            Earnings: "Canvas/Views/RoundFinal/RoundFinalView/MyResult/Earnings/Label1",
            myBet: "Canvas/Views/RoundFinal/RoundFinalView/MyResult/Bet/Label1",
            line: "Canvas/Views/RoundFinal/RoundFinalView/Rank/Label",
        },
        gameHistory: {
            title: "Canvas/Views/MyHistoryView/MyHistoryWindow/Title",
            ColumnName: "Canvas/Views/MyHistoryView/MyHistoryWindow/ColumnName",
            round:"Canvas/Views/MyHistoryView/MyHistoryWindow/ScrollView/view/Content/MyHistoryItemContainer/MyHistoryItem/BetTime/Round/Label",
        },
        RankListView: {
            title: "Canvas/Views/RankListView/RankWindow/Title",
            ColumnName: "Canvas/Views/RankListView/RankWindow/ColumnName",
        }
    }

    let contents = langContent;
    let ids = langNode;
    let labels = ids[lang];

    const contentAlignR = [
        contents[lang].help.content
    ];
    const contentArial = [
        contents[lang].game.Auto01,
        contents[lang].game.Auto02,

    ];

    for (var key1 in labels) {
        let items = labels[key1];
        for (var key2 in items) {
            let lebal = ids[lang][key1][key2];
            let content = contents[lang][key1][key2];
            if (content && lebal) {
                console.log(lebal); // 方便找出哪个节点写错了

                let labelComponent = cc.find(lebal).getComponent(cc.Label);
                if (labelComponent) {
                    if (lang != ELang.en) labelComponent.useSystemFont = true;
                    if ([ELang.ar].includes(lang as ELang)) {
                        if (contentArial.includes(content)) labelComponent.fontFamily = "Arial";
                        else labelComponent.fontFamily = "Yakout";
                        if (contentAlignR.includes(content)) labelComponent.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                    }
                    labelComponent.string = content;
                }
                let richTextComponent = cc.find(lebal).getComponent(cc.RichText);
                if (richTextComponent) {
                    if (lang != ELang.en) richTextComponent.useSystemFont = true;
                    if ([ELang.ar].includes(lang as ELang)) {
                        richTextComponent.fontFamily = "Yakout";
                        if (contentAlignR.includes(content)) richTextComponent.horizontalAlign = cc.macro.TextAlignment.RIGHT;
                    }
                    richTextComponent.string = content;
                }
            }
        }
    }

    (<any>window).langContent = contents[lang];
}