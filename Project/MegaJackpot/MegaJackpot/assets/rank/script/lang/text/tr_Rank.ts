import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.tr;

let text = textsMap[lang] = new Path();

text.path0 = `Sıralama`;
text.path1 = `Oyuncu`;
text.path2 = `Skor`;
text.path3 = `Ödül`;
text.path7 = `Kurallar`;
text.path8 = `1. Bahis yapan her oyuncu, bahis miktarına göre sıralama puanı alacak ve puanlarına göre ödüller kazanacaktır;

2. Günün en iyi 10 oyuncusu, günlük sıralama ödüllerini saat 24:00'ten sonra alabilir;

3. Haftanın en iyi 10 oyuncusu, haftalık sıralama ödüllerini Cumartesi günü saat 24:00'ten sonra alabilir;

4. Uyarı: Liste Pazar günü başlar ve Cumartesi günü sona erer. Ödüller, ilgili sıralama döneminin bitiminden itibaren 24 saat içinde alınmalıdır; ödüller bu süreden sonra geçerliliğini yitirir.`;
text.path9 = `Yükleniyor...`;
text.path10 = `Sıralama`;
text.path11 = `Onayla`;
text.path12 = `Ligde {0}. sıraya ulaştığınız ve {1} bonusu aldığınız için tebrikler!`;