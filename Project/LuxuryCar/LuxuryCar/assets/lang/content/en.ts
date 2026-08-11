import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.en;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.Round = "Round:";
text.game.Today = "Today";
text.game.Mine = "Mine";
text.game.Win = "Win";
text.game.Auto01 = `Auto`;
text.game.Auto02 = `Stop
Auto`;


text.help.title = "Rule";
text.help.content =
    `
1.Predict which car logo will light up before the draw;

2.The car logo that lights up after the draw is the winning logo;

3.If the prediction is successful, you will get the prize of the corresponding cost.
`

text.roundFinal.Result = "Round  Number's Result:";
text.roundFinal.Earnings = "This Round's Earnings: ";
text.roundFinal.myBet = "   This Round's Cost:";
text.roundFinal.line = "This Round's Ranking ";

text.gameHistory.title = "My Histroy";
text.gameHistory.ColumnName = "    Cost Time           Cost Details          Reward Details";
text.gameHistory.round = "Round:";

text.RankListView.title = "Today's Revenue Rank";
text.RankListView.ColumnName = "Ranking      Profile           Name                 Revenue";

