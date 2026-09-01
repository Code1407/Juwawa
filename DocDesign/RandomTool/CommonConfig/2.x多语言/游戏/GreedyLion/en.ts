import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= 
`Auto Play`;
text.game.stopAuto = 
`Stop Auto`;
text.game.result = "result";
text.game.mine = "MyHistory";
text.game.todayWin = 
`Today's Revenue:`;
text.game.todayRank = 
`Today Rank`;
text.game.round = "round:";
text.game.salad = "salad";
text.game.pizza = "pizza";
text.game.selectTime = "Select Time";

text.help.title = "Rule";
text.help.content = 
`
1. Choose your cost amount and select the food to cost ;

2. The results will be announced after the cost period ends;

3. If the result announced matches the food you haveselected, you will rewards relative to the respective cost;

4. The official prize pool will increase as more users participate in game, there will be a chance for "PIZZA" or "SALAD" reward as prize pool reaches a certain amount;

5. If "SALAD" was announced, then all vegetables will be rewarded;

6. If "PIZZA" was announced, then all meats will be rewarded.
`

text.rank.title = "Today's Revenue Rank";
text.rank.column_Ranking = "Ranking";
text.rank.column_Profile = "Profile";
text.rank.column_Name = "Name";
text.rank.column_Revenue = "Revenue";

text.myHistory.title = "My History";
text.myHistory.column_Time = "Play Time";
text.myHistory.column_Details = "Play Details";
text.myHistory.column_Result = "Result";
//text.myHistory.column_Revenue = "Revenue";
text.myHistory.round = "Round:"

text.exceed.content = "Sorry, you can't bet for more than 6 options each game round.";
text.exceed.confirm = "Confirm";

text.setting.title = "Setting";
text.setting.sound = "Sound";
text.setting.on = "On";
text.setting.off = "Off";

text.roundFinal.thisRoundBets = "   This Round Bets:          ";
text.roundFinal.thisRoundRanking = "This Round Ranking:   ";
text.roundFinal.thisRoundEarnings = "This Round Earnings:       ";
text.roundFinal.roundNumber = function roundResult(x: number): string {
    return `Round ${x}'s Result:`;
};