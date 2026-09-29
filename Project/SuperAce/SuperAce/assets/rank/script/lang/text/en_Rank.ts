import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.en;

let text = textsMap[lang] = new Path();

text.path0 = `Rank`;
text.path1 = `Player`;
text.path2 = `Score`;
text.path3 = `Award`;
text.path7 = `Rules`;
text.path8 = `1. Each player who places a cost will receive leaderboard points based on their cost amount, and will be awarded rewards according to their corresponding points;

2. The top 10 players of the day can claim their daily leaderboard rewards after 24:00;

3. The top 10 players of the week can claim their weekly leaderboard rewards after 24:00 on Saturday;

4. Warning: The list starts on Sunday and ends on Saturday.Rewards must be claimed within 24 hours of the end of the corresponding leaderboard period; rewards expire after this period.`;
text.path9 = `loading...`;
text.path10 = `Rank`;
text.path11 = `Confirm`;
text.path12 = `Congratulations on finishing <color=#FFFF00>{0}</c> in the League and getting the bonus <color=#FFFF00>{1}</c>`;