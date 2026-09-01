import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `BAYARAN`;
text.game.path2 = `AUTO`;
text.game.path4 = `KECEPATAN`;
text.game.path34 = `Nilai yang ditampilkan di halaman ini mewakili hadiah yang mungkin diberikan pada total taruhan 20.`;
text.game.path35 = `WILD dapat menggantikan ikon apa pun di dalam game kecuali putaran.`;
text.game.path36 = `putaran hanya menghitung jumlahnya di layar. Tidak ada hubungannya dengan garis. Jika 3 atau lebih SPIN muncul di layar, pemain akan mendapatkan JACKPOT secara acak.`;
text.game.path37 = `Garis pembayaran`;
text.game.path38 = `Pengaturan`;
text.game.path39 = `Suara`;
text.game.path58 = `Aturan`;
text.game.path59 = `Dalam game saat ini, tingkat pengembalian teoritis permainan jangka panjang (RTP) secara keseluruhan untuk pemain adalah 97.52%.`;

text.history.History = `RIWAYAT`;
text.history.time = `Waktu`;
text.history.bet = `Taruhan`;
text.history.type = `Jenis`;
text.history.line = `Garis`;
text.history.count = `Jumlah`;
text.history.win = `Menang`;
text.history.round = `Putaran:`;
