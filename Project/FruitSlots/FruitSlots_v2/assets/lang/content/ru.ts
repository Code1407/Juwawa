import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ru;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `АВТО`;
text.game.stopAuto= `АВТО`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "линии";
text.game.total = "ОБЩИЙ";

text.help.title = "Правило";
text.help.gameRule = "Правила игры:";
text.help.SpecialSymbols = "Специальные символы";
text.help.content = 
`1. В игре предлагается 7 обычных символов и 30 выигрышных линий;
2. Когда барабаны перестанут вращаться и первые 3 символа слева направо выпадут на активированную линию выплат, вы сможете выиграть основной приз;
3. Каждая линия выплат рассчитывается отдельно. Чем больше линий выплат вы активируете, тем больше призов вы можете выиграть;
4. Бонусный множитель каждого символа различен. Выплата приза = сумма ставки x бонусный множитель. Подробности см. ниже:`
text.help.wildContent = "Он может заменять все другие символы, кроме бонусных символов и символов разброса.";
text.help.freeContent = "При появлении 3 и более из них вы получаете несколько бесплатных вращений.";
text.help.jackpotContent = "При появлении 3 и более из них вы выигрываете джекпот.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>раз";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>раз";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>раз";

text.setting.title = "Параметр";
text.setting.sound = "Звук";