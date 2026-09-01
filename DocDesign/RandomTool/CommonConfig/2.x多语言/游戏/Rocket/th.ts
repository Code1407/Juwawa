import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.th;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "จรวด";		
text.game.hisLabel = "ของเขา:";		
text.game.label = "ทั้งหมด";		
text.game.cashoutNumDes1 = "เอสซีอัตโนมัติ";		
text.game.cashoutNumDes2 = "เอสซีอัตโนมัติ";		
text.game.cashoutNumDes3 = "เอสซีอัตโนมัติ";		
text.game.waitfornextround1 = "รอรอบต่อไป";		
text.game.waitfornextround2 = "รอรอบต่อไป";		
text.game.waitfornextround3 = "รอรอบต่อไป";		
text.game.escape1 = "หนี";		
text.game.escape2 = "หนี";		
text.game.escape3 = "หนี";		
text.game.joinNow = "เข้าร่วมตอนนี้!";		
text.game.youHeight = "ความสูงในการหลบหนีของคุณ:";		
text.game.youReward = "รับรางวัล:";		
text.game.PersistentEfforts = "ความพยายามที่ไม่ลดละ!!";		
		
		
text.help.title = "คำแนะนำ";		
text.help.content =		
`1. ทำการเดิมพันของคุณก่อนที่จะตัดสินใจf.		
2. รับความเสี่ยงและรอให้โอกาสดีขึ้น		
3. หลบหนีก่อนที่จรวดจะระเบิด!		
4. จุดระเบิดอยู่ที่ 1.00x ถึง 10,000x		
5. จุดหลบหนีที่ต่ำที่สุดอยู่ที่ @1.01x		
6. หากผู้เล่นออกจากเกมปัจจุบัน จะถือว่าเป็นการออกจากเกมและการเดิมพันอัตโนมัติจะถูกยกเลิก		
7. โปรดทราบ: ขึ้นอยู่กับการเชื่อมต่อเครือข่ายของคุณ จุดหลบหนีสุดท้ายอาจจะสูงกว่าความสูงเมื่อคลิก ซึ่งอาจส่งผลให้หลบหนีไม่สำเร็จก่อนเกิดการระเบิดได้		`

text.help.addContent = `8.ในเกมปัจจุบัน อัตราการคืนเงินตามทฤษฎีเกมระยะยาว (RTP) โดยรวมของผู้เล่นคือ 97.52%.`
		
text.ready.content1 = "นับถอยหลัง"		
text.ready.content2 = "การเตรียมพร้อม!"		
		
text.inpuView.content3 = "ดี"		
text.inpuView.content4 = "ใหญ่ที่สุด"		
text.inpuView.content5 = "เล็กที่สุด"		
		
		
text.quitView.content = "จรวดกำลังทะยานขึ้น คุณต้องการออกโดยไม่ต้องจ่ายเงินใช่ไหม?";		
text.quitView.confirm = "ยืนยัน";		
text.quitView.cancel = "ยกเลิก";		
		
text.myRecord.content = "บันทึกการเดิมพัน"		
text.myRecord.nodata = "ไม่มีข้อมูล";		
		
text.gameHistory.content1 = "จุดระเบิด";		
text.gameHistory.content2 = "สถิติจุดระเบิด:";		
text.gameHistory.content3 = "ความสูง";		
text.gameHistory.content4 = "10 รอบสุดท้าย";		
text.gameHistory.content5 = "20 รอบสุดท้าย";		
text.gameHistory.content6 = "30 รอบสุดท้าย";		
text.gameHistory.content7 = "50 รอบสุดท้าย";		
text.gameHistory.content8 = "100 รอบสุดท้าย";		

text.disconnectCash.content = `เครือข่ายถูกตัดการเชื่อมต่อและคุณได้หลบหนีโดยอัตโนมัติ
หมายเหตุ: โปรดเปิดเครือข่ายไว้เพื่อหลบหนีให้สำเร็จ!`;
text.disconnectCash.reconnect = "เชื่อมต่อใหม่";
text.disconnectCash.exit = "ออก";
		
codeText.betView.alreadybet = "เดิมพันแล้ว!";		
codeText.betView.bet = "เดิมพัน!"		
codeText.betView.holdtoauto = "ถือไว้อัตโนมัติ"		
codeText.betView.cancelauto = 'หยุดอัตโนมัติ'		
codeText.betView.betnext = "เดิมพันต่อไป"		
codeText.betView.automodel = "เดิมพันอัตโนมัติ"		
codeText.betView.cancel = "ยกเลิก"		
codeText.betView.cancelnext = "ยกเลิกต่อไป"		
codeText.betView.escape = "หนี"		
codeText.betView.escape2 = "หนี"	
codeText.betView.escape3 = "ไม่ได้หนี."	
codeText.betView.cancelbet = "ยกเลิกการเดิมพัน"		
codeText.betView.betnext2 = "เดิมพันต่อไป+"		
codeText.betView.exploded = "ระเบิด"		
codeText.betView.maxBetLimit = "เกินขีดจำกัด"		
		
codeText.globalContent.flightheight = "ความสูงของเที่ยวบิน"		
codeText.globalContent.vacancy = "ว่าง"		
codeText.globalContent.rocket = "จรวด"		
codeText.globalContent.inputContent1 = "ขีดจำกัด:100.00-50,000.00"		
codeText.globalContent.inputContent2 = "ใส่จำนวนเงิน:"		
codeText.globalContent.inputContent3 = "ความสูงหนี:1.01-100.00"		
codeText.globalContent.inputContent4 = "เข้าสู่จุดหลบหนีกด:"		
codeText.globalContent.round =  "รอบ: "				
