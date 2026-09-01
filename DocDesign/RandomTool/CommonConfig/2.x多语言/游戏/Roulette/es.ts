import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.es;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "OTRA VEZ";
text.game.new = "Nuevo >"
text.game.gameStart = "Iniciar juego";
text.game.starting = "Iniciando";
text.game.round = "Ronda:";
text.game.gainedCoins = "Monedas obtenidas:";
text.gameRecord.title1 = "Historial de juegos";
text.gameRecord.title2 = "Mi historial";
text.gameRecord.nodata = "sin datos";
text.gameRecord.rule = "Solo se muestra durante 7 días, con un máximo de 100 registros por día";
text.gameRecord.new = "NUEVO";

text.help.title = "Reglas del juego";
text.help.content =
`La ruleta es un juego divertido y emocionante.

1. Números: 0 (premio de 36 veces), 1-12 (premio de 3 veces), 13-24 (premio de 3 veces), 25-36 (premio de 3 veces);

2. Color: rojo (premio 2x), negro (premio 2x);

3. Par e impar: impar (premio 2x), par pero sin incluir el 0 (premio 2x).

¡Que disfrutes del juego!`
text.help.reward = "Se están repartiendo premios, ¡por favor espera!";
text.help.wait = "Espera la siguiente ronda";

codeText.globalContent.Time = "Hora"
codeText.globalContent.bet = "apuesta";
codeText.globalContent.get = "obtener";
codeText.globalContent.win = "ganar";
