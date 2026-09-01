import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.vi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""


text.game.TitleLabel= "TÊN LỬA";
text.game.hisLabel = "của anh ấy:";
text.game.label = "TẤT CẢ";
text.game.cashoutNumDes1 = "thoát tự động";
text.game.cashoutNumDes2 = "thoát tự động";
text.game.cashoutNumDes3 = "thoát tự động";
text.game.waitfornextround1 = "chờ vòng tiếp theo";
text.game.waitfornextround2 = "chờ vòng tiếp theo";
text.game.waitfornextround3 = "chờ vòng tiếp theo";
text.game.escape1 = "THOÁT";
text.game.escape2 = "THOÁT";
text.game.escape3 = "THOÁT";
text.game.joinNow = "Tham gia ngay!";
text.game.youHeight = "Độ cao thoát của bạn:";
text.game.youReward = "Nhận phần thưởng:";
text.game.PersistentEfforts = "Nỗ lực không ngừng!!";


text.help.title = "Hướng dẫn";
text.help.content =
`1. Hãy đặt cược trước khi cất cánh.
2. Hãy chấp nhận rủi ro và chờ đợi tỷ lệ tốt hơn.
3. Thoát trước khi tên lửa phát nổ!
4. Điểm nổ là từ @ 1.00x đến 10,000x.
5. Điểm thoát thấp nhất là @1.01x.
6. Nếu một người chơi rời khỏi trò chơi hiện tại, điều đó sẽ được coi là thoát và cược tự động sẽ bị hủy.
7. Xin lưu ý: Tùy thuộc vào kết nối mạng của bạn, điểm thoát cuối cùng có thể cao hơn độ cao khi nhấp vào, điều này cũng có thể dẫn đến việc thoát không thành công trước khi vụ nổ xảy ra.`

text.help.addContent = `8.Trong trò chơi hiện tại, tỷ lệ hoàn trả lý thuyết dài hạn (RTP) tổng thể cho người chơi là 97.52%.`

text.ready.content1 = "đếm ngược"
text.ready.content2 = "CHUẨN BỊ!"

text.inpuView.content3 = "OK"
text.inpuView.content4 = "tối đa"
text.inpuView.content5 = "tối thiểu"


text.quitView.content = "Tên lửa đang cất cánh, bạn có muốn thoát mà không rút tiền không?";
text.quitView.confirm = "Xác nhận";
text.quitView.cancel = "Hủy";

text.myRecord.content = "LỊCH SỬ CƯỢC"
text.myRecord.nodata = "không có dữ liệu";

text.gameHistory.content1 = "Điểm nổ";
text.gameHistory.content2 = "Thống kê điểm nổ:";
text.gameHistory.content3 = "độ cao";
text.gameHistory.content4 = "10 vòng gần nhất";
text.gameHistory.content5 = "20 vòng gần nhất";
text.gameHistory.content6 = "30 vòng gần nhất";
text.gameHistory.content7 = "50 vòng gần nhất";
text.gameHistory.content8 = "100 vòng gần nhất";

text.disconnectCash.content = `Mạng bị ngắt kết nối và bạn đã tự động thoát.
LƯU Ý: Vui lòng giữ MẠNG MỞ để thoát thành công!`;
text.disconnectCash.reconnect = "Kết nối lại";
text.disconnectCash.exit = "Thoát";

codeText.betView.alreadybet = "Đã đặt cược!";
codeText.betView.bet = "CƯỢC"
codeText.betView.holdtoauto = "giữ để tự động"
codeText.betView.cancelauto = 'DỪNG TỰ ĐỘNG'
codeText.betView.betnext = "CƯỢC TIẾP"
codeText.betView.automodel = "TỰ ĐỘNG CƯỢC"
codeText.betView.cancel = "HỦY"
codeText.betView.cancelnext = "Hủy tiếp theo"
codeText.betView.escape = "THOÁT"
codeText.betView.escape2 = "thoát"
codeText.betView.escape3 = "Chưa thoát"
codeText.betView.cancelbet = "Hủy cược"
codeText.betView.betnext2 = "Cược tiếp+"
codeText.betView.exploded = "đã nổ"
codeText.betView.maxBetLimit = "Vượt giới hạn"

codeText.globalContent.flightheight = "Độ cao bay"
codeText.globalContent.vacancy = "trống"
codeText.globalContent.rocket = "TÊN LỬA"
codeText.globalContent.inputContent1 = "Giới hạn:100.00-50,000.00"
codeText.globalContent.inputContent2 = "Nhập số tiền:"
codeText.globalContent.inputContent3 = "Độ cao thoát:1.01-100.00"
codeText.globalContent.inputContent4 = "Nhập điểm thoát:"
codeText.globalContent.round =  "vòng: "
