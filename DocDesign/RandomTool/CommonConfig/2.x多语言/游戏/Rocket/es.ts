import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.es;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "COHETE";
text.game.hisLabel = "su:";
text.game.label = "TODO";
text.game.cashoutNumDes1 = "auto esc";
text.game.cashoutNumDes2 = "auto esc";
text.game.cashoutNumDes3 = "auto esc";
text.game.waitfornextround1 = "esperar la siguiente ronda";
text.game.waitfornextround2 = "esperar la siguiente ronda";
text.game.waitfornextround3 = "esperar la siguiente ronda";
text.game.escape1 = "ESCAPAR";
text.game.escape2 = "ESCAPAR";
text.game.escape3 = "ESCAPAR";
text.game.joinNow = "¡Únete ahora!";
text.game.youHeight = "Tu altura de escape:";
text.game.youReward = "Obtenga recompensas:";
text.game.PersistentEfforts = "¡¡¡Esfuerzos persistentes!!!";


text.help.title = "Instrucción";
text.help.content =
`1. Haz tu apuesta antes de despegar.
2. Toma el riesgo y espera que las probabilidades mejoren.
3. ¡Escapa antes de que explote el cohete!
4. El punto de explosión es de @ 1,00x a 10 000x.
5. El punto de escape más bajo es @1.01x.
6. Si un jugador abandona el juego actual, se considerará un escape y se cancelará la apuesta automática.
7.Tenga en cuenta: Dependiendo de su conexión de red, el punto de escape final puede ser más alto que la altura al hacer clic, lo que también puede provocar un escape fallido antes de la explosión.`

text.help.addContent = `8.En el juego actual, la tasa de retorno teórico del juego a largo plazo (RTP) general de los jugadores es del 97.52%.`

text.ready.content1 = "cuenta atrás"
text.ready.content2 = "PREPARANTE!"

text.inpuView.content3 = "OK"
text.inpuView.content4 = "máximo"
text.inpuView.content5 = "mín."


text.quitView.content = "El cohete está despegando, ¿quieres salir sin cobrar?";
text.quitView.confirm = "Confirmar";
text.quitView.cancel = "Cancelar";

text.myRecord.content = "REGISTRO DE APUESTAS"
text.myRecord.nodata = "Sin datos";

text.gameHistory.content1 = "Punto de explosión";
text.gameHistory.content2 = "Estadísticas del punto de explosión:";
text.gameHistory.content3 = "altura";
text.gameHistory.content4 = "últimas 10 rondas";
text.gameHistory.content5 = "últimas 20 rondas";
text.gameHistory.content6 = "últimas 30 rondas";
text.gameHistory.content7 = "últimas 50rondas";
text.gameHistory.content8 = "últimas 100 rondas";

text.disconnectCash.content = `La red está desconectada y has escapado automáticamente.
NOTA: ¡Por favor, mantén la RED ABIERTA para escapar con éxito!`;
text.disconnectCash.reconnect = "Reconectar";
text.disconnectCash.exit = "Salir";

codeText.betView.alreadybet = "¡Ya aposté!";
codeText.betView.bet = "COSTO"
codeText.betView.holdtoauto = "mantener en automático"
codeText.betView.cancelauto = 'DETENER AUTO'
codeText.betView.betnext = "APUESTA SIGUIENTE"
codeText.betView.automodel = "APUESTA AUTOMÁTICA"
codeText.betView.cancel = "CANCELAR"
codeText.betView.cancelnext = "Cancelar Siguiente"
codeText.betView.escape = "ESCAPAR"
codeText.betView.escape2 = "escapar"
codeText.betView.escape3 = "no escapé"
codeText.betView.cancelbet = "Cancelar apuesta"
codeText.betView.betnext2 = "Apuesta Siguiente+"
codeText.betView.exploded = "explotó"
codeText.betView.maxBetLimit = "Exceder el límite"

codeText.globalContent.flightheight = "Altura de vuelo"
codeText.globalContent.vacancy = "vacante"
codeText.globalContent.rocket = "COHETE"
codeText.globalContent.inputContent1 = "Límite: 100,00-50 000,00"
codeText.globalContent.inputContent2 = "Introduzca la cantidad:"
codeText.globalContent.inputContent3 = "Altura de escape: 1,01-100,00"
codeText.globalContent.inputContent4 = "Introduzca un punto de escape:"
codeText.globalContent.round =  "ronda: "

