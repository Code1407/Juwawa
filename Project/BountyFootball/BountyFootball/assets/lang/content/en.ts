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
text.game.balance = "Balance :";
text.game.todayRound = "Round:";
text.game.totalCost = "TotalCost:";
text.game.myTotalCost = "My TotalCost:";
text.game.finalRoundResult = "Round:";
text.game.finalRoundWin = "You Win: ";
text.game.finalRoundCost = "This Round' Cost: ";
text.game.finalRoundRankTitle = "The top victors of this round";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Mine:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Mine:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Mine:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";

text.help.title = "Rule";
text.help.content = 
`1. Predict the team that lights up before the draw.

2. The team that lights up after the draw is the winning team.

3. If your prediction is correct, you'll receive a prize based on the corresponding odds.`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round =  "round: "

text.history.title = "My History";
text.history.columnName1 = "Cost Time";
text.history.columnName2 = "Cost Details";
text.history.columnName3 = "Reward Details";