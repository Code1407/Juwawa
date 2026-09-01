import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.hi;

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
text.game.todayRound = "राउंड:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "मेरा इतिहास";
text.myHistory.date = "तारीख";
text.myHistory.betDetail = "दांव का विवरण";
text.myHistory.result = "परिणाम";
text.myHistory.revenue = "आय";

text.help.title = "खेल के नियम";
text.help.content =
`
प्रत्येक फल चिह्न के दो संभावित परिणाम हैं। यदि विजेता चिह्न के नीचे "x2" दिखाई देता है, तो इनाम दिखाए गए गुणक से तय होगा; अन्यथा डिफ़ॉल्ट भुगतान दर लागू होगी।

x2 सेब
x2 केला
x2 नींबू
x2 तरबूज

फलों की डिफ़ॉल्ट भुगतान दरें
x3 बड़ा सेब
x6 बड़ा केला
x8 बड़ा नींबू
x12 बड़ा तरबूज
x30 BAR

विशेष इनाम:
1. रेनबो लक (दो मोड)
- ऊपरी अर्धवृत्त का प्रत्येक इनाम एक बार मिलता है।
- एप्पल टाइम: सेब जीतने तक खेल जारी रहता है।

2. येलो लक (दो मोड)
- निचले अर्धवृत्त का प्रत्येक इनाम एक बार मिलता है।
- सभी फल एक-एक बार जीतते हैं।

नोट: दोनों लक मोड में "बैड लक टाइम" आ सकता है, जिसमें कोई इनाम नहीं मिलता।
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "राउंड: "
