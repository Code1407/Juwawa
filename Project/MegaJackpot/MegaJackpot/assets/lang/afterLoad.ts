import { langContent, langNode } from "./node";
import { ELang } from "./langEnum";

export function afterLoad() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang[ELang.en];
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    lang = Number(ELang[lang]);
    if (Number.isNaN(lang) || langContent[lang] == null) lang = ELang.en;

    console.log("lang", lang);

    langNode[lang] = {
        // game: {
        //     //autoPlay: "Canvas/Bottombar/Auto/auto_up/Label",
        //     //stopAuto: "Canvas/Bottombar/Auto/auto_down/Label",
        //     //linesLabe1: "Canvas/Bottombar/BetAmountSelector/line_bg/Label1",
        //    // linesLabe2: "Canvas/Bottombar/BetAmountSelector/line_bg/Label2",
        //     //total: "Canvas/Bottombar/BetAmountSelector/bet_total/New Label"
        // },
        help: {
            title: "Canvas/Views/RuleView/RuleViewWindow/Title",
            gameRule: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GameRules",
            content: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GameRulesExplain",
            SpecialSymbols: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/SpecialSymbols",
            wildContent: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Wild/label",
            freeContent: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Scatter/label",
            jackpotContent: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Bonus/label",
            freeTime3: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Scatter/x4/label",
            freeTime4: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Scatter/x3/label",
            freeTime5: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Scatter/x5/label",
        },
        setting: {
            title: "Canvas/Views/SettingView/SettingWindow/Title",
            sound: "Canvas/Views/SettingView/SettingWindow/Sound/Label",
        },
    }

    let contents = langContent;
    let ids = langNode;
    let labels = ids[lang];

    const idsAlignR = [
        ids[lang].help.content,
        ids[lang].help.gameRule,
        ids[lang].help.SpecialSymbols,
        ids[lang].help.wildContent,
        ids[lang].help.freeContent,
        ids[lang].help.jackpotContent,
    ];
    for (var key1 in labels) {
        let items = labels[key1];
        for (var key2 in items) {
            let lebal = ids[lang][key1][key2];
            let content = contents[lang][key1][key2];
            if (content && lebal) {
                // console.debug(`label: ${lebal}, labels.help.content: ${labels.help.content}`);
                console.log(lebal); // 方便找出哪个节点写错了
                let labelComponent = cc.find(lebal).getComponent(cc.Label);
                if (labelComponent) {
                    if (lang != ELang.en) labelComponent.useSystemFont = true;
                    if ([ELang.ar, ELang.ur, ELang.fa].includes(lang as ELang)) {
                        labelComponent.fontFamily = "Yakout";
                        if (idsAlignR.includes(lebal)) labelComponent.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                    }
                    labelComponent.string = content;
                }
                let richTextComponent = cc.find(lebal).getComponent(cc.RichText);
                if (richTextComponent) {
                    if (lang != ELang.en) richTextComponent.useSystemFont = true;
                    if ([ELang.ar, ELang.ur, ELang.fa].includes(lang as ELang)) {
                        richTextComponent.fontFamily = "Yakout";
                        if (idsAlignR.includes(lebal)) richTextComponent.horizontalAlign = cc.macro.TextAlignment.RIGHT;
                    }
                    richTextComponent.string = content;
                    // console.debug(richTextComponent.string);
                }
            }
        }
    }

    (<any>window).langContent = contents[lang];
}
