import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
text.game.balance = "BALANCE";
text.game.win = "WIN";
text.game.autoTip = "Tap to autoplay"
text.game.bet = "Cost";

text.help.StarCardTitle = "Star Card";
text.help.StarCardContent = `  1.The "Star Card" has a chance to trigger its effect after the completion of "second to fourth prize matching" in each spin and after the completion of card replenishment.
  2.The "Star Card" will definitely trigger its effect after the completion of "fifth prize matching and beyond" in each spin and after the completion of card replenishment.
  3.The effect of the "Star Card" is to randomly transform the "regular playing cards" of the 2nd, 3rd, and 4th rounds into "golden playing cards".`
text.help.GoldenSymbolTitle = "Golden Symbol";
text.help.GameRulesContent = `  1."Golden Symbol" will appear on reels 2, 3, and 4 only.
  2."Golden Symbol" and "Normal Symbol" as seen as the same symbol to eliminated and win the payouts.
  3.When "Golden Symbol" is eliminated that will flip in its original position and become "Joker Symbol".`
text.help.JokerSymbolTitle = `Joker Symbol`
text.help.JokerSymbolContent = `  1.The "Joker Symbol" will only appear after "Golden Symbol" has been eliminated.
  2.The "Joker Symbol" comes in two modes: "Big Joker Symbol" and "Little Joker Symbol".
  3.When "Big Joker Symbol" appears will be replicate 1~4 "Big Joker Symbol" in 2~5 reels randomly replace the other symbols.(except <img src='p_00'/> and Joker Symbol)
  4.When "Little Joker Symbol" appear only replace the "Golden Symbol" original position.
  5."Joker Symbol" is Wild and substitutes for all symbols except <img src='p_00'/>.`
text.help.JokerSymbolJoker1 = `Big Joker 
Symbol`
text.help.JokerSymbolJoker2 = `Little Joker 
Symbol`
text.help.ComboMultiplierTitle = "Combo Multiplier";
text.help.ComboMultiplierContent = `  1."The Combo Multiplier" has 5 levels as x1, x2, x3, x5 in Main Game.
  2.Points won each matching will be multiplied based on the current "Combo Multiplier"
  3.The Multiplier is increased to x1 for "The First Matching" of each spin.
  4.The Multiplier is increased to x2 for "The Second Matching" of each spin.
  5.The Multiplier is increased to x3 for "The Third Matching" of each spin.
  6.The Multiplier is increased to x5 for "The Fourth Matching" of each spin.
  7.The Multiplier is increased to the final level x10 for "The Fiveth or more Matching" of each spin.
  8.If the symbols do not match, the "Combo Multiplier" resets to x1.
  9.If there is a win at a main game (after the winning symbols disappearing and the new symbols falling down for the replacement),
all the symbols on screen are potential to win with combo multiplier for the second, third, fourth, fifth ,sixth or more matching,
and so on if any winning way is awarded.`
text.help.FreeGameTitle = "Free Game";
text.help.FreeGameContent = `  1.If 3 or more " <img src='p_00'/> " appear(no pay ways needed) will trigger the Free Game with 10 free spins. Free game was start after all winning symbols were elimated and no win.
  2."The Combo Multiplier" has 5 levels as x2, x4, x6, x10, x20 in Free Game.
  3.Points won each matching will be multiplied based on the current "Combo Multiplier"
  4.The Multiplier is increased to x2 for "The First Matching" of each spin.
  5.The Multiplier is increased to x4 for "The Second Matching" of each spin.
  6.The Multiplier is increased to x6 for "The Third Matching" of each spin.
  7.The Multiplier is increased to x10 for "The Fourth" of each spin.
  8.The Multiplier is increased to the final level x20 for "The Fiveth or more Matching" of each spin.
  9.If the symbols do not match, the "Combo Multiplier" resets to x2 .
  10.If there is a win at a free game (after the winning symbols disappearing and the new symbols falling down for the replacement), all the symbols on screen are potential to win with combo multiplier for the second, third, fourth, fifth ,sixth or more matching,and so on if any winning way is awarded.
  11.Rules of "Combo Multiplier" are the same as the main game, only the "Combo Multiplier" values are twice that of the main game.
  12.Additional five free spins are given when three or more <img src='p_00'/> appear, and this will only award once during each single free spin even re-evaluated multiple times
  13.During the free game, 3 or more <img src='p_00'/> would be re-evaluated multiple times in a single spin with multiple points won matchings.`
text.help.PaytableTitle = "Paytable";
text.help.PaytableContent =function roundResult(x: number): string{
    return`  1.Payouts are shown as cost = ${x}.
    2.This game uses a dynamic paytable and the symbol payouts displayed below reflect the amount awarded for achieving the combination at the currently selected cost level.`
}
text.help.PaytableJoker1 = `Big Joker 
Symbol`
text.help.PaytableJoker2 = `Little Joker 
Symbol`
text.help.PaytableJokerText = `WILD substitutes for all normal symbols except for <img src = 'p_00'/>`
text.help.GameRulesTitle = "Game Rules";
text.help.GameRulesContent = `  1.This is a video slot with 5 reels, 4 rows and 1024 ways.
  2.All wins begin with leftmost reel and pay left to right on adjacent reels.
  3.Winning symbols can occur anywhere on all reels.
  4.The Cascading reels rule where if there is a win the winning symbols are removed and new symbols will appear on their places for additional wins within the same wager and the process is repeated until there is no win.
  5.The normal symbols(except <img src = 'p_00'/>) of each reel in each winning combination would be calculated once.
  6.Coinciding wins are added.
  7.Only the maximum amount of winnings on each way will be paid out.
  8.Each spin has a maximum payout ratio of 10,000 times. When this ratio is reached, the continuous matching for prize will stop, and the reward settlement will proceed.
  9.Winning combinations and pays are made according to the paytable.`


text.setting.title = "Setting";
text.setting.sound = "Sound";



text.notice.autoEnable = "Auto Spin Enable"
text.notice.autoDisable = "Auto Spin Disable"
text.notice.playing = "Game Playing"