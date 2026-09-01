import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.pt;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=
`Reprodução automática`;
text.game.stopAuto =
'Parar Automático';
text.game.result = "resultado";
text.game.mine = "Minha História";
text.game.todayWin =
`Receita de hoje:`;
text.game.todayRank =
`Classificação de hoje`;
text.game.round = "rodada:";
text.game.salad = "salada";
text.game.pizza = "pizza";
text.game.selectTime = "Selecionar hora";

text.help.title = "Regra";
text.help.content =
`
1. Escolha o valor do seu gasto e selecione os alimentos que deseja gastar;
2. Os resultados serão anunciados após o término do período de gastos;
3. Se o resultado anunciado corresponder aos alimentos que você selecionou, você receberá recompensas proporcionais ao respectivo gasto;
4. O prêmio total aumentará conforme mais usuários participarem do jogo, havendo uma chance de ganhar uma "PIZZA" ou uma "SALADA" como recompensa à medida que o prêmio total atingir um determinado valor;
5. Se o resultado anunciado for "SALADA", todos os vegetais serão recompensados;
6. Se o resultado anunciado for "PIZZA", todas as carnes serão recompensadas.
`

text.rank.title = "Classificação da receita de hoje";
text.rank.column_Ranking = "Classificação";
text.rank.column_Profile = "Perfil";
text.rank.column_Name = "Nome";
text.rank.column_Revenue = "Receita";

text.myHistory.title = "Meu Histórico";
text.myHistory.column_Time = "Tempo de Reprodução";
text.myHistory.column_Details = "Detalhes da Reprodução";
text.myHistory.column_Result = "Resultado";
//text.myHistory.column_Revenue = "Receita";
text.myHistory.round = "Rodada:"

text.exceed.content = "Desculpe, você não pode apostar em mais de 6 opções em cada rodada do jogo.";
text.exceed.confirm = "Confirmar";

text.setting.title = "Configuração";
text.setting.sound = "Som";
text.setting.on = "Ligado";
text.setting.off = "Desligado";

text.roundFinal.thisRoundBets = " Apostas desta rodada: ";
text.roundFinal.thisRoundRanking = "Classificação desta rodada: ";
text.roundFinal.thisRoundEarnings = "Ganhos desta rodada: ";
text.roundFinal.roundNumber = function roundResult(x: number): string {
    return `Resultado da Rodada ${x}:`;
};