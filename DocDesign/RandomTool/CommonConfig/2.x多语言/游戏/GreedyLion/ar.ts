import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.autoPlay =
    `رهان 
اتوماتيكي`;
text.game.stopAuto =
    `توقف
أوتوماتيكي`;
text.game.result = "نتيجة";
text.game.mine = `تاريخي`;
text.game.todayWin =
    `أرباح اليوم:`;
text.game.todayRank = `ترتيب اليوم`;
text.game.round = "الجولة: ";
text.game.salad = "سالاد";
text.game.pizza = "بيتزا";
text.game.selectTime = "اختر الوقت"

text.help.title = "قواعد اللعبة";
text.help.content =
`
1. حدد المبلغ الذي ترغب في إنفاقه، ثم اختر الطعام الذي تريد إنفاقه؛

2. ستُعلن النتائج بعد انتهاء فترة الإنفاق؛

3. إذا تطابقت النتيجة المعلنة مع الطعام الذي اخترته، فستحصل على مكافآت تتناسب مع المبلغ المُنفَق؛

4. سيزداد مجموع الجوائز الرسمي مع ازدياد عدد المشاركين في اللعبة، وستكون هناك فرصة للفوز بجائزة "بيتزا" أو "سلطة" عند وصول مجموع الجوائز إلى مبلغ معين؛

5. إذا تم الإعلان عن جائزة "سلطة"، فستحصل على مكافأة تشمل جميع الخضراوات؛

6. إذا تم الإعلان عن جائزة "بيتزا"، فستحصل على مكافأة تشمل جميع أنواع اللحوم.
`

text.rank.title = "ترتيب أرباح اليوم";
text.rank.column_Ranking = "الترتيب ";
text.rank.column_Profile = "صورة";
text.rank.column_Name = "الإسم";
text.rank.column_Revenue = "دخل";

text.myHistory.title = "السجلات التاريخية";
text.myHistory.column_Time = "وقت اللعب";
text.myHistory.column_Details = "تفاصيل اللعب";
text.myHistory.column_Result = "النتائج";
//text.myHistory.column_Revenue = "الفوز";
text.myHistory.round = "الجولة: "

text.exceed.content = "عذرًا، لا يمكنك المراهنة على أكثر من 6 خيارات في كل جولة لعب";
text.exceed.confirm = "أكّد";

text.setting.title = "الإعدادات";
text.setting.sound = "صوت";
text.setting.on = "على";
text.setting.off = "اطفء";

text.roundFinal.thisRoundBets = "رهانات هذه الجولة ";
text.roundFinal.thisRoundRanking = "تصنيفات هذه الجولة ";
text.roundFinal.thisRoundEarnings = "أرباح هذه الجولة ";
text.roundFinal.roundNumber = function roundResult(x: number): string {
    return `نتائج الجولة ${x}:`;
};
