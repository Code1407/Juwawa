import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""

text.game.TitleLabel= "ROKET";			
text.game.hisLabel = "miliknya:";			
text.game.label = "SEMUA";			
text.game.cashoutNumDes1 = "esc oto";			
text.game.cashoutNumDes2 = "esc oto";			
text.game.cashoutNumDes3 = "esc oto";
text.game.waitfornextround1 = "tunggu putaran berikutnya";
text.game.waitfornextround2 = "tunggu putaran berikutnya";
text.game.waitfornextround3 = "tunggu putaran berikutnya";	
text.game.escape1 = "melarikan diri";
text.game.escape2 = "melarikan diri";
text.game.escape3 = "melarikan diri";	
// text.game.label2 = "taruhan";			
// text.game.label4 = "taruhan";			
text.game.joinNow = "Bergabung sekarang!";			
text.game.youHeight = "Ketinggian pelarian Anda:";			
text.game.youReward = "Dapatkan hadiah:";			
text.game.PersistentEfforts = "Upaya yang gigih!!";			

text.help.title = "Petunjuk";
text.help.content = 
`1. Pasang taruhan Anda sebelum lepas landas.
2. Ambil risiko dan tunggu sampai peluang menjadi lebih baik.
3. Keluar sebelum roketnya meledak!
4. Titik ledakan @ 1,00x hingga 10.000x.
5. Titik keluar terendah adalah @1,01x.
6. Setiap keberangkatan dari permainan saat ini akan dianggap sebagai lompatan dan taruhan otomatis akan dibatalkan.
7. Harap diperhatikan: Tergantung pada koneksi jaringan Anda, titik keluar terakhir mungkin lebih tinggi dari ketinggian saat diklik, yang juga dapat menyebabkan kegagalan keluar sebelum ledakan.`

text.help.addContent = `8.Dalam game saat ini, tingkat pengembalian teoritis permainan jangka panjang (RTP) secara keseluruhan untuk pemain adalah 97.52%.`

text.ready.content1 = "menghitung mundur"
text.ready.content2 = "MEMPERSIAPKAN!"

text.inpuView.content1 = "Batas taruhan: 100-50.000"
text.inpuView.content2 = "Mohon masukkan"
text.inpuView.content3 = "OKE"
text.inpuView.content4 = "maks"
text.inpuView.content5 = "terkecil"


text.quitView.content = "Roketnya lepas landas dan Anda ingin berhenti tanpa menguangkannya?";
text.quitView.confirm = "Mengonfirmasi";
text.quitView.cancel = "Membatalkan";

text.myRecord.content = "Catatan taruhan";
text.myRecord.nodata = "tidak ada data";

text.gameHistory.content1 = "Titik ledakan";
text.gameHistory.content2 = "Statistik titik ledakan:";
text.gameHistory.content3 = "ketinggian";
text.gameHistory.content4 = "10 putaran terakhir";
text.gameHistory.content5 = "20 putaran terakhir";
text.gameHistory.content6 = "30 putaran terakhir";
text.gameHistory.content7 = "50 putaran terakhir";
text.gameHistory.content8 = "100 putaran terakhir";

text.disconnectCash.content = `Jaringan terputus dan Anda otomatis lolos.
Catatan: Harap biarkan jaringan tetap terbuka agar berhasil keluar!`;
text.disconnectCash.reconnect = "Hubungkan kembali";
text.disconnectCash.exit = "berhenti";


codeText.betView.alreadybet = "Sudah memasang taruhan Anda!";
codeText.betView.bet = "taruhan"
codeText.betView.holdtoauto = "tahan ke oto"
codeText.betView.cancelauto = "HENTIKAN OTOMATIS"
codeText.betView.betnext = "TARUHAN BERIKUTNYA"
codeText.betView.automodel = "TARUHAN OTOMATIS"
codeText.betView.cancel = "Membatalkan"
codeText.betView.cancelnext = "Batalkan Berikutnya"
codeText.betView.escape = "melarikan diri"
codeText.betView.escape2 = "melarikan diri"
codeText.betView.escape3 = "Tidak melarikan diri"
codeText.betView.cancelbet = "Batalkan Taruhan"
codeText.betView.betnext2 = "Taruhan Berikutnya+"
codeText.betView.exploded = "meledak"
codeText.betView.maxBetLimit = "Melebihi jumlah taruhan maksimum"


codeText.globalContent.flightheight = "Ketinggian penerbangan"
codeText.globalContent.vacancy = "lowongan"
codeText.globalContent.rocket = "ROKET"
codeText.globalContent.inputContent1 = "Batas taruhan: 100-50.000"
codeText.globalContent.inputContent2 = "Masukan jumlah:"
codeText.globalContent.inputContent3 = "Ketinggian pelarian:1.01-100.00"
codeText.globalContent.inputContent4 = "Masukkan titik keluar:"
codeText.globalContent.round =  "putaran: "
