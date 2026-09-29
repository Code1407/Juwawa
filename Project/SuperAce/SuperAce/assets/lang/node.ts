class Game { 
    win: string;
    balance: string;
    autoTip: string;
    bet: string;
};

class Setting {
    sound: string;
    title: string;
}

class HelpView {
    StarCardTitle: string;
    StarCardContent: string;
    GoldenSymbolTitle: string;
    GoldenSymbolContent: string;
    ComboMultiplierTitle: string;
    ComboMultiplierContent: string;
    FreeGameTitle: string;
    FreeGameContent: string;
    GameRulesTitle: string;
    GameRulesContent: string;
    JokerSymbolTitle: string;
    JokerSymbolContent: string;
    JokerSymbolJoker1: string;
    JokerSymbolJoker2: string;
    PaytableTitle: string;
    PaytableContent: any;
    PaytableJoker1: string;
    PaytableJoker2: string;
    PaytableJokerText: string;
}

class NoticeView{
    autoEnable: string;
    autoDisable: string;
    playing: string;
}

class ConfirmView {
    title: string;
    content: string;
    confirm: string;
    cancel: string;
}

class Maintenance {
    title: string;
    content: string;
}

class DisconnectionView {
    title: string;
    content: string;
    reconnect: string;
    exit: string;
}


export class LangText {
    game = new Game;
    help = new HelpView;
    setting = new Setting;
    notice = new NoticeView;
}

class LangTexts {
    [lang: string] : LangText;
}

export const langContent: LangTexts = {};
export const langNode: LangTexts = {};