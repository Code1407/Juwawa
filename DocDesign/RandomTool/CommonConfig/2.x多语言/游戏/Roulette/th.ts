import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.th;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "อีกครั้ง";
text.game.new = "ใหม่ >"
text.game.gameStart = "เริ่มเกม";
text.game.starting = "กำลังเริ่ม";
text.game.round = "รอบ:";
text.game.gainedCoins = "เหรียญที่ได้รับ:";
text.gameRecord.title1 = "ประวัติเกม";
text.gameRecord.title2 = "ประวัติของฉัน";
text.gameRecord.nodata = "ไม่มีข้อมูล";
text.gameRecord.rule = "แสดงเพียง 7 วัน สูงสุด 100 รายการต่อวัน";
text.gameRecord.new = "ใหม่";

text.help.title = "กติกาเกม";
text.help.content =
`รูเล็ตเป็นเกมที่สนุกและตื่นเต้น

1. ตัวเลข: 0 (รางวัล 36 เท่า), 1-12 (รางวัล 3 เท่า), 13-24 (รางวัล 3 เท่า), 25-36 (รางวัล 3 เท่า);

2. สี: แดง (รางวัล 2 เท่า), ดำ (รางวัล 2 เท่า);

3. เลขคี่และเลขคู่: เลขคี่ (รางวัล 2 เท่า), เลขคู่แต่ไม่รวม 0 (รางวัล 2 เท่า)

ขอให้สนุกกับเกม!`
text.help.reward = "กำลังจ่ายรางวัล กรุณารอสักครู่!";
text.help.wait = "กรุณารอรอบถัดไป";

codeText.globalContent.Time = "เวลา"
codeText.globalContent.bet = "เดิมพัน";
codeText.globalContent.get = "ได้รับ";
codeText.globalContent.win = "ชนะ";
