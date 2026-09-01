import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.th;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `ชำระเงิน`;
text.game.path2 = `อัตโนมัติ`;
text.game.path4 = `ความเร็ว`;
text.game.path34 = `ค่าที่แสดงในหน้านี้แสดงถึงรางวัลที่อาจได้รับจากการเดิมพันรวม 20.`;
text.game.path35 = `WILD สามารถแทนที่ไอคอนใดก็ได้ในเกมยกเว้นการหมุน.`;
text.game.path36 = `การหมุนนับเฉพาะตัวเลขบนหน้าจอ ไม่มีความสัมพันธ์กับเส้น หากมี 3 หรือมากกว่า SPIN บนหน้าจอ ผู้เล่นจะได้รับแจ็คพอตแบบสุ่ม.`;
text.game.path37 = `เพย์ไลน์`;
text.game.path38 = `ตั้งค่า`;
text.game.path39 = `เสียง`;
text.game.path58 = `กฎ`;
text.game.path59 = `ในเกมปัจจุบัน อัตราการคืนเงินตามทฤษฎีระยะยาวโดยรวม (RTP) สำหรับผู้เล่นคือ 97.52%.`;

text.history.History = `ประวัติ`;
text.history.time = `เวลา`;
text.history.bet = `เดิมพัน`;
text.history.type = `ประเภท`;
text.history.line = `เส้น`;
text.history.count = `นับ`;
text.history.win = `ชนะ`;
text.history.round = `รอบ:`;
