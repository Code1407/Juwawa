import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ur;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;




text.game.autoPlay= `خودکار
بیٹا
خاص`;
text.game.stopAuto =`خودکار
بیٹا
خاص`;
text.game.players = "کھلاڑی";
text.game.balance = "رقم :";
text.game.todayRound = "دور:";
text.game.totalCost = "کل لاگت:";
text.game.myTotalCost = "میری کل لاگت:";
text.game.finalRoundResult = "دور:";
text.game.finalRoundWin = "آپ جیت گئے: ";
text.game.finalRoundCost = "اس دور کی لاگت: ";
text.game.finalRoundRankTitle = "اس دور کے سب سے اوپر کے فاتحین";
text.game.card1Pot = "برتن:";
text.game.card1Mine = "میرا:";
text.game.card2Pot = "برتن:";
text.game.card2Mine = "میرا:";
text.game.card3Pot = "برتن:";
text.game.card3Mine = "میرا:";

text.ready.content = "تیاری کا وقت";
text.gameHistory.title = "کھیل کی تاریخ";

text.help.title = "قاعدہ";
text.help.content = 
`1. ڈراو سے پہلے جس ٹیم کو جلایا جائے گا اس کی پیش گوئی کریں۔

2. ڈراو کے بعد جو ٹیم جلتی ہے وہ جیتنے والی ٹیم ہے۔

3. اگر آپ کی پیش گوئی درست ہے تو آپ کو متعلقہ مشکلات کے مطابق انعام ملے گا۔`

text.betLimit.content = "آپ ہر دور میں صرف 500,000 سے زیادہ خرچ نہیں کر سکتے!";

codeText.pokerLevel.highCard = "اعلی کارڈ"
codeText.pokerLevel.pair = "جوڑا";
codeText.pokerLevel.straight = "سیدھا";
codeText.pokerLevel.flush = "فلش";
codeText.pokerLevel.straightFlush = "سیدھا فلش";
codeText.pokerLevel.fullHouse = "تین ایک جیسے";
codeText.globalContent.round =  "دور: "

text.history.title = "میری تاریخ";
text.history.columnName1 = "لاگت کا وقت";
text.history.columnName2 = "لاگت کی تفصیلات";
text.history.columnName3 = "انعام کی تفصیلات";
text.history.round = "دور:";
