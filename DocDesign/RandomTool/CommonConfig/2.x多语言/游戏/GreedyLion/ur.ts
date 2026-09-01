import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ur;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=		
`آٹو پلے`;		
text.game.stopAuto =		
`آٹو بند کرو`;		
text.game.result = "نتیجہ";		
text.game.mine = "میری تاریخ";		
text.game.todayWin =		
`آج کی آمدنی:`;		
text.game.todayRank =		
`آج کا درجہ`;		
text.game.round = "راؤنڈ:";		
text.game.salad = "سلاد";		
text.game.pizza = "پیزا";		
text.game.selectTime = "وقت منتخب کریں";		
		
text.help.title = "قاعدہ";		
text.help.content =		
`		
 1. اپنی لاگت کی رقم منتخب کریں اور لاگت کے لیے کھانا منتخب کریں۔
 2. لاگت کی مدت ختم ہونے کے بعد نتائج کا اعلان کیا جائے گا۔
 3. اگر اعلان کردہ نتیجہ آپ کے منتخب کردہ کھانے سے میل کھاتا ہے، تو آپ کو متعلقہ لاگت کے لحاظ سے انعامات ملیں گے۔
 4. باضابطہ انعامی پول بڑھے گا کیونکہ زیادہ سے زیادہ صارفین گیم میں حصہ لیں گے، انعامی پول ایک مخصوص رقم تک پہنچنے پر "PIZZA" یا "SALAD" انعام کا موقع ملے گا۔
 5. اگر "سلاد" کا اعلان کیا گیا تو تمام سبزیوں کو انعام دیا جائے گا۔
 6. اگر "PIZZA" کا اعلان کیا گیا تو تمام گوشت کو انعام دیا جائے گا۔	
`		
		
text.rank.title = "آج کی آمدنی کی درجہ بندی";		
text.rank.column_Ranking = "رینکنگ";		
text.rank.column_Profile = "پروفائل";		
text.rank.column_Name = "نام";		
text.rank.column_Revenue = "مال";		
		
text.myHistory.title = "میری تاریخ";		
text.myHistory.column_Time = "کھیلنے کا وقت";		
text.myHistory.column_Details = "کھیل کی تفصیلات";		
text.myHistory.column_Result = "نتیجہ";		
//text.myHistory.column_Revenue = "مال";		
text.myHistory.round = "راؤنڈ:"		
		
text.exceed.content = "معذرت، آپ ہر گیم راؤنڈ میں 6 سے زیادہ اختیارات کے لئے شرط نہیں لگا سکتے ہیں.";		
text.exceed.confirm = "تصدیق";		

text.setting.title = "سیٹنگ";		
text.setting.sound = "آواز";		
text.setting.on = "پر";		
text.setting.off = "آف";		
		
text.roundFinal.thisRoundBets = " یہ راؤنڈ بیٹس:";		
text.roundFinal.thisRoundRanking = "اس راؤنڈ کی درجہ بندی: ";		
text.roundFinal.thisRoundEarnings = "اس راؤنڈ کی آمدنی: ";		
text.roundFinal.roundNumber = function roundResult(x: number): string {		
return `راؤنڈ ${x} کا نتیجہ:`;		
};		