import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.bn;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `প্রদান`;
text.game.path2 = `অটো`;
text.game.path4 = `স্পীড`;
text.game.path34 = `এই পৃষ্ঠায় প্রদর্শিত মানগুলি পুরষ্কারের প্রতিনিধিত্ব করে যা মোট বাজি 20 এ দেওয়া যেতে পারে।`;
text.game.path35 = `WILD স্পিন ছাড়া গেমের যেকোনো আইকন প্রতিস্থাপন করতে পারে।`;
text.game.path36 = `স্পিন শুধুমাত্র স্ক্রীনের সংখ্যা গণনা করে। এর লাইনগুলির সাথে কোনো সম্পর্ক নেই। স্ক্রীনে 3 বা তার বেশি SPIN দেখা গেলে খেলোয়াড় এলোমেলোভাবে JACKPOT পাবে।`;
text.game.path37 = `পেলাইন`;
text.game.path38 = `সেটিংস`;
text.game.path39 = `শব্দ`;
text.game.path58 = `নিয়ম`;
text.game.path59 = `বর্তমান গেমে, খেলোয়াড়দের জন্য সামগ্রিক দীর্ঘমেয়াদী তাত্ত্বিক রিটার্ন টু প্লেয়ার (RTP) 97.52%।`;

text.history.History = `ইতিহাস`;
text.history.time = `সময়`;
text.history.bet = `বাজি`;
text.history.type = `টাইপ`;
text.history.line = `লাইন`;
text.history.count = `গণনা`;
text.history.win = `জয়`;
text.history.round = `রাউন্ড:`;
