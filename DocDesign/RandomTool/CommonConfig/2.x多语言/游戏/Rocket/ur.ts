import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ur;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "راکٹ";
text.game.hisLabel = "اس کا:";
text.game.label = "تمام";
text.game.cashoutNumDes1 = "آٹو ایسک";
text.game.cashoutNumDes2 = "آٹو ایسک";
text.game.cashoutNumDes3 = "آٹو ایسک";
text.game.waitfornextround1 = "اگلے راؤنڈ کا انتظار کریں";
text.game.waitfornextround2 = "اگلے راؤنڈ کا انتظار کریں";
text.game.waitfornextround3 = "اگلے راؤنڈ کا انتظار کریں";
text.game.escape1 = "فرار";
text.game.escape2 = "فرار";
text.game.escape3 = "فرار";
text.game.joinNow = "ابھی شامل ہوں!";
text.game.youHeight = "آپ کی فرار کی اونچائی:";
text.game.youReward = "انعام حاصل کریں:";
text.game.PersistentEfforts = "مسلسل کوشش!!";


text.help.title = "ہدایت";
text.help.content =
`1۔ ٹیک آف کرنے سے پہلے اپنی شرط لگائیں۔
2. خطرہ مول لیں اور مشکلات کے بہتر ہونے کا انتظار کریں۔
3. راکٹ پھٹنے سے پہلے فرار!
4. دھماکے کا نقطہ @ 1.00x سے 10,000x ہے۔
5. سب سے کم فرار پوائنٹ @1.01x ہے۔
6. اگر کوئی کھلاڑی موجودہ کھیل چھوڑ دیتا ہے، تو اسے فرار تصور کیا جائے گا، اور خودکار شرط کو منسوخ کر دیا جائے گا۔
7. براہ کرم نوٹ کریں: آپ کے نیٹ ورک کنکشن پر منحصر ہے، کلک کرنے پر آخری فرار نقطہ اونچائی سے زیادہ ہو سکتا ہے، جس کے نتیجے میں دھماکے سے پہلے فرار ہونے میں ناکامی بھی ہو سکتی ہے۔`

text.help.addContent = `8.موجودہ گیم میں، کھلاڑیوں کی مجموعی طویل مدتی گیم تھیوری ریٹرن ریٹ (RTP) 97.52% ہے۔`

text.ready.content1 = "الٹی گنتی"
text.ready.content2 = "تیاری!"

text.inpuView.content3 = "ٹھیک ہے"
text.inpuView.content4 = "زیادہ سے زیادہ"
text.inpuView.content5 = "کم از کم"


text.quitView.content = "راکٹ ٹیک آف کر رہا ہے، کیا آپ بغیر کیش آؤٹ کے باہر نکلنا چاہتے ہیں؟";
text.quitView.confirm = "تصدیق کریں";
text.quitView.cancel = "منسوخ کریں";

text.myRecord.content = "بیٹنگ ریکارڈ"
text.myRecord.nodata = "کوئی ڈیٹا نہیں";

text.gameHistory.content1 = "دھماکے کا مقام";
text.gameHistory.content2 = "دھماکے کے مقام کی شماریات:";
text.gameHistory.content3 = "اونچائی";
text.gameHistory.content4 = "آخری 10 راؤنڈ";
text.gameHistory.content5 = "آخری 20 راؤنڈ";
text.gameHistory.content6 = "آخری 30 راؤنڈ";
text.gameHistory.content7 = "آخری 50 راؤنڈ";
text.gameHistory.content8 = "آخری 100 راؤنڈ";

text.disconnectCash.content = `نیٹ ورک منقطع ہو گیا ہے، اور آپ خودکار طور پر فرار ہو گئے ہیں۔
نوٹ: کامیابی سے فرار ہونے کے لیے براہ کرم نیٹ ورک کھلا رکھیں!`;
text.disconnectCash.reconnect = "دوبارہ جوڑیں";
text.disconnectCash.exit = "باہر نکلیں";

codeText.betView.alreadybet = "پہلے سے شرط لگائی گئی!";
codeText.betView.bet = "شرط"
codeText.betView.holdtoauto = "آٹو کے لیے دبائے رکھیں"
codeText.betView.cancelauto = 'آٹو روکیں'
codeText.betView.betnext = "اگلی شرط"
codeText.betView.automodel = "آٹو شرط"
codeText.betView.cancel = "منسوخ"
codeText.betView.cancelnext = "اگلی منسوخ کریں"
codeText.betView.escape = "فرار"
codeText.betView.escape2 = "فرار"
codeText.betView.escape3 = "فرار نہیں ہوا"
codeText.betView.cancelbet = "شرط منسوخ کریں"
codeText.betView.betnext2 = "اگلی شرط+"
codeText.betView.exploded = "پھٹ گیا"
codeText.betView.maxBetLimit = "حد سے تجاوز"

codeText.globalContent.flightheight = "پرواز کی اونچائی"
codeText.globalContent.vacancy = "خالی جگہ"
codeText.globalContent.rocket = "راکٹ"
codeText.globalContent.inputContent1 = "حد:100.00-50,000.00"
codeText.globalContent.inputContent2 = "رقم درج کریں:"
codeText.globalContent.inputContent3 = "فرار کی اونچائی:1.01-100.00"
codeText.globalContent.inputContent4 = "ایک فرار پوائنٹ درج کریں:"
codeText.globalContent.round =  "راؤنڈ: "
