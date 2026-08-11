class Game { 
    win: string;
    balance: string;
    extra: string;
    extraBtn: string;
    autoTip: string;
    round:string;
};

class Setting {
    sound: string;
    title: string;
}

class HelpView {
    title: string;
    symbol: string;
    symboContent: string;
    SpecialReel: string;
    SpecialReelContent1: string;
    SpecialReelContent2: string;
    SpecialReelContent3: string;
    SpecialReelContent4_1: string;
    SpecialReelContent4_2: string;
    SpecialReelContent4_3: string;
    LuckyWheel: string;
    LuckyWheelContent1: string;
    Paytable: string;
    PaytableContent1: string;
    GameRule: string;
    GameRuleContent1: string;
    GameRuleContent2: string;
    GameRuleContent3: string;
    GameRuleContent4: string;
    GameRuleContent5: string;
    GameRuleContent6: string;
    GameRuleContent7: string;
    GameRuleContent8: string;
}

class NoticeView{
    autoEnable: string;
    autoDisable: string;
    playing: string;
    title:string;
    comfirm:string;
}

class HistoryView {
    title: string;
    time: string;
    cost: string;
    result: string;
    win: string;
}


export class LangText {
    game = new Game;
    help = new HelpView;
    setting = new Setting;
    notice = new NoticeView;
    history = new HistoryView;
}

class LangTexts {
    [lang: string] : LangText;
}

export const langContent: LangTexts = {};
export const langNode: LangTexts = {};