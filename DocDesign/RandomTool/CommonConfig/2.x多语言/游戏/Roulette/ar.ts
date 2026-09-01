import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.ar;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again= "مرة أخرى";
text.game.new = "جديد";
text.game.gameStart = "بداية اللعبة";
text.game.starting = "ابتداء";
text.game.round = "عدد الألعاب";
text.game.gainedCoins = "العملات المكتسبة";

text.gameRecord.title1 = "تاريخ اللعبة";
text.gameRecord.title2 = "تاريخي";
text.gameRecord.nodata = "لايوجد بيانات";
text.gameRecord.rule = "يتم عرضه لمدة 7 أيام فقط، مع عرض 100 سجل كحد أقصى يوميًا";
text.gameRecord.new = "جديد";

text.help.title = "قواعد اللعبة ";
text.help.content = 
`
الروليت هي لعبة ممتعة ومثيرة.

 1. الأرقام : 0 (مكافأة 36x  )، 1-12 (مكافأة 3 x )، 13-24 (مكافأة 3x  )،
  25-36 (مكافأة 3x )؛

 2. اللون: أحمر (مكافأة 2x)، أسود (مكافأة 2x)؛

 3. فردي وزوجي: فردي (مكافأة 2x)، زوجي ولكن لا يشمل 0 (مكافأة 2x).

 لعبة ممتعة لكم!
`
text.help.reward = "!  عملية التسوية جارية، يرجى الانتظار"
text.help.wait="يرجى الانتظار للجولة القادمة";

codeText.globalContent.Time = "وقت"
codeText.globalContent.bet = "وضع رهان";
codeText.globalContent.win = "يفوز";
codeText.globalContent.get = "يحصل";
