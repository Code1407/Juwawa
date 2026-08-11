import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.th;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay = `อัตโนมัติ`;
text.game.stopAuto = `อัตโนมัติ`;
text.game.linesLabe1 = `30`;
text.game.linesLabe2 = `ไลน์`;
text.game.total = `ทั้งหมด`;

text.help.title = `กฎ`;
text.help.gameRule = `กฎเกม:`;
text.help.SpecialSymbols = `สัญลักษณ์พิเศษ`;
text.help.content =
`1. มีสัญลักษณ์ปกติ 7 ตัวและ 30 เพย์ไลน์ที่นําเสนอในเกม
2. เมื่อวงล้อหยุดหมุนและสัญลักษณ์ 3 ตัวแรกจากซ้ายไปขวาลงบนเพย์ไลน์ที่เปิดใช้งาน คุณจะได้รับรางวัลพื้นฐาน
3. แต่ละเพย์ไลน์คํานวณแยกกัน ยิ่งคุณเปิดใช้งานเพย์ไลน์มากเท่าไหร่ คุณก็จะได้รับรางวัลแร่
4. ตัวคูณโบนัสของแต่ละสัญลักษณ์จะแตกต่างกัน การจ่ายเงินรางวัล = จํานวนเงินเดิมพัน x ตัวคูณโบนัส ดูรายละเอียดด้านล่าง:`
text.help.wildContent = `สามารถแทนที่สัญลักษณ์อื่น ๆ ทั้งหมด ยกเว้นสัญลักษณ์โบนัสและสัญลักษณ์กระจาย`;
text.help.freeContent = `เมื่อปรากฏตัว 3 คนขึ้นไป คุณจะได้รับฟรีสปินหลายครั้ง`;
text.help.jackpotContent = `เมื่อปรากฏตัว 3 คนขึ้นไป คุณจะชนะแจ็คพอต`;
text.help.freeTime3 = `x<สี=#00ff00>3</สี> = <สี=#00ff00>5</สี>ครั้ง`;
text.help.freeTime4 = `x<สี=#00ff00>4</สีr> = <สี=#00ff00>8</สี>ครั้ง`;
text.help.freeTime5 = `x<สี=#00ff00>5</สี> = <สี=#00ff00>12</สี>ครั้ง`;

text.setting.title = `ตั้งค่า`;
text.setting.sound = `เสียง`;