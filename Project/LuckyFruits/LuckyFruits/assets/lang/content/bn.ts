import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.bn;

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
text.game.todayRound = "রাউন্ড:";

text.ready.content = "প্রস্তুতির সময়";
text.gameHistory.title = "গেম ইতিহাস";
text.myHistory.title = "আমার ইতিহাস";
text.myHistory.date = "তারিখ";
text.myHistory.betDetail = "বাজির বিবরণ";
text.myHistory.result = "ফলাফল";
text.myHistory.revenue = "আয়";
text.rewarding.content = "পুরস্কার দেওয়া হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন!";

codeText.globalContent.round = "রাউন্ড: "
codeText.globalContent.betMaxLimit = "আপনি প্রতি রাউন্ডে সর্বোচ্চ {0} পর্যন্ত বাজি ধরতে পারবেন!";
text.help.title = "খেলার নিয়ম";
text.help.content =
`
ডিফল্ট বাজির অপশন এবং ফলের বোনাস গুণক হলো:
x3 বড় আপেল
x6 বড় কলা
x8 বড় লেবু
x12 বড় তরমুজ
x30 BAR

"x2" প্রদর্শিত ফলে থামলে গুণক দ্বিগুণ হবে।

বিশেষ পুরস্কার:
1. রেইনবো লাক (দুটি মোড)
- উপরের অর্ধবৃত্তের প্রতিটি বোনাস একবার করে পাওয়া যায়।
- অ্যাপেল টাইম: আপেল না পাওয়া পর্যন্ত খেলা চলতে থাকে।

2. ইয়েলো লাক (দুটি মোড)
- নিচের অর্ধবৃত্তের প্রতিটি বোনাস একবার করে পাওয়া যায়।
- সব ফল একবার করে পাওয়া যায়।

দ্রষ্টব্য: উভয় লাক মোড "আনলাকি টাইম"-এ প্রবেশ করতে পারে, যে সময়ে কোনো বোনাস দেওয়া হয় না।
`
