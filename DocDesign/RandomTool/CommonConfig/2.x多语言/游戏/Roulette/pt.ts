import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.pt;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "NOVAMENTE";
text.game.new = "Novo >"
text.game.gameStart = "Iniciar jogo";
text.game.starting = "Iniciando";
text.game.round = "Rodada:";
text.game.gainedCoins = "Moedas ganhas:";
text.gameRecord.title1 = "Histórico de jogos";
text.gameRecord.title2 = "Meu histórico";
text.gameRecord.nodata = "sem dados";
text.gameRecord.rule = "Exibido apenas por 7 dias, com um máximo de 100 registros por dia";
text.gameRecord.new = "NOVO";

text.help.title = "Regras do jogo";
text.help.content =
`A roleta é um jogo divertido e emocionante.

1. Números: 0 (prêmio de 36 vezes), 1-12 (prêmio de 3 vezes), 13-24 (prêmio de 3 vezes), 25-36 (prêmio de 3 vezes);

2. Cor: vermelho (prêmio 2x), preto (prêmio 2x);

3. Par e ímpar: ímpar (prêmio 2x), par, mas sem incluir o 0 (prêmio 2x).

Bom jogo!`
text.help.reward = "Recompensando, por favor aguarde!";
text.help.wait = "Aguarde a próxima rodada";

codeText.globalContent.Time = "Hora"
codeText.globalContent.bet = "aposta";
codeText.globalContent.get = "obter";
codeText.globalContent.win = "ganhar";
