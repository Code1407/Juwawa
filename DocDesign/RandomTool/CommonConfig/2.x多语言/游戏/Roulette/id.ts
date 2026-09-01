import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;


text.game.again = "LAGI";
text.game.new = "Baru >"
text.game.gameStart = "Mulai Permainan";
text.game.starting = "Memulai";
text.game.round = "Putaran:";
text.game.gainedCoins = "Koin Diperoleh:";
text.gameRecord.title1 = "Riwayat Permainan";
text.gameRecord.title2 = "Riwayat Saya";
text.gameRecord.nodata = "tidak ada data";
text.gameRecord.rule = "Hanya ditampilkan selama 7 hari, maksimal 100 catatan per hari";
text.gameRecord.new = "BARU";

text.help.title = "Aturan Permainan";
text.help.content =
`Roulette adalah permainan yang menyenangkan dan menarik.

1. Angka: 0 (hadiah 36 kali), 1-12 (hadiah 3 kali), 13-24 (hadiah 3 kali), 25-36 (hadiah 3 kali);

2. Warna: merah (hadiah 2x), hitam (hadiah 2x);

3. Ganjil dan genap: ganjil (hadiah 2x), genap tapi tidak termasuk 0 (hadiah 2x).

Selamat bermain!`
text.help.reward = "Sedang memberikan hadiah, mohon tunggu!";
text.help.wait = "Mohon tunggu untuk putaran berikutnya";

codeText.globalContent.Time = "Waktu"
codeText.globalContent.bet = "taruhan";
codeText.globalContent.get = "dapatkan";
codeText.globalContent.win = "menang";
