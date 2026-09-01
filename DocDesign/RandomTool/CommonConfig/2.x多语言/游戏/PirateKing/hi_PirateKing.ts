import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.hi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `भुगतान करना`;
text.game.path2 = `ऑटो`;
text.game.path4 = `रफ़्तार`;
text.game.path34 = `इस पृष्ठ पर प्रदर्शित मूल्य उन पुरस्कारों को दर्शाते हैं जो कुल बेट 20 पर प्रदान किए जा सकते हैं।`;
text.game.path35 = `WILD स्पिन को छोड़कर खेल में किसी भी आइकन को प्रतिस्थापित कर सकता है।`;
text.game.path36 = `स्पिन केवल स्क्रीन पर संख्या की गणना करता है। इसका लाइनों के साथ कोई संबंध नहीं है। यदि स्क्रीन पर 3 या अधिक SPIN दिखाई देते हैं तो खिलाड़ी को यादृच्छिक रूप से जैकपॉट मिलेगा।`;
text.game.path37 = `पेलाइन`;
text.game.path38 = `सेटिंग्स`;
text.game.path39 = `आवाज़`;
text.game.path58 = `नियम`;
text.game.path59 = `वर्तमान खेल में, खिलाड़ियों के लिए समग्र दीर्घकालिक सैद्धांतिक रिटर्न टू प्लेयर (RTP) 97.52% है।`;

text.history.History = `इतिहास`;
text.history.time = `समय`;
text.history.bet = `शर्त`;
text.history.type = `प्रकार`;
text.history.line = `रेखा`;
text.history.count = `गणना`;
text.history.win = `जीतना`;
text.history.round = `राउंड:`;
