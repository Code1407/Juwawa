import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.es;

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
text.game.todayRound = "Ronda:";

text.ready.content = "Tiempo de preparación";
text.gameHistory.title = "Historial del juego";
text.myHistory.title = "Mi historial";
text.myHistory.date = "Fecha";
text.myHistory.betDetail = "Detalle de apuesta";
text.myHistory.result = "Resultado";
text.myHistory.revenue = "Ingresos";
text.rewarding.content = "Se están repartiendo premios, ¡por favor espera!";

codeText.globalContent.round = "Ronda: "
codeText.globalContent.betMaxLimit = "¡Solo puedes apostar un máximo de {0} por ronda!";
text.help.title = "Reglas del juego";
text.help.content =
`
Las opciones de apuesta predeterminadas y los multiplicadores de bonificación de frutas son:
x3 Manzana grande
x6 Plátano grande
x8 Limón grande
x12 Sandía grande
x30 BAR

Si caes en una fruta que muestra "x2", el multiplicador se duplicará.

Bonificaciones especiales:
1. Suerte Arcoíris (dos modos)
- Se recibe cada bonificación del semicírculo superior una vez.
- Tiempo de Manzana: el juego continúa hasta que salga una manzana.

2. Suerte Amarilla (dos modos)
- Se recibe cada bonificación del semicírculo inferior una vez.
- Se recibe cada fruta una vez.

Nota: Ambos modos de Suerte pueden entrar en "Tiempo de Mala Suerte", en cuyo caso no se otorgará ninguna bonificación.
`
