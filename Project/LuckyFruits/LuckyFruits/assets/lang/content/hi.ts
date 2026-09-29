import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.hi;

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
text.game.todayRound = "राउंड:";

text.ready.content = "तैयारी का समय";
text.gameHistory.title = "गेम इतिहास";
text.myHistory.title = "मेरा इतिहास";
text.myHistory.date = "तारीख";
text.myHistory.betDetail = "दांव का विवरण";
text.myHistory.result = "परिणाम";
text.myHistory.revenue = "आय";
text.rewarding.content = "पुरस्कार दिया जा रहा है, कृपया प्रतीक्षा करें!";

codeText.globalContent.round = "राउंड: "
codeText.globalContent.betMaxLimit = "आप प्रति राउंड अधिकतम {0} तक ही शर्त लगा सकते हैं!";
text.help.title = "खेल के नियम";
text.help.content =
`
डिफ़ॉल्ट शर्त विकल्प और फल बोनस गुणक इस प्रकार हैं:
x3 बड़ा सेब
x6 बड़ा केला
x8 बड़ा नींबू
x12 बड़ा तरबूज
x30 BAR

यदि आप "x2" दिखाने वाले फल पर रुकते हैं, तो गुणक दोगुना हो जाएगा।

विशेष इनाम:
1. रेनबो लक (दो मोड)
- ऊपरी अर्धवृत्त का प्रत्येक इनाम एक बार मिलता है।
- एप्पल टाइम: सेब जीतने तक खेल जारी रहता है।

2. येलो लक (दो मोड)
- निचले अर्धवृत्त का प्रत्येक इनाम एक बार मिलता है।
- सभी फल एक-एक बार जीतते हैं।

नोट: दोनों लक मोड में "बैड लक टाइम" आ सकता है, जिसमें कोई इनाम नहीं मिलता।
`
