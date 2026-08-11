class Game { 
    Round: string;
    Today: string;
    Mine: string;
    Win: string;
    Auto01: string;
    Auto02: string;
};

class help {
    title: string;
    content: string;
}

class roundFinal {
    Result: string;
    Earnings: string;
    myBet: string;
    line: string;
};

class gameHistory {
    title: string;
    ColumnName: string;
    round: string;
};

class RankListView {
    title: string;
    ColumnName: string;
};


export class LangText {
    game = new Game;
    help = new help;
    roundFinal = new roundFinal;
    gameHistory = new gameHistory;
    RankListView=new RankListView;
}

class LangTexts {
    [lang: string] : LangText;
}

export const langContent: LangTexts = {};
export const langNode: LangTexts = {};