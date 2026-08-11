import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
text.game.balance = "BALANCE";
text.game.win = "WIN";
text.game.extra = `An addtional 50% of the cost
is required to pay for the Extra Costs.
In Extra Cost mode, 
1x multiplier symbol wiil be removed from the special reel, and 15x multiplier symbol will be added.
In Extra Cost mode,
the prize value on the Lucky Wheel will be multiplied
by a random multiplier which could be: 1x,2x,3x,5x,10x,15x.`
text.game.extraBtn = "Extra Cost",
text.game.autoTip = "Tap to autoplay"
text.game.round = "Round:"

text.help.title = "Rule"
text.help.symbol = "Symbol";
text.help.symboContent = 'This is the WILD symbol. It appears on all reels and substitutes for all symbols.';
text.help.SpecialReel = "Special Reel";
text.help.SpecialReelContent1 = '1.The 4th reel is a special reel, and contains only multiplier symbols and';
text.help.SpecialReelContent2 = '2.All winnings will be multiplied by the multiplier which is landed at the center of the special reel.';
text.help.SpecialReelContent3 = '3.There are 6 multiplier symbols in normal cost mode: 1x, 2x, 3x, 5x, 10x.';
text.help.SpecialReelContent4_1 = '4.Landing  '
text.help.SpecialReelContent4_2 = '  at the center of the special reel will trigger the ';
text.help.SpecialReelContent4_3 = 'Lucky Wheel .'
text.help.LuckyWheel = "Lucky Wheel";
text.help.LuckyWheelContent1 = 'Triggering the Lucky Wheel will award a random prize value which could be 1x, 3x, 5x, 8x, 10x, 15x, 20x, 30x, 50x, 100x, 200x or 1000x of the cost.';
text.help.Paytable = "Paytable";
text.help.PaytableContent1 = `1.This game uses a dynamic paytable and the symbol payouts displayed below reflect the amount awarded for achieving the combination at the currently selected cost level.
2.All winning symbols pay from left to right on adjacent reels starting from the leftmost reel.`;
text.help.GameRule = "Game Rule";
text.help.GameRuleContent1 = '1.This is a video slot with 3 reels and 1 special reel, 3 rows and the number of paylines is 5.';
text.help.GameRuleContent2 = '2.All winning symbols pay from left to right on selected paylines.';
text.help.GameRuleContent3 = '3.Payline:';
text.help.GameRuleContent4 = '4.Only the highest win is paid on each payline.';
text.help.GameRuleContent5 = '5.When winning on multiple paylines, all wins are added to the total win.';
text.help.GameRuleContent6 = '6.Feature games will play with the same cost settings as those in the trigger game.';
text.help.GameRuleContent7 = '7.Winning combinations and pays are made according to the paytable.';
text.help.GameRuleContent8 = '8.The winning amount of the extra cost mode will be calculated based on the normal cost settings and refer to the paytable values.';

text.setting.title = "Setting";
text.setting.sound = "Sound";

text.notice.autoEnable = "Auto Spin Enable"
text.notice.autoDisable = "Auto Spin Disable"
text.notice.playing = "Game Playing"

text.history.title = "History";
text.history.time = "Date";
text.history.cost = "Cost";
text.history.result = "Result Detail";
text.history.win = "Win";