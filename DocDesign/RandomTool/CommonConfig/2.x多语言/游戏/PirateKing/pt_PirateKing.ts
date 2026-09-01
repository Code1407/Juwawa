import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.pt;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `PAGA`;
text.game.path2 = `AUTO`;
text.game.path4 = `VELOCIDADE`;
text.game.path34 = `Os valores exibidos nesta página representam os prêmios que podem ser concedidos na aposta total 20.`;
text.game.path35 = `WILD pode substituir qualquer ícone no jogo, exceto o giro.`;
text.game.path36 = `o giro conta apenas o número na tela. Não tem relação com as linhas. Se aparecerem 3 ou mais SPIN na tela, o jogador ganhará aleatoriamente o JACKPOT.`;
text.game.path37 = `Linha de pagamento`;
text.game.path38 = `Configurações`;
text.game.path39 = `Som`;
text.game.path58 = `REGRAS`;
text.game.path59 = `No jogo atual, a taxa de retorno teórico do jogo a longo prazo (RTP) geral dos jogadores é de 97.52%.`;

text.history.History = `HISTÓRICO`;
text.history.time = `Hora`;
text.history.bet = `Aposta`;
text.history.type = `Tipo`;
text.history.line = `Linha`;
text.history.count = `Contagem`;
text.history.win = `Ganhar`;
text.history.round = `Rodada:`;
