import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.bd;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `অটো`;
text.game.stopAuto= `অটো`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "লাইন";
text.game.total = "টোটাল";

text.help.title = "নিয়ম";
text.help.gameRule = "গেমের নিয়ম:";
text.help.SpecialSymbols = "বিশেষ প্রতীক";
text.help.content =
`1. গেমটিতে 7টি নিয়মিত চিহ্ন এবং 30টি পে লাইন রয়েছে;
2. যখন রিলগুলি ঘোরানো বন্ধ করে এবং সক্রিয় বেতন লাইনে প্রথম 3টি চিহ্ন বাম থেকে ডানে ল্যান্ড করে, আপনি একটি মৌলিক পুরস্কার জিততে পারেন;
3. প্রতিটি বেতন লাইন আলাদাভাবে গণনা করা হয়, আপনি যত বেশি বেতন লাইন সক্রিয় করবেন, তত বেশি আকরিক পুরস্কার আপনি জিততে পারবেন;
4. প্রতিটি প্রতীকের বোনাস গুণক আলাদা, পুরস্কার প্রদান = বাজির পরিমাণ x বোনাস গুণক, নীচে বিশদ বিবরণ দেখুন:`
text.help.wildContent = "এটি বোনাস এবং স্ক্যাটার চিহ্ন ব্যতীত অন্য সব প্রতীকের প্রতিস্থাপন করতে পারে।";
text.help.freeContent = "যখন তাদের মধ্যে 3টি বা তার বেশি প্রদর্শিত হয়, আপনি অনেকগুলি ফ্রি স্পিন বার পান।";
text.help.jackpotContent = "যখন তাদের মধ্যে 3 বা তার বেশি প্রদর্শিত হয়, আপনি জ্যাকপট জিতেছেন।";
text.help.freeTime3 = "xরঙ=#00ff00>3<রঙ> = <রঙ=#00ff00>5</রঙ>বার";
text.help.freeTime4 = "x<রঙ=#00ff00>4</রঙ> = <রঙ=#00ff00>8</রঙ>বার";
text.help.freeTime5 = "x<রঙ=#00ff00>5</রঙ> = <রঙ=#00ff00>12</রঙ>বার";

text.setting.title = "সেটিং";
text.setting.sound = "শব্দ";