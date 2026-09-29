import { langContent, langNode } from "./node";
import { ELang } from "./langEnum";

export function afterLoad() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    if (![ELang.ar, ELang.en, ELang.id, ELang.tr, ELang.ur].includes(lang as ELang)) lang = ELang.en;

    langNode[lang] = {
        game: {
            win: "Canvas/Bottombar/Win/New Label",
            balance: "Canvas/Bottombar/Account/tb_zs/New Label",
            autoTip:"Canvas/Bottombar/Auto_SuperAce/effect/Label",
            bet:"Canvas/Bottombar/BetAmountSelector/layout/bet"
        },
        help: {
            StarCardTitle: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/StarCard/title",
            StarCardContent:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/StarCard/content",
            GoldenSymbolTitle:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GoldenSymbol/title",
            GoldenSymbolContent:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GoldenSymbol/content",
            ComboMultiplierTitle:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/ComboMultiplier/title",
            ComboMultiplierContent:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/ComboMultiplier/content",
            FreeGameTitle:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/FreeGame/title",
            FreeGameContent:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/FreeGame/content",
            GameRulesTitle:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GameRules/title",
            GameRulesContent:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GameRules/content",
            JokerSymbolTitle:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/JokerSymbol/title",
            JokerSymbolContent:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/JokerSymbol/content",
            JokerSymbolJoker1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/JokerSymbol/jokers/BigJokerSymbol",
            JokerSymbolJoker2:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/JokerSymbol/jokers/LittleJokerSymbol",
            PaytableTitle:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Paytable/title",
            PaytableContent:undefined,
            PaytableJoker1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Paytable/jokers/BigJokerSymbol",
            PaytableJoker2:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Paytable/jokers/LittleJokerSymbol",
            PaytableJokerText:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Paytable/jokers/text"
        },
        setting: {
            sound: "Canvas/Views/SettingView/SettingWindow/Sound/Label",
            title: "Canvas/Views/SettingView/SettingWindow/Title"
        },
        notice: {
            autoEnable:"Canvas/Views/NoticeView/label",
            autoDisable:"Canvas/Views/NoticeView/label",
            playing:"Canvas/Views/PlayIngView/SettingWindow/content",
        }
    }

    let contents = langContent;
    let ids = langNode;
    let labels = ids[lang];

    const contentAlignR = [

    ];
    for (var key1 in labels) {
        let items = labels[key1];
        for (var key2 in items) {
            let lebal = ids[lang][key1][key2];
            let content = contents[lang][key1][key2];
            if (content && lebal) {
                // console.debug(`label: ${lebal}, labels.help.content: ${labels.help.content}`);
                // if (lebal == labels.help.content) {
                //     content = ((<any>window).gameVersion ? (<any>window).gameVersion + "\n" : "") + content;
                // } 

                console.log(lebal); // 方便找出哪个节点写错了
                let labelComponent = cc.find(lebal).getComponent(cc.Label);
                if (labelComponent) {
                    if (lang != ELang.en) labelComponent.useSystemFont = true;
                    if ([ELang.ar, ELang.ur].includes(lang as ELang)) {
                        labelComponent.fontFamily = "Yakout";
                        if (contentAlignR.includes(content)) labelComponent.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
                    }
                    labelComponent.string = content;
                }
                let richTextComponent = cc.find(lebal).getComponent(cc.RichText);
                if (richTextComponent) {
                    if (lang != ELang.en) richTextComponent.useSystemFont = true;
                    if ([ELang.ar, ELang.ur].includes(lang as ELang)) {
                        richTextComponent.fontFamily = "Yakout";
                        if (contentAlignR.includes(content)) richTextComponent.horizontalAlign = cc.macro.TextAlignment.RIGHT;
                    }
                    richTextComponent.string = content;
                    // console.debug(richTextComponent.string);
                }
            }
        }
    }

    (<any>window).langContent = contents[lang];
}