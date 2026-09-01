import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ar;

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
text.game.todayRound = "الجولة:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "سجلي";
text.myHistory.date = "التاريخ";
text.myHistory.betDetail = "تفاصيل الرهان";
text.myHistory.result = "النتيجة";
text.myHistory.revenue = "الأرباح";

text.help.title = "قواعد اللعبة";
text.help.content =
`
لكل رمز فاكهة نتيجتان محتملتان. إذا ظهرت "x2" أسفل الرمز الفائز، تُحسب المكافأة باستخدام المضاعف الظاهر؛ وإلا فتُطبق نسبة الدفع الافتراضية.

x2 تفاحة
x2 موز
x2 ليمون
x2 بطيخ

نسب الدفع الافتراضية للفواكه
x3 تفاحة كبيرة
x6 موزة كبيرة
x8 ليمونة كبيرة
x12 بطيخة كبيرة
x30 BAR

المكافآت الخاصة:
1. حظ قوس قزح (وضعان)
- تفوز كل مكافأة في النصف العلوي مرة واحدة.
- وقت التفاح: يستمر اللعب حتى تفوز التفاحة.

2. الحظ الأصفر (وضعان)
- تفوز كل مكافأة في النصف السفلي مرة واحدة.
- تفوز جميع الفواكه مرة واحدة.

تنبيه: قد يدخل أي من وضعي الحظ في "وقت الحظ السيئ"، ولا تُمنح خلاله أي مكافأة.
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "الجولة: "
