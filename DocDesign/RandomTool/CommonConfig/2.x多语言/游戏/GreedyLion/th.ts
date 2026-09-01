import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.th;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=				
`เล่นอัตโนมัติ`;				
text.game.stopAuto =				
`หยุดอัตโนมัติ`;				
text.game.result = "ผล";				
text.game.mine = "สถิติของฉัน";				
text.game.todayWin =				
`รายได้วันนี้`;				
text.game.todayRank =				
`อันดับวันนี้`;				
text.game.round = "รอบ:";				
text.game.salad = "สลัด";				
text.game.pizza = "พิซซ่า";				
text.game.selectTime = "เลือกเวลา";				
				
text.help.title = "กฎ";				
text.help.content =				
`				
1. เลือกจำนวนเงินที่คุณต้องการใช้จ่ายและเลือกอาหารที่จะใช้จ่าย
2. ผลการแข่งขันจะประกาศหลังจากสิ้นสุดระยะเวลาการใช้จ่าย
3. หากผลการแข่งขันตรงกับอาหารที่คุณเลือก คุณจะได้รับรางวัลตามจำนวนเงินที่ใช้จ่าย
4. เงินรางวัลรวมจะเพิ่มขึ้นเมื่อมีผู้เข้าร่วมเกมมากขึ้น และจะมีโอกาสได้รับรางวัล "พิซซ่า" หรือ "สลัด" เมื่อเงินรางวัลรวมถึงจำนวนที่กำหนด
5. หากประกาศรางวัล "สลัด" คุณจะได้รับผักทุกชนิด
6. หากประกาศรางวัล "พิซซ่า" คุณจะได้รับเนื้อสัตว์ทุกชนิด				
`				
				
text.rank.title = "อันดับรายได้ของวันนี้";				
text.rank.column_Ranking = "อันดับ";				
text.rank.column_Profile = "โปรไฟล์";				
text.rank.column_Name = "ชื่อ";				
text.rank.column_Revenue = "รายได้";				
				
text.myHistory.title = "สถิติของฉัน";				
text.myHistory.column_Time = "เวลาเล่น";				
text.myHistory.column_Details = "รายละเอียดการเล่น";				
text.myHistory.column_Result = "ผล";				
//text.myHistory.column_Revenue = "รายได้";				
text.myHistory.round = "รอบ:"				
				
text.exceed.content = "ขออภัย คุณไม่สามารถเดิมพันมากกว่า 6 ตัวเลือกในแต่ละรอบเกม";				
text.exceed.confirm = "ยืนยัน";				

text.setting.title = "ตั้งค่า";				
text.setting.sound = "เสียง";				
text.setting.on = "เปิด";				
text.setting.off = "ปิด";				
				
text.roundFinal.thisRoundBets = " การเดิมพันรอบนี้: ";				
text.roundFinal.thisRoundRanking = "อันดับรอบนี้: ";				
text.roundFinal.thisRoundEarnings = "รายได้รอบนี้: ";				
text.roundFinal.roundNumber = function roundResult(x: number): string {				
return `ผลของรอบ ${x}:`;				
};				