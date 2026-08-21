import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.vi;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `AUTO`;
text.game.stopAuto= `AUTO`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "lines";
text.game.total = "TOTAL";

text.help.title = "Rule";
text.help.gameRule = "Game Rules:";
text.help.SpecialSymbols = "biểu tượng đặc biệt";
text.help.content =
`1. Có 7 biểu tượng thông thường và 30 dòng thanh toán trong trò chơi ;
2. Bạn giành được phần thưởng cơ bản khi các cuộn phim ngừng quay và 3 biểu tượng đầu tiên từ trái sang phải sẽ xuất hiện trên dòng thanh toán được kích hoạt;
3. Mỗi dòng thanh toán được tính riêng, kích hoạt càng nhiều dòng thanh toán, bạn càng giành được nhiều phần thưởng;
4. Mỗi biểu tượng có hệ số tiền thưởng khác nhau, Tiền thưởng = Số tiền đặt cược *Hệ số tiền thưởng, xem bên dưới để biết chi tiết:`
text.help.wildContent = "Nó có thể thay thế cho tất cả các biểu tượng khác ngoại trừ biểu tượng tiền thưởng và biểu tượng phân tán.";
text.help.freeContent = "Khi xuất hiện 3 vòng quay trở lên, bạn sẽ nhận được nhiều vòng quay miễn phí.";
text.help.jackpotContent = "Khi có 3 hoặc nhiều hơn xuất hiện, bạn sẽ trúng giải độc đắc.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>lần";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>lần ";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>lần";

text.setting.title = "Cài đặt ";
text.setting.sound = "Âm thanh";