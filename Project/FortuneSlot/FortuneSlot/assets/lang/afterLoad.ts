import { langContent, langNode } from "./node";
import { ELang } from "./langEnum";

export function afterLoad() {
    let lang = ((<any>window).user && (<any>window).user.lang) || ELang.en;
    if (lang && lang.length > 2) lang = lang.substring(0, 2);
    if (![ELang.ar, ELang.en, ELang.id, ELang.tr, ELang.ur].includes(lang as ELang)) lang = ELang.en;
    langNode[lang] = {
        game: {
            win: "Canvas/Game/Bottombar/Win/New Label",
            balance: "Canvas/Game/Bottombar/Account/tb_zs/New Label",
            extra:"Canvas/Game/Topbar/extra/view/content",
            extraBtn:"Canvas/Game/Topbar/extra/container/land/Label",
            autoTip:"Canvas/Game/Bottombar/Auto_Fortune/effect/Label",
            round:""
        },
        help: {
            title:"Canvas/Views/RuleView/RuleViewWindow/Title",
            symbol: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/symbol",
            symboContent: "Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content/content",
            SpecialReel:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/SpecialReel",
            SpecialReelContent1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content1/1/content",
            SpecialReelContent2:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content1/2",
            SpecialReelContent3:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content1/3",
            SpecialReelContent4_1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content1/4/content1",
            SpecialReelContent4_2:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content1/4/content2",
            SpecialReelContent4_3:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content1/4/content3",
            LuckyWheel:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/LuckyWheel",
            LuckyWheelContent1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content2",
            Paytable:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/Paytable",
            PaytableContent1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content3/content",
            GameRule:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/GameRule",
            GameRuleContent1:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content1",
            GameRuleContent2:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content2",
            GameRuleContent3:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content3/content2",
            GameRuleContent4:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content4",
            GameRuleContent5:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content5",
            GameRuleContent6:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content6",
            GameRuleContent7:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content7",
            GameRuleContent8:"Canvas/Views/RuleView/RuleViewWindow/Content/New ScrollView/view/content/RuleContent/content4/content8",
        },
        setting: {
            sound: "Canvas/Views/SettingView/SettingWindow/Sound/Label",
            title: "Canvas/Views/SettingView/SettingWindow/Title"
        },
        notice: {
            autoEnable:"Canvas/Views/NoticeView/label",
            autoDisable:"Canvas/Views/NoticeView/label",
            playing:"Canvas/Views/PlayIngView/SettingWindow/content",
            title:"Canvas/Views/PlayIngView/SettingWindow/Title",
            comfirm:"Canvas/Views/PlayIngView/SettingWindow/start/Confirm"
        },
        history:{
            title:"Canvas/Views/HistoryView/Title",
            time:"Canvas/Views/HistoryView/Bar/Date",
            cost:"Canvas/Views/HistoryView/Bar/Cost",
            result:"Canvas/Views/HistoryView/Bar/Result",
            win:"Canvas/Views/HistoryView/Bar/Win"
        }
    }

    let contents = langContent;
    let ids = langNode;
    let labels = ids[lang];

    const contentAlignR = [
        contents[lang].help.symboContent,
        contents[lang].help.SpecialReelContent1,
        contents[lang].help.SpecialReelContent2,
        contents[lang].help.SpecialReelContent3,
        contents[lang].help.SpecialReelContent4_1,
        contents[lang].help.SpecialReelContent4_2,
        contents[lang].help.SpecialReelContent4_3,
        contents[lang].help.LuckyWheelContent1,
        contents[lang].help.PaytableContent1,
        contents[lang].help.GameRuleContent1,
        contents[lang].help.GameRuleContent2,
        contents[lang].help.GameRuleContent3,
        contents[lang].help.GameRuleContent4,
        contents[lang].help.GameRuleContent5,
        contents[lang].help.GameRuleContent6,
        contents[lang].help.GameRuleContent7,
        contents[lang].help.GameRuleContent8,
        contents[lang].game.extra
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