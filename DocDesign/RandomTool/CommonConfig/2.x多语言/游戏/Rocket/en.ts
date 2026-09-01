import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "ROCKET";
text.game.hisLabel = "his:";
text.game.label = "ALL";
text.game.cashoutNumDes1 = "auto esc";
text.game.cashoutNumDes2 = "auto esc";
text.game.cashoutNumDes3 = "auto esc";
text.game.waitfornextround1 = "wait for next round";
text.game.waitfornextround2 = "wait for next round";
text.game.waitfornextround3 = "wait for next round";
text.game.escape1 = "ESCAPE";
text.game.escape2 = "ESCAPE";
text.game.escape3 = "ESCAPE";
text.game.joinNow = "Join Now!";
text.game.youHeight = "Your escape height:";
text.game.youReward = "Get rewards:";
text.game.PersistentEfforts = "Persistent Efforts!!";


text.help.title = "Instruction";
text.help.content = 
`1. Make your cost before taking off.
2. Take the risk and wait for the odds to get better.
3. Escape before the rocket explodes!
4. Explosion point is @ 1.00x to 10,000x.
5. The lowest escape point is @1.01x.
6. If a player leaves the current game, it will be considered an escape, and the automatic spend will be canceled.
7. Please note: Depending on your network connection, the final escape point may be higher than the height when clicked, which may also result in an unsuccessful escape before the explosion.`

text.help.addContent = `8.In the current game, the overall long-term theoretical Return to Player (RTP) for players is 97.52%.`

text.ready.content1 = "count down"
text.ready.content2 = "PREPARING!"

text.inpuView.content3 = "OK"
text.inpuView.content4 = "max"
text.inpuView.content5 = "min"


text.quitView.content = "The rocket is taking off, do you want to exit without cashout?";
text.quitView.confirm = "Confirm";
text.quitView.cancel = "Cancel";

text.myRecord.content = "SPEND RECORD"
text.myRecord.nodata = "no data";

text.gameHistory.content1 = "Explosion point";
text.gameHistory.content2 = "Explosion point statistics:";
text.gameHistory.content3 = "height";
text.gameHistory.content4 = "last 10 rnds";
text.gameHistory.content5 = "last 20 rnds";
text.gameHistory.content6 = "last 30 rnds";
text.gameHistory.content7 = "last 50 rnds";
text.gameHistory.content8 = "last 100 rnds";

text.disconnectCash.content = `The network is disconnected, and you have automatically escaped.
NOTE: Please keep the NETWORK OPEN to successfully escape!`;
text.disconnectCash.reconnect = "Reconnect";
text.disconnectCash.exit = "Exit";

codeText.betView.alreadybet = "Already Spend!";
codeText.betView.bet = "COST"
codeText.betView.holdtoauto = "hold to auto"
codeText.betView.cancelauto = 'STOP AUTO'
codeText.betView.betnext = "SPEND NEXT"
codeText.betView.automodel = "AUTO SPEND"
codeText.betView.cancel = "CANCEL"
codeText.betView.cancelnext = "Cancel Next"
codeText.betView.escape = "ESCAPE"
codeText.betView.escape2 = "escape"
codeText.betView.escape3 = "Did't escape"
codeText.betView.cancelbet = "Cancel SPEND"
codeText.betView.betnext2 = "SPEND Next+"
codeText.betView.exploded = "exploded"
codeText.betView.maxBetLimit = "Exceed the limit"

codeText.globalContent.flightheight = "Flight height"
codeText.globalContent.vacancy = "vacancy"
codeText.globalContent.rocket = "ROCKET"
codeText.globalContent.inputContent1 = "Limit:100.00-50,000.00"
codeText.globalContent.inputContent2 = "Enter amount:"
codeText.globalContent.inputContent3 = "Escape height:1.01-100.00"
codeText.globalContent.inputContent4 = "Enter an escape point:"
codeText.globalContent.round =  "round: "

