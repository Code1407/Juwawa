import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ur;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "دوبارہ";
text.game.new = "نیا >"
text.game.gameStart = "گیم شروع کریں";
text.game.starting = "شروع ہو رہا ہے";
text.game.round = "راؤنڈ:";
text.game.gainedCoins = "حاصل کردہ سکے:";
text.gameRecord.title1 = "گیم کی تاریخ";
text.gameRecord.title2 = "میری تاریخ";
text.gameRecord.nodata = "کوئی ڈیٹا نہیں";
text.gameRecord.rule = "صرف 7 دن کے لیے دکھایا جاتا ہے، روزانہ زیادہ سے زیادہ 100 ریکارڈ";
text.gameRecord.new = "نیا";

text.help.title = "گیم کے قواعد";
text.help.content =
`رولیٹا ایک دلچسپ اور پرجوش کھیل ہے۔

1. اعداد: 0 (36 گنا انعام)، 1-12 (3 گنا انعام)، 13-24 (3 گنا انعام)، 25-36 (3 گنا انعام)؛

2. رنگ: سرخ (2x انعام)، سیاہ (2x انعام)؛

3. طاق اور جفت: طاق (2x انعام)، جفت لیکن 0 کے علاوہ (2x انعام)۔

خوش گیمنگ!`
text.help.reward = "انعام دیا جا رہا ہے، براہ کرم انتظار کریں!";
text.help.wait = "براہ کرم اگلے راؤنڈ کا انتظار کریں";

codeText.globalContent.Time = "وقت"
codeText.globalContent.bet = "شرط";
codeText.globalContent.get = "حاصل";
codeText.globalContent.win = "جیت";
