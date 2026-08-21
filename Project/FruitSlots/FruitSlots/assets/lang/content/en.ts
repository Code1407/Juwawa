import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `AUTO`;
text.game.stopAuto= `AUTO`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "lines";
text.game.total = "TOTAL";

text.help.title = "Rule";
text.help.gameRule = "Game Rules:";
text.help.SpecialSymbols = "Special symbols";
text.help.content = 
`1. There are 7 regular symbols and 30 pay lines offered in the game;
2. When the reels stop spinning and the first 3 symbols from left to right land on the activated pay line, you can win a basic prize;
3. Each pay line is calculated separately, The more pay lines you activate, the ore prizes you may win;
4. The bonus multiplier of each symbol is different, Prize payout = bet amount x bonus multiplier, See details below:`
text.help.wildContent = "It can substitute for all other symbols except for the bonus and scatter symbols.";
text.help.freeContent = "When appearing 3 of them or more, you get several free spin times.";
text.help.jackpotContent = "When appearing 3 of them or more, you win the jackpot.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>times";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>times";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>times";

text.setting.title = "Setting";
text.setting.sound = "Sound";