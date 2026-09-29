import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.vn;

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
text.game.players = "người chơi";
text.game.card1Pot = "Quỹ:";
text.game.card1Mine = "Của tôi:";
text.game.card2Pot = "Quỹ:";
text.game.card2Mine = "Của tôi:";
text.game.card3Pot = "Quỹ:";
text.game.card3Mine = "Của tôi:";
text.game.todayRound = "Vòng:";

text.ready.content = "Thời gian chuẩn bị";
text.gameHistory.title = "Lịch sử trò chơi";
text.myHistory.title = "Lịch sử của tôi";
text.myHistory.date = "Ngày";
text.myHistory.betDetail = "Chi tiết cược";
text.myHistory.result = "Kết quả";
text.myHistory.revenue = "Doanh thu";

text.help.title = "Luật chơi";
text.help.content =
`
Các tùy chọn cược mặc định và hệ số thưởng trái cây là:
x3 Táo lớn
x6 Chuối lớn
x8 Chanh lớn
x12 Dưa hấu lớn
x30 BAR

Nếu bạn dừng ở trái cây hiển thị "x2", hệ số sẽ được nhân đôi.

Phần thưởng đặc biệt:
1. May mắn Cầu vồng (hai chế độ)
- Mỗi phần thưởng ở nửa vòng tròn phía trên thắng một lần.
- Thời gian Táo: trò chơi tiếp tục cho đến khi Táo thắng.

2. May mắn Vàng (hai chế độ)
- Mỗi phần thưởng ở nửa vòng tròn phía dưới thắng một lần.
- Tất cả trái cây thắng một lần.

Lưu ý: Cả hai chế độ May mắn đều có thể bước vào "Thời gian Xui xẻo", trong thời gian này sẽ không có phần thưởng.
`

text.rewarding.content = "Đang trả thưởng, vui lòng chờ!";

codeText.globalContent.round = "Vòng: "
codeText.globalContent.betMaxLimit = "Bạn chỉ có thể đặt cược không quá {0} mỗi vòng!";
