import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.bn;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=			
'অটো প্লে';			
text.game.stopAuto =			
'স্টপ অটো';			
text.game.result = "ফলাফল";			
text.game.mine = "আমার ইতিহাস";			
text.game.todayWin =			
`আজকের রাজস্ব:`;			
text.game.todayRank =			
'আজকের র‌্যাঙ্ক';			
text.game.round = "রাউন্ড:";			
text.game.salad = "সালাদ";			
text.game.pizza = "পিজ্জা";			
text.game.selectTime = "সময় নির্বাচন করুন";			
			
text.help.title = "নিয়ম";			
text.help.content =			
`			
1.আপনার খরচের পরিমাণ নির্বাচন করুন এবং খরচের জন্য খাবার নির্বাচন করুন;
2.খরচের সময়কাল শেষ হওয়ার পরে ফলাফল ঘোষণা করা হবে;
3.যদি ঘোষিত ফলাফল আপনার নির্বাচিত খাবারের সাথে মিলে যায়, তাহলে আপনাকে সংশ্লিষ্ট খরচের তুলনায় পুরষ্কার দেওয়া হবে;
4.গেমটিতে আরও বেশি ব্যবহারকারী অংশগ্রহণ করার সাথে সাথে অফিসিয়াল পুরষ্কার পুল বৃদ্ধি পাবে, পুরষ্কার পুল একটি নির্দিষ্ট পরিমাণে পৌঁছানোর সাথে সাথে "পিজা" বা "সালাদ" পুরষ্কারের সুযোগ থাকবে;
5.যদি "সালাদ" ঘোষণা করা হয়, তাহলে সমস্ত সবজি পুরষ্কার দেওয়া হবে;
6.যদি "পিজা" ঘোষণা করা হয়, তাহলে সমস্ত মাংস পুরষ্কার দেওয়া হবে।		
`			
			
text.rank.title = "আজকের রাজস্ব র‍্যাঙ্ক";			
text.rank.column_Ranking = "র‍্যাঙ্কিং";			
text.rank.column_Profile = "প্রোফাইল";			
text.rank.column_Name = "নাম";			
text.rank.column_Revenue = "রাজস্ব";			
			
text.myHistory.title = "আমার ইতিহাস";			
text.myHistory.column_Time = "খেলার সময়";			
text.myHistory.column_Details = "প্লে বিশদ বিবরণ";			
text.myHistory.column_Result = "ফলাফল";			
//text.myHistory.column_Revenue = "রাজস্ব";			
text.myHistory.round = "রাউন্ড:"			
			
text.exceed.content = "দুঃখিত, আপনি প্রতিটি গেম রাউন্ডে 6টির বেশি বিকল্পের জন্য বাজি ধরতে পারবেন না।";			
text.exceed.confirm = "নিশ্চিত করুন";			

text.setting.title = "সেটিং";			
text.setting.sound = "শব্দ";			
text.setting.on = "চালু";			
text.setting.off = "বন্ধ";			
			
text.roundFinal.thisRoundBets = "এই রাউন্ড বেটস: ";			
text.roundFinal.thisRoundRanking = "এই রাউন্ড র‍্যাঙ্কিং: ";			
text.roundFinal.thisRoundEarnings = "এই রাউন্ড আয়: ";			
text.roundFinal.roundNumber = function roundResult(x: number): string {			
    return `রাউন্ড ${x} এর ফলাফল:`;			
    };			