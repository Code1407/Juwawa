class Game { 
    autoPlay: string;
    stopAuto: string;
    linesLabe1: string;
    linesLabe2: string;
    total: string;
};

class Setting {
    title: string;
    sound: string;
}

class HelpView {
    title: string;
    gameRule: string;
    SpecialSymbols: string;
    content: string;
    wildContent: string;
    freeContent: string;
    jackpotContent: string;
    freeTime3: string;
    freeTime4: string;
    freeTime5: string;
}


export class LangText {
    game = new Game;
    help = new HelpView;
    setting = new Setting;
}

class LangTexts {
    [lang: string] : LangText;
}

export const langContent: LangTexts = {};
export const langNode: LangTexts = {};