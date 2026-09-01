import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.pt;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "FOGUETE";
text.game.hisLabel = "seu:";
text.game.label = "TODOS";
text.game.cashoutNumDes1 = "esc automático";
text.game.cashoutNumDes2 = "esc automático";
text.game.cashoutNumDes3 = "esc automático";
text.game.waitfornextround1 = "esperar pela próxima rodada";
text.game.waitfornextround2 = "esperar pela próxima rodada";
text.game.waitfornextround3 = "esperar pela próxima rodada";
text.game.escape1 = "ESCAPAR";
text.game.escape2 = "ESCAPAR";
text.game.escape3 = "ESCAPAR";
text.game.joinNow = "Entre agora!";
text.game.youHeight = "Sua altura de fuga:";
text.game.youReward = "Obtenha recompensas:";
text.game.PersistentEfforts = "Esforços persistentes!!";


text.help.title = "Instrução";
text.help.content =
`1. Faça sua aposta antes de decolar.
2. Assuma o risco e espere as probabilidades melhorarem.
3. Fuja antes que o foguete exploda!
4. O ponto de explosão é @ 1,00x a 10.000x.
5. O menor ponto de fuga é @ 1,01x.
6. Se um jogador sair do jogo atual, será considerado uma fuga, e a aposta automática será cancelada.
7. Observe: dependendo da sua conexão de rede, o ponto de fuga final pode ser maior do que a altura quando clicado, o que também pode resultar em uma fuga malsucedida antes da explosão.`


text.help.addContent = `8.No jogo atual, a taxa de retorno teórico do jogo a longo prazo (RTP) geral dos jogadores é de 97.52%.`

text.ready.content1 = "contagem regressiva"
text.ready.content2 = "PREPARANDO!"

text.inpuView.content3 = "OK"
text.inpuView.content4 = "máx"
text.inpuView.content5 = "mín"


text.quitView.content = "O foguete está decolando, você quer sair sem sacar?";
text.quitView.confirm = "Confirmar";
text.quitView.cancel = "Cancelar";

text.myRecord.content = "REGISTRO DE APOSTAS"
text.myRecord.nodata = "sem dados";

text.gameHistory.content1 = "Ponto de explosão";
text.gameHistory.content2 = "Estatísticas do ponto de explosão:";
text.gameHistory.content3 = "altura";
text.gameHistory.content4 = "últimas 10 rodadas";
text.gameHistory.content5 = "últimas 20 rodadas";
text.gameHistory.content6 = "últimas 30 rodadas";
text.gameHistory.content7 = "últimas 50 rodadas";
text.gameHistory.content8 = "últimas 100 rodadas";

text.disconnectCash.content = `A rede foi desconectada e você escapou automaticamente.
Nota: Por favor, mantenha a rede aberta para escapar com sucesso!`;
text.disconnectCash.reconnect = "Reconectar";
text.disconnectCash.exit = "Sair";

codeText.betView.alreadybet = "Já apostou!";
codeText.betView.bet = "APOSTAR"
codeText.betView.holdtoauto = "manter para automático"
codeText.betView.cancelauto = 'PARAR AUTOMÁTICO'
codeText.betView.betnext = "APOSTAR PRÓXIMO"
codeText.betView.automodel = "APOSTA AUTOMÁTICA"
codeText.betView.cancel = "CANCELAR"
codeText.betView.cancelnext = "Cancelar Próximo"
codeText.betView.escape = "ESCAPAR"
codeText.betView.escape2 = "escapar"
codeText.betView.escape3 = "Não escapou"
codeText.betView.cancelbet = "Cancelar Aposta"
codeText.betView.betnext2 = "Aposta Próximo+"
codeText.betView.exploded = "explodido"
codeText.betView.maxBetLimit = "Excedeu o limite"

codeText.globalContent.flightheight = "Altura do voo"
codeText.globalContent.vacancy = "vaga"
codeText.globalContent.rocket = "FOGUETE"
codeText.globalContent.inputContent1 = "Limite: 100,00-50.000,00"
codeText.globalContent.inputContent2 = "Digite o valor:"
codeText.globalContent.inputContent3 = "Altura de escape: 1,01-100,00"
codeText.globalContent.inputContent4 = "Digite um ponto de escape:"
codeText.globalContent.round =  "rodada: "
