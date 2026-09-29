import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.ur;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.autoPlay= `آٹو`;
text.game.stopAuto= `آٹو`;
text.game.linesLabe1= "لائنیں";
text.game.linesLabe2= "30";
text.game.total = "TOTAL";

text.help.title = "کھیل کے قوانین";
text.help.content = 
`گیم میں 7 باقاعدہ علامتیں اور 30 تنخواہ کی لائنیں پیش کی جاتی ہیں۔
جب ریلز گھومنا بند کر دیں اور ایکٹیویٹڈ پے لائن پر بائیں سے دائیں تک پہلی 3 علامتیں لگ جائیں، تو آپ بنیادی انعام جیت سکتے ہیں۔
ہر پے لائن کا الگ سے حساب لگایا جاتا ہے، آپ جتنی زیادہ پے لائنز کو چالو کریں گے، اتنے ہی ایسک انعامات آپ جیت سکتے ہیں۔
ہر علامت کا بونس ضرب مختلف ہے، انعام کی ادائیگی = شرط کی رقم x بونس ضرب، نیچے تفصیلات دیکھیں`
text.help.wildContent = "یہ بونس اور بکھرنے والی علامتوں کے علاوہ دیگر تمام علامتوں کا متبادل لے سکتا ہے۔";
text.help.freeContent = "ان میں سے 3 یا اس سے زیادہ ظاہر ہونے پر، آپ کو کئی بار مفت اسپن ملتے ہیں۔";
text.help.jackpotContent = "ان میں سے 3 یا اس سے زیادہ ظاہر ہونے پر، آپ جیک پاٹ جیت جاتے ہیں۔"
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>اوقات";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>اوقات";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>اوقات";

text.setting.title = "سیٹنگ";
text.setting.sound = "آواز";