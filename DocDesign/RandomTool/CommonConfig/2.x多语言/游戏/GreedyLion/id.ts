import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= 
`Taruhan
otomatis`;
text.game.stopAuto = 
`Hentikan 
otomatis`;
text.game.result = "hasil";
text.game.mine = "Riwayat Saya";
text.game.todayWin = 
`Pendapatan
Hari ini:`;
text.game.todayRank = 
`Peringkat
Hari ini`;
text.game.round = "ronde:";
text.game.salad = "SALAD";
text.game.pizza = "PIZZA";
text.game.selectTime = "Pilih Waktu";

text.help.title = "Aturan Permainan";
text.help.content = 
`1. Pilih jumlah biaya Anda dan pilih makanan yang akan dihitung biayanya;
2. Hasilnya akan diumumkan setelah periode perhitungan biaya berakhir;
3. Jika hasil yang diumumkan sesuai dengan makanan yang telah Anda pilih, Anda akan mendapatkan hadiah yang sesuai dengan biaya masing-masing;
4. Total hadiah resmi akan meningkat seiring bertambahnya jumlah pengguna yang berpartisipasi dalam permainan, akan ada kesempatan untuk mendapatkan hadiah "PIZZA" atau "SALAD" ketika total hadiah mencapai jumlah tertentu;
5. Jika "SALAD" diumumkan, maka semua sayuran akan mendapatkan hadiah;
6. Jika "PIZZA" diumumkan, maka semua daging akan mendapatkan hadiah.
`

text.rank.title = "Peringkat Pendapatan Hari Ini";
text.rank.column_Ranking = "Ranking";
text.rank.column_Profile = "Avatar";
text.rank.column_Name = "Nama";
text.rank.column_Revenue = "Pendapatan";

text.myHistory.title = "Sejarahku";
text.myHistory.column_Time = "Waktu Bermain";
text.myHistory.column_Details = "Detail Permainan";
text.myHistory.column_Result = "Hasil";
//text.myHistory.column_Revenue = "pendapatan";
text.myHistory.round = "Ronde:"

text.exceed.content = "Maaf, Anda tidak bisa bertaruh untuk lebih dari 6 pilihan setiap ronde permainan.";
text.exceed.confirm = "Konfirmasi";

text.setting.title = "Pengaturan";
text.setting.sound = "Suara";
text.setting.on = "Aktif";
text.setting.off = "Nonaktif";

text.roundFinal.thisRoundBets = "   Taruhan Ronde Ini:          ";
text.roundFinal.thisRoundRanking = "Peringkat Ronde Ini:     ";
text.roundFinal.thisRoundEarnings = "Pendapatan Ronde Ini:         ";
text.roundFinal.roundNumber = function roundResult(x: number): string {
    return `Hasil ronde ${x}:`;
};