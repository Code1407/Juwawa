import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.es;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `PAGA`;
text.game.path2 = `AUTO`;
text.game.path4 = `VELOCIDAD`;
text.game.path34 = `Los valores que se muestran en esta página representan los premios que se pueden otorgar en la apuesta total de 20.`;
text.game.path35 = `WILD puede reemplazar cualquier ícono del juego excepto el giro.`;
text.game.path36 = `el giro solo cuenta el número que aparece en la pantalla. No tiene relación con las líneas. Si aparecen 3 o más SPIN en la pantalla, el jugador obtendrá el JACKPOT al azar.`;
text.game.path37 = `Líneas de pago`;
text.game.path38 = `Ajustes`;
text.game.path39 = `Sonido`;
text.game.path58 = `NORMAS`;
text.game.path59 = `En el juego actual, la tasa de retorno teórico del juego a largo plazo (RTP) general de los jugadores es del 97.52%.`;

text.history.History = `HISTORIAL`;
text.history.time = `Tiempo`;
text.history.bet = `Apuesta`;
text.history.type = `Tipo`;
text.history.line = `Línea`;
text.history.count = `Contar`;
text.history.win = `Ganar`;
text.history.round = `Ronda:`;
