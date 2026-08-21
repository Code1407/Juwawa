class Game { 
    autoPlay: string;
    stopAuto: string;
    players: string;
    balance: string;
    todayRound: string;
    totalCost: string;
    myTotalCost: string;
    finalRoundResult: string;
    finalRoundWin: string;
    finalRoundCost: string;
    finalRoundRankTitle: string;
    card1Pot: string;
    card1Mine: string;
    card2Pot: string;
    card2Mine: string;
    card3Pot: string;
    card3Mine: string;
};

class History {
    title: string;
    columnName1: string;
    columnName2: string;
    columnName3: string;
    round: string;
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
    betLimit = new Tips;
    history = new History;
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