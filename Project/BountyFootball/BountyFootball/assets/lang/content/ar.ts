import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;




text.game.autoPlay= `تلقائي
الاختبار الداخلي
خاص`;
text.game.stopAuto =`تلقائي
الاختبار الداخلي
خاص`;
text.game.players = "اللاعبون";
text.game.balance = "الرصيد :";
text.game.todayRound = "جولة:";
text.game.totalCost = "إجمالي التكلفة:";
text.game.myTotalCost = "إجمالي تكلفتي:";
text.game.finalRoundResult = "جولة:";
text.game.finalRoundWin = "لقد فزت: ";
text.game.finalRoundCost = "تكلفة هذه الجولة: ";
text.game.finalRoundRankTitle = "الفائزون الأوائل في هذه الجولة";
text.game.card1Pot = "الصندوق:";
text.game.card1Mine = "أنا:";
text.game.card2Pot = "الصندوق:";
text.game.card2Mine = "أنا:";
text.game.card3Pot = "الصندوق:";
text.game.card3Mine = "أنا:";

text.ready.content = "وقت الاستعداد";
text.gameHistory.title = "سجل اللعبة";

text.help.title = "القاعدة";
text.help.content = 
`1. توقع الفريق الذي سيضيء قبل السحب.

2. الفريق الذي يضيء بعد السحب هو الفريق الفائز.

3. إذا كان توقعك صحيحاً، ستحصل على جائزة بناءً على الاحتمالات المقابلة.`

text.betLimit.content = "يمكنك فقط أن تنفق لا أكثر من 500,000 في كل جولة!";

codeText.pokerLevel.highCard = "بطاقة عالية"
codeText.pokerLevel.pair = "زوج";
codeText.pokerLevel.straight = "تسلسل";
codeText.pokerLevel.flush = "تدفق";
codeText.pokerLevel.straightFlush = "تسلسل تدفق";
codeText.pokerLevel.fullHouse = "ثلاثة من نوع واحد";
codeText.globalContent.round =  "جولة: "

text.history.title = "تاريخي";
text.history.columnName1 = "وقت التكلفة";
text.history.columnName2 = "تفاصيل التكلفة";
text.history.columnName3 = "تفاصيل المكافأة";
text.history.round = "جولة:";
