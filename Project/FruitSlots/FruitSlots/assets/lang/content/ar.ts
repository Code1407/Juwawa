import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.autoPlay= `تلقائي`;
text.game.stopAuto= `تلقائي`;
text.game.linesLabe1= "سطرًا";
text.game.linesLabe2= "30";
text.game.total = " إجمالي";

text.help.title = "  قواعد اللعبة  ";
text.help.gameRule = ": قواعد اللعبة ";
text.help.SpecialSymbols = ": البنود الخاصة  ";
text.help.content = 
`هناك 7 رموز عادية و 30 سطر دفع معروضة في اللعبة ؛
عندما تتوقف البكرات عن الدوران وتهبط الرموز الثلاثة الأولى من اليسار إلى اليمين على خط الدفع المنشط ، يمكنك الفوز بجائزة أساسية ؛
يتم حساب كل سطر دفع بشكل منفصل ، وكلما زاد عدد خطوط الدفع التي تقوم بتنشيطها ، قد تربح جوائز الخام ؛
يختلف مضاعف المكافأة لكل رمز، دفع تعويضات الجائزة = مبلغ الرهان × مضاعف المكافأة، راجع التفاصيل أدناه
`
text.help.wildContent = "يمكن أن تحل محل جميع الرموز الأخرى باستثناء رموز المكافآت والمبعثر";
text.help.freeContent = "عند ظهور 3 منهم أو أكثر ، تحصل على العديد من التدوير المجاني";
text.help.jackpotContent = "عندما تظهر 3 منهم أو أكثر ، فإنك تفوز بالجائزة الكبرى";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>مرات";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>مرات";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>مرات";

text.setting.title = "جلسة";
text.setting.sound = "صوت";