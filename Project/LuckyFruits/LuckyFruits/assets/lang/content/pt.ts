import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.pt;

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
text.game.todayRound = "Rodada:";

text.ready.content = "Tempo de preparação";
text.gameHistory.title = "Histórico do jogo";
text.myHistory.title = "Meu histórico";
text.myHistory.date = "Data";
text.myHistory.betDetail = "Detalhe da aposta";
text.myHistory.result = "Resultado";
text.myHistory.revenue = "Receita";
text.rewarding.content = "Recompensando, por favor aguarde!";

codeText.globalContent.round = "Rodada: "
codeText.globalContent.betMaxLimit = "Você só pode apostar no máximo {0} por rodada!";
text.help.title = "Regras do jogo";
text.help.content =
`
As opções de aposta padrão e os multiplicadores de bônus de frutas são:
x3 Maçã grande
x6 Banana grande
x8 Limão grande
x12 Melancia grande
x30 BAR

Se parar em uma fruta que exibe "x2", o multiplicador será dobrado.

Bônus especiais:
1. Sorte Arco-Íris (dois modos)
- Recebe cada bônus do semicírculo superior uma vez.
- Hora da Maçã: o jogo continua até sair uma maçã.

2. Sorte Amarela (dois modos)
- Recebe cada bônus do semicírculo inferior uma vez.
- Recebe cada fruta uma vez.

Observação: Ambos os modos de Sorte podem entrar na "Hora de Azar", caso em que nenhum bônus será concedido.
`
