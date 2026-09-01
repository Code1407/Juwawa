class Game { 
    autoPlay: string;
    stopAuto: string;
    players: string;
    card1Pot: string;
    card1Mine: string;
    card2Pot: string;
    card2Mine: string;
    card3Pot: string;
    card3Mine: string;
    todayRound: string;
};

class View {
    title: string;
    content: string;
}

class Tips {
    content: string;
};

export class LangText {
    game = new Game;
    help = new View;
    ready = new Tips;
    start = new Tips;
    gameHistory = {title: undefined};
    myHistory = {
        title: undefined,
        date: undefined,
        betDetail: undefined,
        result: undefined,
        revenue: undefined
    };
    betLimit = new Tips;
}

class LangTexts {
    [lang: string] : LangText;
}


export class LangInCode {
    pokerLevel = {
        highCard: "",
        pair: "",
        straight: "",
        flush: "",
        straightFlush: "",
        fullHouse: ""
    }
    globalContent = {
        round:""
    }
}
class LangInCodes {
    [lang: string] : LangInCode;
}

export const langContent: LangTexts = {};
export const langNode: LangTexts = {};
export const langInCodes: LangInCodes = {};
