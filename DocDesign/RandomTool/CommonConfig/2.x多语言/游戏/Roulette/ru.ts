import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ru;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;

text.game.again = "СНОВА";
text.game.new = "Новое >"
text.game.round = "Раунд:";
text.game.gameStart = "Начать игру";
text.game.starting = "Запуск";
text.game.gainedCoins = "Выиграно монет:"
text.gameRecord.title1 = "История игр";
text.gameRecord.title2 = "Моя история";
text.gameRecord.nodata = "нет данных";
text.gameRecord.rule = "Отображаются только за 7 дней, максимум 100 записей в день";
text.gameRecord.new = "НОВОЕ";

text.help.title = "Правила игры";
text.help.content = 
`Рулетка — это веселая и захватывающая игра.

1.Числа:0 — выигрыш x36.  1–12 — выигрыш x3.  13–24 — выигрыш x3.  25–36— выигрыш x3.

2.Цвет:Красное — выигрыш x2.  Чёрное — выигрыш x2.

3.Чётность:Нечётное — выигрыш x2.  Чётное (кроме 0) — выигрыш x2.

Приятной игры!`
text.help.reward = "Идёт начисление вознаграждения, пожалуйста, подождите!";
text.help.wait = "Пожалуйста, подождите следующего раунда";


codeText.globalContent.Time = "Время"
codeText.globalContent.bet = "ставка";
codeText.globalContent.get = "получить";
codeText.globalContent.win = "выигрыш";
