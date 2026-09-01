import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.bn;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "আবার";
text.game.new = "নতুন >"
text.game.gameStart = "গেম শুরু";
text.game.starting = "শুরু হচ্ছে";
text.game.round = "রাউন্ড:";
text.game.gainedCoins = "প্রাপ্ত কয়েন:";
text.gameRecord.title1 = "গেমের ইতিহাস";
text.gameRecord.title2 = "আমার ইতিহাস";
text.gameRecord.nodata = "কোনো তথ্য নেই";
text.gameRecord.rule = "শুধুমাত্র 7 দিনের জন্য প্রদর্শিত হয়, প্রতিদিন সর্বোচ্চ 100টি রেকর্ড";
text.gameRecord.new = "নতুন";

text.help.title = "গেমের নিয়ম";
text.help.content =
`রুলেট একটি মজার এবং রোমাঞ্চকর খেলা।

1. সংখ্যা: 0 (36 গুণ পুরস্কার), 1-12 (3 গুণ পুরস্কার), 13-24 (3 গুণ পুরস্কার), 25-36 (3 গুণ পুরস্কার);

2. রঙ: লাল (2x পুরস্কার), কালো (2x পুরস্কার);

3. বিজোড় ও জোড়: বিজোড় (2x পুরস্কার), জোড় কিন্তু 0 বাদে (2x পুরস্কার)।

শুভ খেলা!`
text.help.reward = "পুরস্কার দেওয়া হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন!";
text.help.wait = "অনুগ্রহ করে পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন";

codeText.globalContent.Time = "সময়"
codeText.globalContent.bet = "বাজি";
codeText.globalContent.get = "পাওয়া";
codeText.globalContent.win = "জয়";
