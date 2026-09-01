import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.id;

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
text.game.todayRound = "Putaran:";

text.ready.content = "Ready Time";
text.gameHistory.title = "Game History";
text.myHistory.title = "Riwayat Saya";
text.myHistory.date = "Tanggal";
text.myHistory.betDetail = "Detail Taruhan";
text.myHistory.result = "Hasil";
text.myHistory.revenue = "Pendapatan";

text.help.title = "Aturan Permainan";
text.help.content =
`
Setiap simbol buah memiliki dua kemungkinan hasil. Jika "x2" muncul di bawah simbol pemenang, hadiah dihitung menggunakan pengali yang ditampilkan; jika tidak, tingkat pembayaran default berlaku.

x2 Apel
x2 Pisang
x2 Lemon
x2 Semangka

Pembayaran default buah
x3 Apel Besar
x6 Pisang Besar
x8 Lemon Besar
x12 Semangka Besar
x30 BAR

Hadiah khusus:
1. Rainbow Luck (dua mode)
- Setiap hadiah di setengah lingkaran atas menang satu kali.
- Apple Time: permainan berlanjut sampai Apel menang.

2. Yellow Luck (dua mode)
- Setiap hadiah di setengah lingkaran bawah menang satu kali.
- Semua buah menang satu kali.

Catatan: Kedua mode Luck dapat memasuki "Bad Luck Time", dan tidak ada hadiah yang diberikan selama periode tersebut.
`

text.betLimit.content = "You can only cost no more than 500,000 per round!";

codeText.pokerLevel.highCard = "high card"
codeText.pokerLevel.pair = "pair";
codeText.pokerLevel.straight = "straight";
codeText.pokerLevel.flush = "flush";
codeText.pokerLevel.straightFlush = "straight flush";
codeText.pokerLevel.fullHouse = "three of a king";
codeText.globalContent.round = "Putaran: "
