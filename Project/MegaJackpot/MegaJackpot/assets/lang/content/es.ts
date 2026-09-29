import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.es;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `AUTO`;
text.game.stopAuto= `AUTO`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "pauta";
text.game.total = "TOTAL";

text.help.title = "Regla";
text.help.gameRule = "Reglas del juego:";
text.help.SpecialSymbols = "Símbolos especiales";
text.help.content =
`1. Hay 7 símbolos regulares y 30 líneas de pago ofrecidas en el juego;
2. Cuando los carretes dejan de girar y los primeros 3 símbolos de izquierda a derecha aparecen en la línea de pago activada, puedes ganar un premio básico;
3. Cada línea de pago se calcula por separado. Cuantas más líneas de pago actives, más premios podrás ganar;
4. El multiplicador de bonificación de cada símbolo es diferente. Pago del premio = monto de la apuesta x multiplicador de bonificación. Consulte los detalles a continuación:`
text.help.wildContent = "Puede sustituir a todos los demás símbolos excepto a los símbolos de bonificación y dispersión.";
text.help.freeContent = "Al aparecer 3 de ellos o más, obtendrás varios giros gratis.";
text.help.jackpotContent = "Al aparecer 3 de ellos o más, ganas el premio gordo.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>vezes";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>vezes";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>vezes";

text.setting.title = "Configuración";
text.setting.sound = "Sonido";