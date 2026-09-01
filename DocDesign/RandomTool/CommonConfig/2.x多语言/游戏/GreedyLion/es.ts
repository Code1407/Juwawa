import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.es;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=
`Reproducción auto`;
text.game.stopAuto =
`Parar auto`;
text.game.result = "resultado";
text.game.mine = "Mi Historia";
text.game.todayWin =
`Ingresos de hoy:`;
text.game.todayRank =
`Clasificación de hoy`;
text.game.round = "ronda:";
text.game.salad = "ensalada";
text.game.pizza = "pizza";
text.game.selectTime = "Seleccionar hora";

text.help.title = "Regla";
text.help.content =
`
1. Elige el importe de tu coste y selecciona el alimento.

2. Los resultados se anunciarán al finalizar el periodo de coste.

3. Si el resultado anunciado coincide con el alimento seleccionado, recibirás recompensas según su coste.

4. El premio oficial aumentará a medida que más usuarios participen en el juego. Habrá la posibilidad de ganar "PIZZA" o "ENSALADA" cuando el premio alcance una cantidad determinada.

5. Si se anunció "ENSALADA", se premiarán todas las verduras.

6. Si se anunció "PIZZA", se premiarán todas las carnes.
`

text.rank.title = "Ranking de ingresos de hoy";
text.rank.column_Ranking = "Clasificación";
text.rank.column_Profile = "Perfil";
text.rank.column_Name = "Nombre";
text.rank.column_Revenue = "Ganancia";

text.myHistory.title = "Mi historia";
text.myHistory.column_Time = "Tiempo de juego";
text.myHistory.column_Details = "Detalles del juego";
text.myHistory.column_Result = "Resultado";
//text.myHistory.column_Revenue = "Ganancia";
text.myHistory.round = "Ronda:"

text.exceed.content = "Lo sentimos, no puedes apostar en más de 6 opciones por ronda de juego.";
text.exceed.confirm = "Confirmar";

text.setting.title = "Configuración";
text.setting.sound = "Sonido";
text.setting.on = "Encender";
text.setting.off = "Apagar";

text.roundFinal.thisRoundBets = " Apuestas de esta ronda: ";
text.roundFinal.thisRoundRanking = "Clasificación de esta ronda: ";
text.roundFinal.thisRoundEarnings = "Ganancias de esta ronda: ";
text.roundFinal.roundNumber = function roundResult(x: number): string {
return `Resultado de la ronda ${x}:`;
};