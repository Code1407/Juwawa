import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.hi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=		
`ऑटो प्ले`;		
text.game.stopAuto =		
`ऑटो रोकें`;		
text.game.result = "परिणाम";		
text.game.mine = "मेरा इतिहास";		
text.game.todayWin =		
`आज का आय:`;		
text.game.todayRank =		
`आज रैंक`;		
text.game.round = "राउंड:";		
text.game.salad = "सलाद";		
text.game.pizza = "पिज़्ज़ा";		
text.game.selectTime = "चुनें समय";		
		
text.help.title = "नियम";		
text.help.content =		
`		
1. अपनी कॉस्ट अमाउंट चुनें और कॉस्ट के हिसाब से खाना चुनें;

2. कॉस्ट पीरियड खत्म होने के बाद रिज़ल्ट अनाउंस किए जाएंगे;

3. अगर अनाउंस किया गया रिज़ल्ट आपके चुने हुए खाने से मैच करता है, तो आपको उसकी कॉस्ट के हिसाब से रिवॉर्ड मिलेंगे;

4. जैसे-जैसे ज़्यादा यूज़र गेम में हिस्सा लेंगे, ऑफिशियल प्राइज़ पूल बढ़ेगा, प्राइज़ पूल के एक तय अमाउंट तक पहुंचने पर "PIZZA" या "SALAD" रिवॉर्ड का मौका मिलेगा;

5. अगर "SALAD" अनाउंस किया गया था, तो सभी सब्ज़ियों को रिवॉर्ड दिया जाएगा;

6. अगर "PIZZA" अनाउंस किया गया था, तो सभी मीट को रिवॉर्ड दिया जाएगा।		
`		
		
text.rank.title = "आज का आय रैंक";		
text.rank.column_Ranking = "रैंकिंग";		
text.rank.column_Profile = "प्रोफ़ाइल";		
text.rank.column_Name = "नाम";		
text.rank.column_Revenue = "आय";		
		
text.myHistory.title = "मेरा इतिहास";		
text.myHistory.column_Time = "खेलने का समय";		
text.myHistory.column_Details = "खेल विवरण";		
text.myHistory.column_Result = "परिणाम";		
//text.myHistory.column_Revenue = "आय";		
text.myHistory.round = "राउंड:"		
		
text.exceed.content = "क्षमा करें, आप प्रत्येक गेम राउंड में 6 से अधिक विकल्पों पर बेट नहीं लगा सकते।";		
text.exceed.confirm = "पुष्टि करें";		

text.setting.title = "सेटिंग";		
text.setting.sound = "आवाज़";		
text.setting.on = "पर";		
text.setting.off = "बंद";		
		
text.roundFinal.thisRoundBets = " इस राउंड की बेट्स: ";		
text.roundFinal.thisRoundRanking = "इस राउंड की रैंकिंग: ";		
text.roundFinal.thisRoundEarnings = "इस राउंड की कमाई: ";		
text.roundFinal.roundNumber = function roundResult(x: number): string {		
return `राउंड ${x} का परिणाम:`;		
};		