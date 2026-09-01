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
text.game.todayRound = "Vòng:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "Lịch sử của tôi";
text.myHistory.date = "Ngày";
text.myHistory.betDetail = "Chi tiết cược";
text.myHistory.result = "Kết quả";
text.myHistory.revenue = "Doanh thu";

text.help.title = "Luật chơi";
text.help.content =
`
Mỗi biểu tượng trái cây có hai khả năng. Nếu "x2" xuất hiện dưới biểu tượng chiến thắng, phần thưởng được tính theo hệ số hiển thị; nếu không, mức trả thưởng mặc định sẽ được áp dụng.

x2 Táo
x2 Chuối
x2 Chanh
x2 Dưa hấu

Mức trả thưởng mặc định của trái cây
x3 Táo lớn
x6 Chuối lớn
x8 Chanh lớn
x12 Dưa hấu lớn
x30 BAR

Phần thưởng đặc biệt:
1. May mắn Cầu vồng (hai chế độ)
- Mỗi phần thưởng ở nửa vòng tròn phía trên thắng một lần.
- Thời gian Táo: trò chơi tiếp tục cho đến khi Táo thắng.

2. May mắn Vàng (hai chế độ)
- Mỗi phần thưởng ở nửa vòng tròn phía dưới thắng một lần.
- Tất cả trái cây thắng một lần.

Lưu ý: Cả hai chế độ May mắn đều có thể bước vào "Thời gian Xui xẻo", trong thời gian này sẽ không có phần thưởng.
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "Vòng: "
