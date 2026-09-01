import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;





text.game.autoPlay= `Auto
内测
专用`;
text.game.stopAuto =`Auto
内测
专用`;
text.game.players = "players";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Mine:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Mine:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Mine:";
text.game.todayRound = "Round:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "My History";
text.myHistory.date = "Date";
text.myHistory.betDetail = "Cost Detail";
text.myHistory.result = "Result";
text.myHistory.revenue = "Revenue";

text.help.title = "Game Rules";
text.help.content =
`
Each fruit symbol has two possible outcomes. If "x2" appears below the winning symbol, the reward is calculated using the displayed multiplier; otherwise, the default payout rate applies.

x2 Apple
x2 Banana
x2 Lemon
x2 Watermelon

Default fruit payouts
x3 Grand Apple
x6 Grand Banana
x8 Grand Lemon
x12 Grand Watermelon
x30 BAR

Special rewards:
1. Rainbow Luck (two modes)
- Every reward in the upper half-circle wins once.
- Apple Time: play continues until Apple wins.

2. Yellow Luck (two modes)
- Every reward in the lower half-circle wins once.
- All fruits win once.

Note: Either Luck mode may enter "Bad Luck Time," during which no reward is awarded.
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "Round: "
