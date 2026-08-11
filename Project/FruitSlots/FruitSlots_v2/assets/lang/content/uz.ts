import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.uz;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `AVTO`;
text.game.stopAuto= `AVTO`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "chiziqlar";
text.game.total = "JAMI";

text.help.title = "Qoida";
text.help.gameRule = "O'yin qoidalari:";
text.help.SpecialSymbols = "Maxsus belgilar";
text.help.content = 
`1. O'yinda 7 ta oddiy belgi va 30 ta to'lov liniyasi mavjud;
2. Makaralar aylanishni to'xtatganda va birinchi 3 ta belgi chapdan o'ngga faollashtirilgan to'lov chizig'iga tushganda, siz asosiy sovrinni yutib olishingiz mumkin;
3. Har bir to'lov liniyasi alohida hisoblab chiqiladi, Qanchalik ko'p to'lov liniyalarini faollashtirsangiz, ma'danli sovrinlarni yutib olishingiz mumkin;
4. Har bir belgining bonus multiplikatori har xil, Sovrin toʻlovi = tikish miqdori x bonus multiplikatori, Tafsilotlarni quyida koʻring:`
text.help.wildContent = "U bonus va scatter belgilaridan tashqari barcha boshqa belgilarni almashtirishi mumkin.";
text.help.freeContent = "Ulardan 3 tasi yoki undan ko'prog'i paydo bo'lganda, siz bir nechta bepul aylanish vaqtini olasiz.";
text.help.jackpotContent = "Ulardan 3 tasi yoki undan ko'prog'i paydo bo'lganda, siz jackpot yutib olasiz.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>marta";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>marta";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>marta";

text.setting.title = "Sozlama";
text.setting.sound = "Ovoz";