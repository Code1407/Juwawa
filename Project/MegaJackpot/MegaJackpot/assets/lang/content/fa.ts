import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.fa;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `AUTO`;
text.game.stopAuto= `AUTO`;
text.game.linesLabe1= "خطوط";
text.game.linesLabe2= "30";
text.game.total = " TOTAL";

text.help.title = "  قانون   ";
text.help.gameRule = ": قوانین بازی ";
text.help.SpecialSymbols = ": نمادهای خاص   ";
text.help.content = 
` 7 نماد معمولی و 30 خط پرداخت در بازی ارائه شده است
 هنگامی که چرخ ها متوقف می شوند و 3 نماد اول از چپ به 
راست در خط پرداخت فعال قرار می گیرند، می توانید یک جایزه 
اساسی ببرید
هر خط پرداخت به طور جداگانه محاسبه می شود
ضریب پاداش هر نماد متفاوت است، پرداخت جایزه = مبلغ شرط         
ضریب پاداش، جزئیات را در زیر ببینید  x`
text.help.wildContent = "این می تواند جایگزین همه نمادهای دیگر به جز نمادهای جایزه و پراکندگی شود";
text.help.freeContent = "با نمایش 3 مورد یا بیشتر، چندین بار چرخش رایگان دریافت می کنید";
text.help.jackpotContent = "عندما تظهر 3 منهم أو أكثر ، فإنك تفوز بالجائزة الكبرى";
text.help.freeTime3 = "x<color=#00ff00>3</color> = بارها<color=#00ff00>5</color>";
text.help.freeTime4 = "x<color=#00ff00>4</color> = بارها<color=#00ff00>8</color>";
text.help.freeTime5 = "x<color=#00ff00>5</color> = بارها<color=#00ff00>12</color>";

text.setting.title = "تنظیم";
text.setting.sound = "صدا";