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
text.game.stopAuto =`Stop
内测
专用`;
text.game.todayRound = "الجولة:";

text.ready.content = "وقت الاستعداد";
text.gameHistory.title = "سجل اللعبة";
text.myHistory.title = "سجلي";
text.myHistory.date = "التاريخ";
text.myHistory.betDetail = "تفاصيل الرهان";
text.myHistory.result = "النتيجة";
text.myHistory.revenue = "الأرباح";
text.rewarding.content = "جارٍ توزيع الجائزة، يرجى الانتظار!";

codeText.globalContent.round = "الجولة: "
codeText.globalContent.betMaxLimit = "يمكنك المراهنة بما لا يزيد عن {0} في كل جولة";
text.help.title = "قواعد اللعبة";
text.help.content =
`
خيارات الرهان الافتراضية ومضاعفات مكافآت الفواكه هي:
x3 تفاحة كبيرة
x6 موزة كبيرة
x8 ليمونة كبيرة
x12 بطيخة كبيرة
x30 BAR

إذا هبطت على فاكهة تعرض "x2"، فسيتم مضاعفة المضاعف.

المكافآت الخاصة:
1. حظ قوس قزح (وضعان)
- تفوز كل مكافأة في النصف العلوي مرة واحدة.
- وقت التفاح: يستمر اللعب حتى تفوز التفاحة.

2. الحظ الأصفر (وضعان)
- تفوز كل مكافأة في النصف السفلي مرة واحدة.
- تفوز جميع الفواكه مرة واحدة.

تنبيه: قد يدخل أي من وضعي الحظ في "وقت الحظ السيئ"، ولا تُمنح خلاله أي مكافأة.
`
