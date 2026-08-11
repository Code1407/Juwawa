import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
text.game.balance = "SALDO";
text.game.win = "MENANG";
text.game.extra = `Tambahan 50% dari biaya
diperlukan untuk membayar Biaya Ekstra.
Dalam mode Biaya Ekstra
simbol pengali 1x akan dihapus dari gulungan spesial, dan simbol pengali 15x akan ditambahkan.
Dalam mode Biaya Ekstra
nilai hadiah pada Roda Keberuntungan akan dikalikan
dengan pengali acak yang bisa berupa: 1x, 2x, 3x, 5x, 10x, 15x.`
text.game.extraBtn = "Biaya Ekstra",
text.game.autoTip = "Ketuk untuk putar otomatis",
text.game.round = "bulat:"

text.help.title = "aturan";
text.help.symbol = "Simbol";
text.help.symboContent = 'Ini adalah simbol WILD. Muncul di semua gulungan dan menggantikan semua simbol.';
text.help.SpecialReel = "Gulungan Spesial";
text.help.SpecialReelContent1 = '1. Gulungan ke-4 adalah gulungan spesial, hanya berisi simbol pengali dan ';
text.help.SpecialReelContent2 = '2. Semua kemenangan akan dikalikan dengan pengali yang berhenti di tengah gulungan spesial.';
text.help.SpecialReelContent3 = '3. Ada 6 simbol pengali dalam mode biaya normal: 1x, 2x, 3x, 5x, 10x.';
text.help.SpecialReelContent4_1 = '4.Jika berhenti  '
text.help.SpecialReelContent4_2 = '  di tengah gulungan spesial, maka akan memicu  ';
text.help.SpecialReelContent4_3 = 'Roda Keberuntungan .'
text.help.LuckyWheel = "Roda Keberuntungan";
text.help.LuckyWheelContent1 = 'Memicu Roda Keberuntungan akan memberikan hadiah acak yang bisa berupa 1x, 3x, 5x, 8x, 10x, 15x, 20x, 30x, 50x, 100x, 200x, atau 1000x dari biaya.';
text.help.Paytable = "tabel pembayaran";
text.help.PaytableContent1 = `1. Game ini menggunakan tabel pembayaran dinamis, dan pembayaran simbol yang ditampilkan di bawah mencerminkan jumlah hadiah untuk kombinasi pada tingkat biaya yang dipilih saat ini.`;
text.help.GameRule = "Aturan Permainan";
text.help.GameRuleContent1 = '1. Ini adalah slot video dengan 3 gulungan + 1 gulungan spesial, 3 baris, dan jumlah garis pembayaran adalah 5.';
text.help.GameRuleContent2 = '2. Semua simbol kemenangan dibayar dari kiri ke kanan pada garis pembayaran yang dipilih.';
text.help.GameRuleContent3 = '3. Garis pembayaran:';
text.help.GameRuleContent4 = '4. Hanya kemenangan tertinggi yang dibayar di setiap garis pembayaran.';
text.help.GameRuleContent5 = '5. Jika menang di beberapa garis pembayaran, semua kemenangan dijumlahkan ke total kemenangan.';
text.help.GameRuleContent6 = '6. Fitur permainan akan dimainkan dengan pengaturan biaya yang sama seperti di permainan pemicu.';
text.help.GameRuleContent7 = '7. Kombinasi kemenangan dan pembayaran ditentukan sesuai tabel pembayaran.';
text.help.GameRuleContent8 = '8. Jumlah kemenangan pada mode biaya ekstra akan dihitung berdasarkan pengaturan biaya normal dan mengacu pada nilai di tabel pembayaran.';

text.setting.title = "Pengaturan";
text.setting.sound = "Suara";

text.notice.autoEnable = "Aktifkan Putar Otomatis"
text.notice.autoDisable = "Nonaktifkan Putar Otomatis"
text.notice.playing = "Permainan Berlangsung"

text.history.title = "sejarah";
text.history.time = "waktu";
text.history.cost = "biaya";
text.history.result = "detail hasil";
text.history.win = "menang";