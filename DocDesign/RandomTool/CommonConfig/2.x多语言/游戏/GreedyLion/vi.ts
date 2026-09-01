import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.vi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay=			
`Tự động chơi`;			
text.game.stopAuto =			
`Dừng tự động`;			
text.game.result = "kết quả";			
text.game.mine = "Lịch sử";			
text.game.todayWin =			
`Doanh thu hôm nay:`;			
text.game.todayRank =			
`Hạng hôm nay`;			
text.game.round = "vòng:";			
text.game.salad = "salad";			
text.game.pizza = "pizza";			
text.game.selectTime = "Chọn Thời Gian";			
			
text.help.title = "Luật Chơi";			
text.help.content =			
`			
1. Chọn số tiền bạn muốn chi và chọn món ăn để tính giá;
2. Kết quả sẽ được công bố sau khi thời gian tính giá kết thúc;
3. Nếu kết quả trùng khớp với món ăn bạn đã chọn, bạn sẽ nhận được phần thưởng tương ứng với số tiền bạn đã chi;
4. Tổng giải thưởng sẽ tăng lên khi có nhiều người chơi tham gia, sẽ có cơ hội nhận được phần thưởng "PIZZA" hoặc "SALAD" khi tổng giải thưởng đạt đến một mức nhất định;
5. Nếu kết quả là "SALAD", bạn sẽ nhận được phần thưởng là tất cả các loại rau;
6. Nếu kết quả là "PIZZA", bạn sẽ nhận được phần thưởng là tất cả các loại thịt.			
`	

			
text.rank.title = "XH doanh thu ngày nay";			
text.rank.column_Ranking = "Xếp hạng";			
text.rank.column_Profile = "Hồ Sơ";			
text.rank.column_Name = "Tên";			
text.rank.column_Revenue = "Doanh thu";			
			
text.myHistory.title = "Lịch sử";			
text.myHistory.column_Time = "Thời Gian Chơi";			
text.myHistory.column_Details = "Chi tiết";			
text.myHistory.column_Result = "Kết Quả";			
//text.myHistory.column_Revenue = "Doanh thu";			
text.myHistory.round = "Vòng:"			
			
text.exceed.content = "Xin lỗi, bạn không thể đặt cược cho hơn 6 lựa chọn trong mỗi vòng chơi.";			
text.exceed.confirm = "Xác Nhận";			

text.setting.title = "Cài đặt";			
text.setting.sound = "Âm Thanh";			
text.setting.on = "Bật";			
text.setting.off = "Tắt";			
			
text.roundFinal.thisRoundBets = " Vòng cược này: ";			
text.roundFinal.thisRoundRanking = "Xếp hạng vòng này: ";			
text.roundFinal.thisRoundEarnings = "Thu nhập vòng này: ";			
text.roundFinal.roundNumber = function roundResult(x: number): string {			
return `Kết quả Vòng ${x}:`;			
};			