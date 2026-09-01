import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.hi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "फिर से";
text.game.new = "नया >"
text.game.gameStart = "गेम शुरू करें";
text.game.starting = "शुरू हो रहा है";
text.game.round = "राउंड:";
text.game.gainedCoins = "प्राप्त सिक्के:";
text.gameRecord.title1 = "गेम इतिहास";
text.gameRecord.title2 = "मेरा इतिहास";
text.gameRecord.nodata = "कोई डेटा नहीं";
text.gameRecord.rule = "केवल 7 दिनों के लिए दिखाया जाता है, प्रति दिन अधिकतम 100 रिकॉर्ड";
text.gameRecord.new = "नया";

text.help.title = "गेम के नियम";
text.help.content =
`रूलेट एक मज़ेदार और रोमांचक खेल है।

1. संख्याएँ: 0 (36 गुना पुरस्कार), 1-12 (3 गुना पुरस्कार), 13-24 (3 गुना पुरस्कार), 25-36 (3 गुना पुरस्कार);

2. रंग: लाल (2x पुरस्कार), काला (2x पुरस्कार);

3. विषम और सम: विषम (2x पुरस्कार), सम लेकिन 0 को छोड़कर (2x पुरस्कार)।

खेल का आनंद लें!`
text.help.reward = "पुरस्कार दिया जा रहा है, कृपया प्रतीक्षा करें!";
text.help.wait = "कृपया अगले राउंड की प्रतीक्षा करें";

codeText.globalContent.Time = "समय"
codeText.globalContent.bet = "शर्त";
codeText.globalContent.get = "प्राप्त";
codeText.globalContent.win = "जीत";
