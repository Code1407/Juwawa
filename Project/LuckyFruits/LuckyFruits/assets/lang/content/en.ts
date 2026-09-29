import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.en;

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
text.game.todayRound = "Round:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "My History";
text.myHistory.date = "Date";
text.myHistory.betDetail = "Cost Detail";
text.myHistory.result = "Result";
text.myHistory.revenue = "Revenue";
text.rewarding.content = "Is rewarding, please wait!";
codeText.globalContent.round = "Round: "
codeText.globalContent.betMaxLimit = "You can only cost {0} each round";
text.help.title = "Game Rules";
text.help.content =
`
The default betting options and fruit bonus multipliers are:
x3 Extra Large Apple
x6 Extra Large Banana
x8 Extra Large Lemon
x12 Extra Large Watermelon
x30 BAR

If you land on a fruit displaying "x2", the multiplier will be doubled.

Special Bonuses:
1. Rainbow Luck (Two Modes)
- Receive one of each bonus in the upper semicircle.
- Apple Time: Bonuses will continue to spin until an apple is revealed.

2. Yellow Luck (Two Modes)
- Receive one of each bonus in the lower semicircle.
- Receive one of each fruit.

Note: Both Luck modes may enter "Unlucky Time," in which case no bonus will be awarded.
`
