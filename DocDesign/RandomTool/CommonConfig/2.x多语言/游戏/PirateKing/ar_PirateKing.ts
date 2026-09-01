import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `المكافآت`;
text.game.path2 = `تلقائي`;
text.game.path4 = `تسريع`;
text.game.path34 = `القيم المعروضة على هذه الصفحة تمثل الجوائز التي قد تُمنح عند إجمالي الرهان 20.`;
text.game.path35 = `يمكن لـ WILD استبدال أي رمز في اللعبة باستثناء الدوران.`;
text.game.path36 = `تحسب الدوران الرقم الذي يظهر على الشاشة فقط. ليس لها علاقة بالخطوط. إذا ظهر 3 أو أكثر من SPIN على الشاشة، فسيحصل اللاعب على JACKPOT بشكل عشوائي.`;
text.game.path37 = `خط الدفع`;
text.game.path38 = `إعدادات`;
text.game.path39 = `صوت`;
text.game.path58 = `القواعد`;
text.game.path59 = `في اللعبة الحالية، يبلغ معدل العائد النظري العام طويل الأجل للاعب (RTP) 97.52%.`;

text.history.History = `السجل`;
text.history.time = `الوقت`;
text.history.bet = `الرهان`;
text.history.type = `النوع`;
text.history.line = `الخط`;
text.history.count = `العدد`;
text.history.win = `الفوز`;
text.history.round = `الجولة:`;
