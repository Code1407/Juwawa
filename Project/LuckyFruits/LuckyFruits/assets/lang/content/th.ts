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
text.game.stopAuto =`Auto
内测
专用`;
text.game.players = "players";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Mine:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Mine:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Mine:";
text.game.todayRound = "รอบ:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "ประวัติของฉัน";
text.myHistory.date = "วันที่";
text.myHistory.betDetail = "รายละเอียดการเดิมพัน";
text.myHistory.result = "ผลลัพธ์";
text.myHistory.revenue = "รายได้";

text.help.title = "กติกาเกม";
text.help.content =
`
สัญลักษณ์ผลไม้แต่ละชนิดมีผลลัพธ์ได้สองแบบ หากมี "x2" ใต้สัญลักษณ์ที่ชนะ รางวัลจะคำนวณตามตัวคูณที่แสดง มิฉะนั้นจะใช้อัตราจ่ายเริ่มต้น

x2 แอปเปิล
x2 กล้วย
x2 เลมอน
x2 แตงโม

อัตราจ่ายเริ่มต้นของผลไม้
x3 แอปเปิลใหญ่
x6 กล้วยใหญ่
x8 เลมอนใหญ่
x12 แตงโมใหญ่
x30 BAR

รางวัลพิเศษ:
1. โชคสายรุ้ง (สองรูปแบบ)
- รางวัลทุกช่องในครึ่งวงกลมด้านบนชนะอย่างละหนึ่งครั้ง
- ช่วงเวลาแอปเปิล: เกมจะดำเนินต่อไปจนกว่าแอปเปิลจะชนะ

2. โชคสีเหลือง (สองรูปแบบ)
- รางวัลทุกช่องในครึ่งวงกลมด้านล่างชนะอย่างละหนึ่งครั้ง
- ผลไม้ทุกชนิดชนะอย่างละหนึ่งครั้ง

หมายเหตุ: โหมดโชคทั้งสองมีโอกาสเข้าสู่ "ช่วงโชคร้าย" ซึ่งจะไม่มีการมอบรางวัล
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "รอบ: "
