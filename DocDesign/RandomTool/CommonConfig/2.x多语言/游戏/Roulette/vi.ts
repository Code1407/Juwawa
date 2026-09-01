import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.vi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "CHƠI LẠI";
text.game.new = "Mới >"
text.game.gameStart = "Bắt đầu trò chơi";
text.game.starting = "Đang bắt đầu";
text.game.round = "Vòng:";
text.game.gainedCoins = "Xu nhận được:";
text.gameRecord.title1 = "Lịch sử trò chơi";
text.gameRecord.title2 = "Lịch sử của tôi";
text.gameRecord.nodata = "không có dữ liệu";
text.gameRecord.rule = "Chỉ hiển thị trong 7 ngày, tối đa 100 bản ghi mỗi ngày";
text.gameRecord.new = "MỚI";

text.help.title = "Luật chơi";
text.help.content =
`Roulette là một trò chơi vui nhộn và hấp dẫn.

1. Số: 0 (thưởng gấp 36 lần), 1-12 (thưởng gấp 3 lần), 13-24 (thưởng gấp 3 lần), 25-36 (thưởng gấp 3 lần);

2. Màu sắc: đỏ (thưởng 2x), đen (thưởng 2x);

3. Chẵn lẻ: lẻ (thưởng 2x), chẵn nhưng không bao gồm 0 (thưởng 2x).

Chúc bạn chơi game vui vẻ!`
text.help.reward = "Đang trả thưởng, vui lòng chờ!";
text.help.wait = "Vui lòng đợi vòng tiếp theo";

codeText.globalContent.Time = "Thời gian"
codeText.globalContent.bet = "đặt cược";
codeText.globalContent.get = "nhận";
codeText.globalContent.win = "thắng";
