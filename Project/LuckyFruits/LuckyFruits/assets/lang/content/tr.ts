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
text.game.todayRound = "Tur:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "Geçmişim";
text.myHistory.date = "Tarih";
text.myHistory.betDetail = "Bahis Detayı";
text.myHistory.result = "Sonuç";
text.myHistory.revenue = "Kazanç";

text.help.title = "Oyun Kuralları";
text.help.content =
`
Her meyve sembolünün iki olası sonucu vardır. Kazanan sembolün altında "x2" görünürse ödül, gösterilen çarpana göre hesaplanır; aksi durumda varsayılan ödeme oranı uygulanır.

x2 Elma
x2 Muz
x2 Limon
x2 Karpuz

Varsayılan meyve ödemeleri
x3 Büyük Elma
x6 Büyük Muz
x8 Büyük Limon
x12 Büyük Karpuz
x30 BAR

Özel ödüller:
1. Gökkuşağı Şansı (iki mod)
- Üst yarım dairedeki her ödül bir kez kazanır.
- Elma Zamanı: Elma kazanana kadar oyun devam eder.

2. Sarı Şans (iki mod)
- Alt yarım dairedeki her ödül bir kez kazanır.
- Tüm meyveler bir kez kazanır.

Not: Her iki Şans modu da ödül verilmeyen "Kötü Şans Zamanı"na girebilir.
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "Tur: "
