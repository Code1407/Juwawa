import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.hi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `ऑटो`;
text.game.stopAuto= `ऑटो`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "लाइन्स";
text.game.total = "कुल";

text.help.title = "नियम";
text.help.gameRule = "खेल के नियम:";
text.help.SpecialSymbols = "विशेष प्रतीक";
text.help.content =
`1. खेल में 7 नियमित प्रतीक और 30 भुगतान लाइनें उपलब्ध हैं;
2. जब रीलें घूमना बंद हो जाती हैं और बाएं से दाएं पहले 3 प्रतीक सक्रिय भुगतान लाइन्स पर आते हैं, तो आप एक मूल पुरस्कार जीत सकते हैं;
3. प्रत्येक भुगतान लाइन की गणना अलग से की जाती है, जितनी अधिक भुगतान लाइनें आप सक्रिय करते हैं, उतने अधिक पुरस्कार आप जीत सकते हैं;
4. प्रत्येक प्रतीक का बोनस गुणक अलग है, पुरस्कार भुगतान = दांव राशि x बोनस गुणक, नीचे विवरण देखें:`
text.help.wildContent = "यह बोनस और स्कैटर प्रतीकों को छोड़कर अन्य सभी प्रतीकों का स्थानापन्न हो सकता है।";
text.help.freeContent = "जब उनमें से 3 या अधिक दिखाई देते हैं, तो आपको कई मुफ्त स्पिन समय मिलते हैं।";
text.help.jackpotContent = "जब उनमें से 3 या अधिक दिखाई देते हैं, तो आप जैकपॉट जीतते हैं।";
text.help.freeTime3 = "x<रंग=#00ff00>3</रंग> = <रंग=#00ff00>5</रंग>टाइम्स";
text.help.freeTime4 = "x<रंग=#00ff00>4</रंग> = <रंग=#00ff00>8</रंग>टाइम्स";
text.help.freeTime5 = "x<रंग=#00ff00>5</रंग> = <रंग=#00ff00>12</रंग>टाइम्स";

text.setting.title = "सेटिंग";
text.setting.sound = "आवाज़";