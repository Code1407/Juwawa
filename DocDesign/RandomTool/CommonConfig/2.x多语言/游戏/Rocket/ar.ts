import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""

text.game.TitleLabel= "صاروخ";
text.game.hisLabel = "خاصته";
text.game.label = "الجميع";
text.game.cashoutNumDes1 = "الهروب تلقائيا";
text.game.cashoutNumDes2 = "الهروب تلقائيا";
text.game.cashoutNumDes3 = "الهروب تلقائيا";
text.game.waitfornextround1 = "انتظر الجولة القادمة";
text.game.waitfornextround2 = "انتظر الجولة القادمة";
text.game.waitfornextround3 = "انتظر الجولة القادمة";
text.game.escape1 = "الهروب بنجاح";
text.game.escape2 = "الهروب بنجاح";
text.game.escape3 = "الهروب بنجاح";
text.game.joinNow = "انضم الآن";
text.game.youHeight = ":ارتفاع الهروب الخاص بك";
text.game.youReward = ":احصل على مكافآت";
text.game.PersistentEfforts = "جهود متواصلة";

text.help.title = "تعليمات";
text.help.content = `
قم بوضع رهانك قبل الإقلاع؛
خذ المخاطرة وانتظر حتى تتحسن الاحتمالات؛
الهروب قبل أن ينفجر الصاروخ؛
نقطة الانفجار هي @ 1.00 إلى 10,000؛
أدنى نقطة هروب هي @ 1.01؛
سيُعتبر أي تصرف لمغادرة اللعبة الحالية قفزاً بالمظلة
وسيتم إلغاء الرهان التلقائي
يرجى ملاحظة: اعتمادًا على اتصال الشبكة لديك، قد تكون نقطة الهروب النهائية أعلى من الارتفاع عند النقر عليها، مما قد يؤدي أيضًا إلى فشل الهروب قبل الانفجار `

text.help.addContent = `في اللعبة الحالية، يبلغ معدل الاسترداد 
(RTP) النظري لفلسفة اللعبة طويلة الأجل
%97.52 العام للمشجعين 
`

text.ready.content1 = "وقت التبريد"
text.ready.content2 = "تحضير"

text.inpuView.content1 = "الحد: 100-50,000"
text.inpuView.content2 = "يرجى الإدخال"
text.inpuView.content3 = "نعم"
text.inpuView.content4 = "الأعلى"
text.inpuView.content5 = "أدنى"
text.inpuView.amountLess = function(amount: number) {
    return `${amount} لا يمكن أن يقل مبلغ الرهان عن`;
}
text.inpuView.multiplesOf100 = "100 يتم تقريبها تلقائيًا إلى مضاعفات العدد"
text.inpuView.escapeLess = function(amount: number){
    return `${amount} لا يمكن أن تكون نقطة الهروب أقل من`
}


text.quitView.content = "الصاروخ ينطلق، هل تريد الخروج بدون سحب أموال؟";
text.quitView.confirm = "تأكيد";
text.quitView.cancel = "إلغاء";

text.myRecord.content = "سجل الرهان"
text.myRecord.nodata = "لايوجد بيانات";

text.gameHistory.content1 = "نقطة الانفجار";
text.gameHistory.content2 = "إحصائيات نقطة الانفجار ";
text.gameHistory.content3 = "ارتفاع";
text.gameHistory.content4 = "آخر 10 جولات";
text.gameHistory.content5 = "آخر 20 جولات";
text.gameHistory.content6 = "آخر 30 جولات";
text.gameHistory.content7 = "آخر 50 جولات";
text.gameHistory.content8 = "آخر 100 جولات";
text.gameHistory.offLine = "غير متصل"

text.disconnectCash.content = `تم قطع الشبكة وهربت تلقائيًا.
ملحوظة: يرجى إبقاء الشبكة مفتوحة للهروب بنجاح!`;
text.disconnectCash.reconnect = "أعد الاتصال";
text.disconnectCash.exit =  "يترك";

codeText.betView.alreadybet = "تم وضع الرهان";
codeText.betView.bet = "وضع رهان"
codeText.betView.holdtoauto = "اضغط على الوضع التلقائي"
codeText.betView.cancelauto = "إلغاء الوضع التلقائي"
codeText.betView.betnext = "الرهان مقدما"
codeText.betView.automodel = "الوضع التلقائي"
codeText.betView.cancel = "يلغي"
codeText.betView.cancelnext = "إلغاء الرهان المسبق"
codeText.betView.escape = "الهروب بنجاح"
codeText.betView.escape2 = "الهروب بنجاح"
codeText.betView.escape3 = "لم يهرب"
codeText.betView.cancelbet = "إلغاء الرهان"
codeText.betView.betnext2 = "الرهان التالي+"
codeText.betView.exploded = "انفجرت"
codeText.betView.maxBetLimit = "تجاوز الحد الأقصى لمبلغ الرهان"

codeText.globalContent.flightheight = "ارتفاع الرحلة"
codeText.globalContent.vacancy = "ترك منصب شاغر"
codeText.globalContent.rocket = "صاروخ"
codeText.globalContent.inputContent1 = "الحد:100.00-50.000.00"
codeText.globalContent.inputContent2 = ":الرجاء إدخال المبلغ"
codeText.globalContent.inputContent3 = "ارتفاع الهروب: 1.01-100.00"
codeText.globalContent.inputContent4 = ":أدخل نقطة الهروب"
codeText.globalContent.round =  "الجولة: "



