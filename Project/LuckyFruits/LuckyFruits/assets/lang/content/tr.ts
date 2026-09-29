import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";

const lang = ELang.tr;

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
text.game.todayRound = "Tur:";

text.ready.content = "Hazırlık Süresi";
text.gameHistory.title = "Oyun Geçmişi";
text.myHistory.title = "Geçmişim";
text.myHistory.date = "Tarih";
text.myHistory.betDetail = "Bahis Detayı";
text.myHistory.result = "Sonuç";
text.myHistory.revenue = "Kazanç";
text.rewarding.content = "Ödül veriliyor, lütfen bekleyin!";

codeText.globalContent.round = "Tur: "
codeText.globalContent.betMaxLimit = "Tur başına en fazla {0} bahis yapabilirsiniz!";
text.help.title = "Oyun Kuralları";
text.help.content =
`
Varsayılan bahis seçenekleri ve meyve bonus çarpanları:
x3 Büyük Elma
x6 Büyük Muz
x8 Büyük Limon
x12 Büyük Karpuz
x30 BAR

"x2" gösteren bir meyvede durursanız, çarpan iki katına çıkar.

Özel ödüller:
1. Gökkuşağı Şansı (iki mod)
- Üst yarım dairedeki her ödül bir kez kazanır.
- Elma Zamanı: Elma kazanana kadar oyun devam eder.

2. Sarı Şans (iki mod)
- Alt yarım dairedeki her ödül bir kez kazanır.
- Tüm meyveler bir kez kazanır.

Not: Her iki Şans modu da ödül verilmeyen "Kötü Şans Zamanı"na girebilir.
`
