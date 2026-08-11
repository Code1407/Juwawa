import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ur;

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

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";

text.help.title = "How to play";
text.help.content = 
`
Each fruit symbol has two possibilities. If there is an "x2" below the winning symbol, the payout amount is calculated based on the number in that symbol; otherwise, it is calculated based on the default payout rate.  
x2 Apple  
x2 Banana  
x2 Lemon  
x2 Watermelon  

Default Fruit Payouts  
x3 Grand Apple  
x6 Grand Banana  
x8 Grand Lemon  
x12 Grand Watermelon  
x30 Bar  

Special Rewards :
1、Rainbow Luck (two scenarios):  
Each reward in the upper half-circle section wins once.  
(Apple Time) Until an Apple wins!  

2、Yellow Luck (two scenarios):  
Each reward in the lower half-circle section wins once.  
All fruits win once!  

However, please note: Both lucky states have a certain probability of entering "Bad Luck Time," during which there are no rewards.
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round =  "round: "