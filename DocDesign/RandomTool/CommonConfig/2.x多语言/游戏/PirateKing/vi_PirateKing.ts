import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.vi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `TRẢ THƯỞNG`;
text.game.path2 = `AUTO`;
text.game.path4 = `TỐC ĐỘ`;
text.game.path34 = `Các giá trị hiển thị trên trang này thể hiện phần thưởng có thể được trao ở tổng cược 20.`;
text.game.path35 = `WILD có thể thay thế bất kỳ biểu tượng nào trong trò chơi ngoại trừ vòng quay.`;
text.game.path36 = `vòng quay chỉ đếm số trên màn hình. Nó không có liên quan đến các dòng. Nếu xuất hiện 3 SPIN trở lên trên màn hình, người chơi sẽ ngẫu nhiên nhận được JACKPOT.`;
text.game.path37 = `Đường thanh toán`;
text.game.path38 = `Cài đặt`;
text.game.path39 = `Âm thanh`;
text.game.path58 = `LUẬT CHƠI`;
text.game.path59 = `Trong trò chơi hiện tại, tỷ lệ hoàn trả lý thuyết dài hạn tổng thể cho người chơi (RTP) là 97.52%.`;

text.history.History = `LỊCH SỬ`;
text.history.time = `Thời gian`;
text.history.bet = `Cược`;
text.history.type = `Loại`;
text.history.line = `Dòng`;
text.history.count = `Số lượng`;
text.history.win = `Thắng`;
text.history.round = `Vòng:`;
