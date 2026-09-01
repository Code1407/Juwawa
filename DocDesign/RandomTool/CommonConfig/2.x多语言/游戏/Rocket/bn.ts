import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.bn;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "রকেট";		
text.game.hisLabel = "তার:";		
text.game.label = "সমস্ত";		
text.game.cashoutNumDes1 = "অটো ইএসসি";		
text.game.cashoutNumDes2 = "অটো ইএসসি";		
text.game.cashoutNumDes3 = "অটো ইএসসি";		
text.game.waitfornextround1 = "পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন";		
text.game.waitfornextround2 = "পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন";		
text.game.waitfornextround3 = "পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন";		
text.game.escape1 = "এসকেপ";		
text.game.escape2 = "এসকেপ";		
text.game.escape3 = "এসকেপ";		
text.game.joinNow = "এখন যোগ দিন!";		
text.game.youHeight = "আপনার পালানোর উচ্চতা:";		
text.game.youReward = "পুরস্কার পান:";		
text.game.PersistentEfforts = "নিরন্তর প্রচেষ্টা!!";		
		
		
text.help.title = "নির্দেশ";		
text.help.content =		
`1. টেক অফ করার আগে আপনার বাজি ধরুন।		
2. ঝুঁকি নিন এবং প্রতিকূলতা ভালো হওয়ার জন্য অপেক্ষা করুন।		
3. রকেট বিস্ফোরণের আগে পালিয়ে যান!		
4. বিস্ফোরণ পয়েন্ট @ 1.00x থেকে 10,000x।		
5. সর্বনিম্ন এস্কেপ পয়েন্ট হল @1.01x।		
6. যদি একজন খেলোয়াড় বর্তমান খেলা ছেড়ে দেয়, তাহলে এটি একটি পালানো বলে বিবেচিত হবে, এবং স্বয়ংক্রিয় বাজি বাতিল করা হবে।		
7. অনুগ্রহ করে মনে রাখবেন: আপনার নেটওয়ার্ক সংযোগের উপর নির্ভর করে, ক্লিক করার সময় চূড়ান্ত এস্কেপ পয়েন্ট উচ্চতার চেয়ে বেশি হতে পারে, যার ফলে বিস্ফোরণের আগে একটি অসফল পালানোও হতে পারে।		`

text.help.addContent = `8.বর্তমান গেমে，খেলোয়াড़দের সামগ্রিক দীর্ঘকালীন গেম তত্ত্বের রিটার্ন রেট (RTP) 97.52%।`
		
text.ready.content1 = "কাউন্টডাউন"		
text.ready.content2 = "প্রস্তুতি হচ্ছে!"		
		
text.inpuView.content3 = "ওকে"		
text.inpuView.content4 = "সর্বোচ্চ"		
text.inpuView.content5 = "ন্যূনতম"		
		
		
text.quitView.content = "রকেটটি উড়ছে, আপনি কি ক্যাশ আউট ছাড়াই প্রস্থান করতে চান?";		
text.quitView.confirm = "নিশ্চিত করুন";		
text.quitView.cancel = "বাতিল করুন";		
		
text.myRecord.content = "বেটিং রেকর্ড"		
text.myRecord.nodata = "কোন তথ্য নেই";		
		
text.gameHistory.content1 = "বিস্ফোরণ পয়েন্ট";		
text.gameHistory.content2 = "বিস্ফোরণ পয়েন্ট পরিসংখ্যান:";		
text.gameHistory.content3 = "উচ্চতা";		
text.gameHistory.content4 = "শেষ দশটি";		
text.gameHistory.content5 = "শেষ 20টি";		
text.gameHistory.content6 = "শেষ 30টি";		
text.gameHistory.content7 = "শেষ ৫০টি";		
text.gameHistory.content8 = "শেষ 100টি";		

text.disconnectCash.content = `নেটওয়ার্ক বিচ্ছিন্ন হয়েছে এবং আপনি স্বয়ংক্রিয়ভাবে পালিয়ে গেছেন।
বিঃদ্রঃ সফলভাবে পালাতে নেটওয়ার্ক খোলা রাখুন!`;
text.disconnectCash.reconnect = "পুনঃসংযোগ";
text.disconnectCash.exit = "প্রস্থান";
		
codeText.betView.alreadybet = "ইতিমধ্যেই বাজি!";		
codeText.betView.bet = "বাজি"		
codeText.betView.holdtoauto = "স্বয়ংক্রিয়ভাবে ধরে রাখুন"		
codeText.betView.cancelauto = 'অটো বন্ধ করুন'		
codeText.betView.betnext = "পরবর্তী বাজি"		
codeText.betView.automodel = "অটো বাজি"		
codeText.betView.cancel = "বাতিল করুন"		
codeText.betView.cancelnext = "পরবর্তী বাতিল করুন"	
codeText.betView.escape = "পালানো"		
codeText.betView.escape2 = "পালানো"		
codeText.betView.escape3 = "পালিয়ে যায়নি"		
codeText.betView.cancelbet = "বাজি বাতিল করুন"		
codeText.betView.betnext2 = "পরবর্তী বাজি+"		
codeText.betView.exploded = "বিস্ফোরিত"		
codeText.betView.maxBetLimit = "সীমা অতিক্রম করুন"		
		
codeText.globalContent.flightheight = "ফ্লাইটের উচ্চতা"		
codeText.globalContent.vacancy = "শূন্যপদ"		
codeText.globalContent.rocket = "রকেট"		
codeText.globalContent.inputContent1 = "সীমা:100.00-50,000.00"		
codeText.globalContent.inputContent2 = "পরিমাণ লিখুন:"		
codeText.globalContent.inputContent3 = "এস্কেপ উচ্চতা: 1.01-100.00"		
codeText.globalContent.inputContent4 = "একটি এস্কেপ পয়েন্ট লিখুন:"		
codeText.globalContent.round =  "রাউন্ড: "		

