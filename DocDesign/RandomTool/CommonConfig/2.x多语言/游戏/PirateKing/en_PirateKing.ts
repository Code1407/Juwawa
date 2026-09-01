import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `PAYS`;
text.game.path2 = `AUTO`;
text.game.path4 = `SPEED`;
text.game.path34 = `Values displayed on this page represent the awards that may be awarded at the total bet 20.`;
text.game.path35 = `WILD can replace any icon in the game except spin.`;
text.game.path36 = `spin only count the number on the screen.It has no relationship with the lines. If there appear 3 or more SPIN on the screen player will randomly get JACKPOT.`;
text.game.path37 = `Payline`;
text.game.path38 = `Settings`;
text.game.path39 = `Sound`;
text.game.path58 = `RULES`;
text.game.path59 = `In the current game, the overall long-term theoretical Return to Player (RTP) for players is 97.52%.`;

text.history.History = `HISTORY`;
text.history.time = `Time`;
text.history.bet = `Bet`;
text.history.type = `Type`;
text.history.line = `Line`;
text.history.count = `Count`;
text.history.win = `Win`;
text.history.round = `Round:`;