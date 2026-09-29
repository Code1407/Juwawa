import { langContent, langInCodes, langNode } from "./node";
import { ELang } from "./langEnum";

export function afterLoad() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    if (![ELang.ar, ELang.bn, ELang.en, ELang.es, ELang.id, ELang.pt, ELang.tr, ELang.ur, ELang.hi, ELang.vi, ELang.vn, ELang.th].includes(lang as ELang)) lang = ELang.en;

    langNode[lang] = {
        game: { 
            autoPlay: "Canvas/Game/BottomView/AutoBet/Button/bg1/New Label",
            stopAuto: "Canvas/Game/BottomView/AutoBet/Button/bg2/New Label",
            players: "Canvas/Game/BottomView/Ranking/an_players/New Label",
            card1Pot: "Canvas/Game/Cards/Card1/pos/AllNumber/name",
            card1Mine: "Canvas/Game/Cards/Card1/pos/MineNumber/Mine",
            card2Pot: "Canvas/Game/Cards/Card2/pos/AllNumber/name",
            card2Mine: "Canvas/Game/Cards/Card2/pos/MineNumber/Mine",
            card3Pot: "Canvas/Game/Cards/Card3/pos/AllNumber/name",
            card3Mine: "Canvas/Game/Cards/Card3/pos/MineNumber/Mine",
            todayRound: "Canvas/Game/TodayRound/NewLabel",
        },
        help: {
            title: "Canvas/Views/RuleView/New Label",
            content: "Canvas/Views/RuleView/ruleView/Mask/content"
        },
        ready: {
            content: "Canvas/Views/ReadyView/Label"
        },
        start: {
            content: "Canvas/Views/BetView/Label"
        },
        gameHistory: {
            title: "Canvas/Views/GameRecordView/New Label"
        },
        myHistory: {
            title: "Canvas/Views/MyHistoryView/MyHistory",
            date: "Canvas/Views/MyHistoryView/Field/Date",
            betDetail: "Canvas/Views/MyHistoryView/Field/BetDetail",
            result: "Canvas/Views/MyHistoryView/Field/Result",
            revenue: "Canvas/Views/MyHistoryView/Field/Revenue",
        },
        rewarding: {
            content: "Canvas/Views/RewardingView/panel/Content",
        },
        

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
                let labelComponent = cc.find(lebal).getComponent(cc.Label);
                if (labelComponent) {
                    if (lang != ELang.en) labelComponent.useSystemFont = true;
                    if (key1 === "myHistory") labelComponent.overflow = cc.Label.Overflow.SHRINK;
                    if ([ELang.ar, ELang.ur].includes(lang as ELang) && lebal == labels.help.content) {
                        labelComponent.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                    }
                    labelComponent.string = content;
                }
                let richTextComponent = cc.find(lebal).getComponent(cc.RichText);
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
