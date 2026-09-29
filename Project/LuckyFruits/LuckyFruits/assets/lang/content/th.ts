import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.th;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;

text.game.autoPlay= `Auto
内测
专用`;
text.game.stopAuto =`Stop
内测
专用`;
text.game.todayRound = "รอบ:";

text.ready.content = "เวลาเตรียม";
text.gameHistory.title = "ประวัติเกม";
text.myHistory.title = "ประวัติของฉัน";
text.myHistory.date = "วันที่";
text.myHistory.betDetail = "รายละเอียดการเดิมพัน";
text.myHistory.result = "ผลลัพธ์";
text.myHistory.revenue = "รายได้";
text.rewarding.content = "กำลังจ่ายรางวัล กรุณารอสักครู่!";

codeText.globalContent.round = "รอบ: "
codeText.globalContent.betMaxLimit = "คุณเดิมพันได้ไม่เกิน {0} ต่อรอบเท่านั้น!";
text.help.title = "กติกาเกม";
text.help.content =
`
ตัวเลือกการเดิมพันเริ่มต้นและตัวคูณโบนัสผลไม้คือ
x3 แอปเปิลใหญ่
x6 กล้วยใหญ่
x8 เลมอนใหญ่
x12 แตงโมใหญ่
x30 BAR

หากหยุดที่ผลไม้ที่แสดง "x2" ตัวคูณจะเพิ่มเป็นสองเท่า

รางวัลพิเศษ:
1. โชคสายรุ้ง (สองรูปแบบ)
- รางวัลทุกช่องในครึ่งวงกลมด้านบนชนะอย่างละหนึ่งครั้ง
- ช่วงเวลาแอปเปิล: เกมจะดำเนินต่อไปจนกว่าแอปเปิลจะชนะ

2. โชคสีเหลือง (สองรูปแบบ)
- รางวัลทุกช่องในครึ่งวงกลมด้านล่างชนะอย่างละหนึ่งครั้ง
- ผลไม้ทุกชนิดชนะอย่างละหนึ่งครั้ง

หมายเหตุ: โหมดโชคทั้งสองมีโอกาสเข้าสู่ "ช่วงโชคร้าย" ซึ่งจะไม่มีการมอบรางวัล
`
