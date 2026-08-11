import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.id;

let text = textsMap[lang] = new Path();

text.path0 = `Peringkat`;
text.path1 = `Pemain`;
text.path2 = `Skor`;
text.path3 = `Menghadiahkan`;
text.path7 = `Aturan`;
text.path8 = `1. Setiap pemain yang memasang taruhan akan menerima poin papan peringkat berdasarkan jumlah taruhan mereka, dan akan diberikan hadiah sesuai dengan poin yang mereka peroleh;

2. 10 pemain teratas hari itu dapat mengklaim hadiah papan peringkat harian mereka setelah pukul 24:00;

3. 10 pemain teratas minggu itu dapat mengklaim hadiah papan peringkat mingguan mereka setelah pukul 24:00 pada hari Sabtu;

4. Peringatan: Daftar dimulai pada hari Minggu dan berakhir pada hari Sabtu. Hadiah harus diklaim dalam waktu 24 jam setelah berakhirnya periode papan peringkat yang bersangkutan; hadiah akan hangus setelah periode ini.`;
text.path9 = `Memuat...`;
text.path10 = `Peringkat`;
text.path11 = `Konfirmasi`;
text.path12 = `Selamat atas pencapaian peringkat <color=#FFFF00>{0}</c> di liga dan penerimaan bonus <color=#FFFF00>{1}</c>`;