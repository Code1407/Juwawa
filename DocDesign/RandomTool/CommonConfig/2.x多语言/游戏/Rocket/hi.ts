import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.hi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "राकेट";		
text.game.hisLabel = "उसका:";		
text.game.label = "सभी";		
text.game.cashoutNumDes1 = "ऑटो ईएससी";		
text.game.cashoutNumDes2 = "ऑटो ईएससी";		
text.game.cashoutNumDes3 = "ऑटो ईएससी";		
text.game.waitfornextround1 = "अगले राउंड की प्रतीक्षा करें";		
text.game.waitfornextround2 = "अगले राउंड की प्रतीक्षा करें";		
text.game.waitfornextround3 = "अगले राउंड की प्रतीक्षा करें";		
text.game.escape1 = "भागना";		
text.game.escape2 = "भागना";		
text.game.escape3 = "भागना";		
text.game.joinNow = "अब शामिल हों!";		
text.game.youHeight = "आपकी भागने की ऊंचाई:";		
text.game.youReward = "पुरस्कार पाना:";		
text.game.PersistentEfforts = "निरंतर प्रयास!!";		
		
		
text.help.title = "अनुदेश";		
text.help.content =		
`1. उड़ान भरने से पहले अपना बेट लगा लें।		
2. जोखिम उठाएं और मौके के बेहतर होने का इंतजार करें।		
3. रॉकेट फटने से पहले भाग जाओ!		
4. विस्फोट बिंदु @ 1.00x से 10,000x तक है।		
5. सबसे कम पलायन बिंदु @1.01x है।		
6. यदि कोई खिलाड़ी वर्तमान खेल छोड़ देता है, तो इसे पलायन माना जाएगा, और स्वचालित दांव रद्द हो जाएगा।		
7. कृपया ध्यान दें: आपके नेटवर्क कनेक्शन के आधार पर, अंतिम पलायन बिंदु क्लिक करने पर ऊंचाई से अधिक हो सकता है, जिसके परिणामस्वरूप विस्फोट से पहले असफल पलायन भी हो सकता है।		`

text.help.addContent = `8.वर्तमान खेल में，खिलाड़ियों की कुल दीर्घकालिक खेल सिद्धांत वापसी दर (RTP) 97.52% है।`
		
text.ready.content1 = "उलटी गिनती"		
text.ready.content2 = "तैयारी!"		
		
text.inpuView.content3 = "ठीक है"		
text.inpuView.content4 = "अधिकतम"		
text.inpuView.content5 = "मिन"		
		
		
text.quitView.content = "रॉकेट उड़ान भर रहा है, क्या आप बिना कैशआउट के बाहर निकलना चाहते हैं?";		
text.quitView.confirm = "पुष्टि करना";		
text.quitView.cancel = "रद्द करना";		
		
text.myRecord.content = "सट्टेबाजी का रिकॉर्ड"		
text.myRecord.nodata = "कोई डेटा नहीं";		
		
text.gameHistory.content1 = "विस्फोट बिंदु";		
text.gameHistory.content2 = "विस्फोट बिंदु आँकड़े:";		
text.gameHistory.content3 = "ऊंचाई";		
text.gameHistory.content4 = "पिछले 10 राउंड";		
text.gameHistory.content5 = "पिछले 20 राउंड";		
text.gameHistory.content6 = "पिछले 30 राउंड";		
text.gameHistory.content7 = "पिछले 50 राउंड";		
text.gameHistory.content8 = "पिछले 100 राउंड";		

text.disconnectCash.content = `नेटवर्क डिस्कनेक्ट हो गया है, और आप स्वचालित रूप से बच निकले हैं।
नोट: सफलतापूर्वक बचने के लिए कृपया नेटवर्क खुला रखें!`;
text.disconnectCash.reconnect = "पुनः कनेक्ट करें";
text.disconnectCash.exit = "बाहर निकलें";
		
codeText.betView.alreadybet = "पहले से ही बेट!";		
codeText.betView.bet = "बेट"		
codeText.betView.holdtoauto = "ऑटो पर पकड़ो"		
codeText.betView.cancelauto = 'ऑटो रोकें'		
codeText.betView.betnext = "अगला बेट"		
codeText.betView.automodel = "ऑटो बेट"		
codeText.betView.cancel = "रद्द करना"		
codeText.betView.cancelnext = "रद्द करें अगला"		
codeText.betView.escape = "भागना"		
codeText.betView.escape2 = "भागना"	
codeText.betView.escape3 = "भागे नहीं"	
codeText.betView.cancelbet = "बेट रद्द करें"		
codeText.betView.betnext2 = "अगला बेट+"		
codeText.betView.exploded = "विस्फोट"		
codeText.betView.maxBetLimit = "सीमा पार करना"		
		
codeText.globalContent.flightheight = "उड़ान की ऊंचाई"		
codeText.globalContent.vacancy = "रिक्ति"		
codeText.globalContent.rocket = "राकेट"		
codeText.globalContent.inputContent1 = "सीमा:100.00-50,000.00"		
codeText.globalContent.inputContent2 = "राशि डालें:"		
codeText.globalContent.inputContent3 = "पलायन ऊंचाई:1.01-100.00"		
codeText.globalContent.inputContent4 = "एक पलायन बिंदु दर्ज करें:"		
codeText.globalContent.round =  "राउंड: "

