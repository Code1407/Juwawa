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
text.game.stopAuto =`Auto
内测
专用`;
text.game.players = "players";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Mine:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Mine:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Mine:";
text.game.todayRound = "راؤنڈ:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "میری تاریخ";
text.myHistory.date = "تاریخ";
text.myHistory.betDetail = "شرط کی تفصیل";
text.myHistory.result = "نتیجہ";
text.myHistory.revenue = "آمدنی";

text.help.title = "کھیل کے قواعد";
text.help.content =
`
ہر پھل کی علامت کے دو ممکنہ نتائج ہیں۔ اگر جیتنے والی علامت کے نیچے "x2" نظر آئے تو انعام دکھائے گئے ملٹی پلائر کے مطابق شمار ہوگا؛ ورنہ پہلے سے طے شدہ ادائیگی کی شرح لاگو ہوگی۔

x2 سیب
x2 کیلا
x2 لیموں
x2 تربوز

پھلوں کی پہلے سے طے شدہ ادائیگیاں
x3 بڑا سیب
x6 بڑا کیلا
x8 بڑا لیموں
x12 بڑا تربوز
x30 BAR

خصوصی انعامات:
1. قوسِ قزح کی خوش قسمتی (دو انداز)
- اوپری نصف دائرے کا ہر انعام ایک بار جیتتا ہے۔
- سیب کا وقت: سیب جیتنے تک کھیل جاری رہتا ہے۔

2. زرد خوش قسمتی (دو انداز)
- نچلے نصف دائرے کا ہر انعام ایک بار جیتتا ہے۔
- تمام پھل ایک ایک بار جیتتے ہیں۔

نوٹ: خوش قسمتی کے دونوں انداز "بدقسمتی کے وقت" میں داخل ہو سکتے ہیں، جس دوران کوئی انعام نہیں ملتا۔
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "راؤنڈ: "
