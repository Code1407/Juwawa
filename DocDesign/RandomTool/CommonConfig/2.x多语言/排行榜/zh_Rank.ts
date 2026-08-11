import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.zh;

let text = textsMap[lang] = new Path();

text.path0 = `名次`;
text.path1 = `玩家名`;
text.path2 = `积分`;
text.path3 = `奖励`;
text.path7 = `规则`;
text.path8 = `1. 每位下注的玩家将根据其下注金额获得排行榜积分，并根据积分获得相应奖励；

2. 当日排名前十的玩家可在24:00后领取当日排行榜奖励；

3. 每周排名前十的玩家可在周六24:00后领取每周排行榜奖励；

4. 注意：榜单从周日开始为第一天，周六结束。奖励必须在相应排行榜周期结束后的24小时内领取，逾期将失效。`;
text.path9 = `加载中...`;
text.path10 = `名次`;
text.path11 = `确认`;
text.path12 = `恭喜您在联赛中获得第 <color=#FFFF00><color=#FFFF00>{0}</c></c> 名，并获得奖金 <color=#FFFF00><color=#FFFF00><color=#FFFF00>{1}</c></c></c>`;