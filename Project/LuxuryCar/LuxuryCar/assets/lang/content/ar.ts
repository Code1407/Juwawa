import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.Round = ": دائري";
text.game.Today = "اليوم";
text.game.Mine = "توازن";
text.game.Win = "يفوز";
text.game.Auto01 = `أوتوماتيكي`;
text.game.Auto02 = `إلغاء`;	


text.help.title = "كيفية اللعب";
text.help.content =
`
توقع أي شعار سيارة سيضيء قبل السحب

شعار السيارة الذي يضيء بعد السحب هو الشعار الفائز

إذا كانت التوقعات صحيحة، فستحصل على الجائزة التي تعادل التكلفة المقابلة
`

text.roundFinal.Result = ": نتيجة Number الصحيح";
text.roundFinal.Earnings = ": أرباح هذه الجولة";
text.roundFinal.myBet =    ": تكلفة هذه الجولة";
text.roundFinal.line = "تصنيف هذه الجولة ";

text.gameHistory.title = "تاريخ اللعبة";
text.gameHistory.ColumnName = "    الوقت المستغرق في التكلفة           تفاصيل التكلفة          تفاصيل المكافأة";
text.gameHistory.round = ": دائري";

text.RankListView.title = "ترتيب الإيرادات اليوم";
text.RankListView.ColumnName = "تصنيف      حساب تعريفي           اسم                 ربح";

