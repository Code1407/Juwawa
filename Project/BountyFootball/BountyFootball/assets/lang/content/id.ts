import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;




text.game.autoPlay= `Otomatis
Beta
Khusus`;
text.game.stopAuto =`Otomatis
Beta
Khusus`;
text.game.players = "Pemain";
text.game.balance = "Saldo :";
text.game.todayRound = "Putaran:";
text.game.totalCost = "Total Biaya:";
text.game.myTotalCost = "Total Biaya Saya:";
text.game.finalRoundResult = "Putaran:";
text.game.finalRoundWin = "Anda Menang: ";
text.game.finalRoundCost = "Biaya Putaran Ini: ";
text.game.finalRoundRankTitle = "Pemenang teratas putaran ini";
text.game.card1Pot = "Pot:";
text.game.card1Mine = "Saya:";
text.game.card2Pot = "Pot:";
text.game.card2Mine = "Saya:";
text.game.card3Pot = "Pot:";
text.game.card3Mine = "Saya:";

text.ready.content = "Waktu Siap";
text.gameHistory.title = "Riwayat Permainan";

text.help.title = "Aturan";
text.help.content = 
`1. Prediksikan tim yang akan menyala sebelum undian.

2. Tim yang menyala setelah undian adalah tim pemenang.

3. Jika prediksi Anda benar, Anda akan menerima hadiah berdasarkan peluang yang sesuai.`

text.betLimit.content = "Anda hanya dapat menghabiskan tidak lebih dari 500.000 per putaran!";

codeText.pokerLevel.highCard = "Kartu tinggi"
codeText.pokerLevel.pair = "Pasangan";
codeText.pokerLevel.straight = "Lurus";
codeText.pokerLevel.flush = "Siram";
codeText.pokerLevel.straightFlush = "Lurus Siram";
codeText.pokerLevel.fullHouse = "Tiga sejenis";
codeText.globalContent.round =  "putaran: "

text.history.title = "Riwayat Saya";
text.history.columnName1 = "Waktu Biaya";
text.history.columnName2 = "Detail Biaya";
text.history.columnName3 = "Detail Hadiah";
text.history.round = "Putaran:";
