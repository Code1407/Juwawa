import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.vi;

let text = textsMap[lang] = new Path();

text.path0 = `Xếp hạng`;
text.path1 = `Người chơi`;
text.path2 = `Điểm số`;
text.path3 = `Phần thưởng`;
text.path7 = `Luật`;
text.path8 = `1. Mỗi người chơi đặt cược sẽ nhận được điểm trên bảng xếp hạng dựa trên số tiền đặt cược và sẽ được nhận phần thưởng tương ứng với số điểm đạt được;

2. 10 người chơi đứng đầu trong ngày có thể nhận phần thưởng bảng xếp hạng hàng ngày sau 24:00;

3. 10 người chơi đứng đầu trong tuần có thể nhận phần thưởng bảng xếp hạng hàng tuần sau 24:00 ngày thứ Bảy;

4. Lưu ý: Bảng xếp hạng bắt đầu từ Chủ nhật và kết thúc vào thứ Bảy. Phần thưởng phải được nhận trong vòng 24 giờ kể từ khi kết thúc thời gian xếp hạng tương ứng; phần thưởng sẽ hết hạn sau thời gian này.`;
text.path9 = `Đang tải...`;
text.path10 = `Xếp hạng`;
text.path11 = `Xác nhận`;
text.path12 = `Chúc mừng bạn đã kết thúc ở vị trí {0} trong Giải đấu và nhận được phần thưởng {1}`;