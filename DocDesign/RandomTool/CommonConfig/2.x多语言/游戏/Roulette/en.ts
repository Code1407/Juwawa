import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;

text.game.again = "AGAIN";
text.game.new = "New >"
text.game.gameStart = "Game Start";
text.game.starting = "Starting";
text.game.round = "Round:";
text.game.gainedCoins = "Gained Coins:";
text.gameRecord.title1 = "Game History";
text.gameRecord.title2 = "My History";
text.gameRecord.nodata = "no data";
text.gameRecord.rule = "Displayed for 7 days only, with a maximum of 100 records per day";
text.gameRecord.new = "NEW";

text.help.title = "Game Rule";
text.help.content = 
`Roulette is a fun and exciting game.

1. Numbers: 0 (36 times reward), 1-12 (3 times reward), 13-24 (3 times reward), 25-36 (3 times reward);

2. Color: red (2x reward), black (2x reward);

3. Odd and even: odd (2x reward), even but not including 0 (2x reward).

Happy gaming!`
text.help.reward = "Is rewarding ,please wait!";
text.help.wait="Please wait for the next round";

codeText.globalContent.Time = "Time"
codeText.globalContent.bet = "cost";
codeText.globalContent.get = "get";
codeText.globalContent.win = "win";
