import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.hi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;




text.game.autoPlay= `ऑटो
बीटा
विशेष`;
text.game.stopAuto =`ऑटो
बीटा
विशेष`;
text.game.players = "खिलाड़ी";
text.game.balance = "शेष :";
text.game.todayRound = "राउंड:";
text.game.totalCost = "कुल लागत:";
text.game.myTotalCost = "मेरी कुल लागत:";
text.game.finalRoundResult = "राउंड:";
text.game.finalRoundWin = "आप जीते: ";
text.game.finalRoundCost = "इस राउंड की लागत: ";
text.game.finalRoundRankTitle = "इस राउंड के शीर्ष विजेता";
text.game.card1Pot = "पॉट:";
text.game.card1Mine = "मेरा:";
text.game.card2Pot = "पॉट:";
text.game.card2Mine = "मेरा:";
text.game.card3Pot = "पॉट:";
text.game.card3Mine = "मेरा:";

text.ready.content = "तैयारी का समय";
text.gameHistory.title = "खेल का इतिहास";

text.help.title = "नियम";
text.help.content = 
`1. ड्रॉ से पहले जिस टीम को जलाया जाता है उसकी भविष्यवाणी करें।

2. ड्रॉ के बाद जो टीम जलती है वह विजेता टीम है।

3. यदि आपकी भविष्यवाणी सही है, तो आपको संबंधित बाधाओं के आधार पर पुरस्कार मिलेगा।`

text.betLimit.content = "आप प्रत्येक राउंड में केवल 500,000 से अधिक खर्च नहीं कर सकते!";

codeText.pokerLevel.highCard = "उच्च कार्ड"
codeText.pokerLevel.pair = "जोड़ी";
codeText.pokerLevel.straight = "सीधा";
codeText.pokerLevel.flush = "फ्लश";
codeText.pokerLevel.straightFlush = "सीधा फ्लश";
codeText.pokerLevel.fullHouse = "तीन का एक जैसा";
codeText.globalContent.round =  "राउंड: "

text.history.title = "मेरा इतिहास";
text.history.columnName1 = "लागत समय";
text.history.columnName2 = "लागत विवरण";
text.history.columnName3 = "इनाम विवरण";
text.history.round = "राउंड:";
