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
text.game.stopAuto =`Stop
内测
专用`;
text.game.todayRound = "Putaran:";

text.ready.content = "Waktu persiapan";
text.gameHistory.title = "Riwayat Permainan";
text.myHistory.title = "Riwayat Saya";
text.myHistory.date = "Tanggal";
text.myHistory.betDetail = "Detail Taruhan";
text.myHistory.result = "Hasil";
text.myHistory.revenue = "Pendapatan";
text.rewarding.content = "Sedang memberikan hadiah, mohon tunggu!";

codeText.globalContent.round = "Putaran: "
codeText.globalContent.betMaxLimit = "Anda hanya bisa bertaruh maksimal {0} per putaran!";
text.help.title = "Aturan Permainan";
text.help.content =
`
Opsi taruhan default dan pengali bonus buah adalah:
x3 Apel Besar
x6 Pisang Besar
x8 Lemon Besar
x12 Semangka Besar
x30 BAR

Jika Anda mendarat di buah yang menampilkan "x2", pengali akan digandakan.

Hadiah khusus:
1. Rainbow Luck (dua mode)
- Setiap hadiah di setengah lingkaran atas menang satu kali.
- Apple Time: permainan berlanjut sampai Apel menang.

2. Yellow Luck (dua mode)
- Setiap hadiah di setengah lingkaran bawah menang satu kali.
- Semua buah menang satu kali.

Catatan: Kedua mode Luck dapat memasuki "Bad Luck Time", dan tidak ada hadiah yang diberikan selama periode tersebut.
`
