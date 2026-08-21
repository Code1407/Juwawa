import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;




text.game.autoPlay= `Otomatik
Beta
Özel`;
text.game.stopAuto =`Otomatik
Beta
Özel`;
text.game.players = "Oyuncular";
text.game.balance = "Bakiye :";
text.game.todayRound = "Tur:";
text.game.totalCost = "Toplam Maliyet:";
text.game.myTotalCost = "Benim Toplam Maliyetim:";
text.game.finalRoundResult = "Tur:";
text.game.finalRoundWin = "Kazandın: ";
text.game.finalRoundCost = "Bu Turun Maliyeti: ";
text.game.finalRoundRankTitle = "Bu turun ilk kazananları";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Benim:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Benim:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Benim:";

text.ready.content = "Hazır Olma Süresi";
text.gameHistory.title = "Oyun Geçmişi";

text.help.title = "Kural";
text.help.content = 
`1. Çekilişten önce yanacak takımı tahmin edin.

2. Çekilişten sonra yanan takım kazanan takımdır.

3. Tahmininiz doğruysa, ilgili oranlara göre ödül alırsınız.`

text.betLimit.content = "Her turda yalnızca 500.000'den fazla harcama yapamazsınız!";

codeText.pokerLevel.highCard = "Yüksek kart"
codeText.pokerLevel.pair = "Çift";
codeText.pokerLevel.straight = "Düz";
codeText.pokerLevel.flush = "Rengi";
codeText.pokerLevel.straightFlush = "Düz Rengi";
codeText.pokerLevel.fullHouse = "Üç bir araya";
codeText.globalContent.round =  "tur: "

text.history.title = "Geçmişim";
text.history.columnName1 = "Maliyet Süresi";
text.history.columnName2 = "Maliyet Detayları";
text.history.columnName3 = "Ödül Detayları";
text.history.round = "Tur:";
