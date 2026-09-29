import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.ur;

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
text.game.todayRound = "راؤنڈ:";

text.ready.content = "تیاری کا وقت";
text.gameHistory.title = "گیم کی تاریخ";
text.myHistory.title = "میری تاریخ";
text.myHistory.date = "تاریخ";
text.myHistory.betDetail = "شرط کی تفصیل";
text.myHistory.result = "نتیجہ";
text.myHistory.revenue = "آمدنی";
text.rewarding.content = "انعام دیا جا رہا ہے، براہ کرم انتظار کریں!";

codeText.globalContent.round = "راؤنڈ: "
codeText.globalContent.betMaxLimit = "آپ فی راؤنڈ زیادہ سے زیادہ {0} تک ہی شرط لگا سکتے ہیں!";
text.help.title = "کھیل کے قواعد";
text.help.content =
`
پہلے سے طے شدہ شرط کے آپشنز اور پھلوں کے بونس ملٹی پلائر یہ ہیں:
x3 بڑا سیب
x6 بڑا کیلا
x8 بڑا لیموں
x12 بڑا تربوز
x30 BAR

اگر آپ "x2" والے پھل پر رکیں تو ملٹی پلائر دوگنا ہو جائے گا۔

خصوصی انعامات:
1. قوسِ قزح کی خوش قسمتی (دو انداز)
- اوپری نصف دائرے کا ہر انعام ایک بار جیتتا ہے۔
- سیب کا وقت: سیب جیتنے تک کھیل جاری رہتا ہے۔

2. زرد خوش قسمتی (دو انداز)
- نچلے نصف دائرے کا ہر انعام ایک بار جیتتا ہے۔
- تمام پھل ایک ایک بار جیتتے ہیں۔

نوٹ: خوش قسمتی کے دونوں انداز "بدقسمتی کے وقت" میں داخل ہو سکتے ہیں، جس دوران کوئی انعام نہیں ملتا۔
`
