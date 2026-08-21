import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.vn;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;




text.game.autoPlay= `Tự động
Beta
Đặc biệt`;
text.game.stopAuto =`Tự động
Beta
Đặc biệt`;
text.game.players = "Người chơi";
text.game.balance = "Số dư :";
text.game.todayRound = "Vòng:";
text.game.totalCost = "Tổng chi phí:";
text.game.myTotalCost = "Tổng chi phí của tôi:";
text.game.finalRoundResult = "Vòng:";
text.game.finalRoundWin = "Bạn thắng: ";
text.game.finalRoundCost = "Chi phí vòng này: ";
text.game.finalRoundRankTitle = "Những người chiến thắng hàng đầu của vòng này";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Của tôi:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Của tôi:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Của tôi:";

text.ready.content = "Thời gian sẵn sàng";
text.gameHistory.title = "Lịch sử trò chơi";

text.help.title = "Quy tắc";
text.help.content = 
`1. Dự đoán đội nào sẽ được chiếu sáng trước khi rút thăm.

2. Đội được chiếu sáng sau khi rút thăm là đội chiến thắng.

3. Nếu dự đoán của bạn là chính xác, bạn sẽ nhận được phần thưởng dựa trên tỷ lệ tương ứng.`

text.betLimit.content = "Bạn chỉ có thể chi tiêu không quá 500.000 mỗi vòng!";

codeText.pokerLevel.highCard = "Lá cao"
codeText.pokerLevel.pair = "Đôi";
codeText.pokerLevel.straight = "Sảnh";
codeText.pokerLevel.flush = "Đồng chất";
codeText.pokerLevel.straightFlush = "Sảnh đồng chất";
codeText.pokerLevel.fullHouse = "Ba lá cùng loại";
codeText.globalContent.round =  "vòng: "

text.history.title = "Lịch sử của tôi";
text.history.columnName1 = "Thời gian chi phí";
text.history.columnName2 = "Chi phí chi tiết";
text.history.columnName3 = "Chi tiết phần thưởng";
text.history.round = "Vòng:";
