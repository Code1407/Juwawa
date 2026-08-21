import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.id;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `oto`;
text.game.stopAuto= `oto`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "baris";
text.game.total = "TOTAL";

text.help.title = "aturan permainan";
text.help.content = 
`1. Ada 7 simbol reguler dan 30 garis pembayaran yang ditawarkan dalam permainan;
2. Ketika gulungan berhenti berputar dan 3 simbol pertama dari kiri ke kanan mendarat di garis pembayaran yang diaktifkan, Anda bisa memenangkan hadiah dasar;
3. Setiap garis pembayaran dihitung secara terpisah, Semakin banyak garis pembayaran yang Anda aktifkan, semakin banyak hadiah yang mungkin Anda menangkan;
4. Pengganda bonus dari setiap simbol berbeda, Pembayaran hadiah = jumlah taruhan x pengganda bonus, Lihat detail di bawah:`
text.help.wildContent = "Simbol ini dapat menggantikan semua simbol lain kecuali simbol bonus dan scatter.";
text.help.freeContent = "Ketika muncul 3 dari mereka atau lebih, Anda mendapatkan beberapa kali putaran gratis.";
text.help.jackpotContent = "Ketika muncul 3 dari mereka atau lebih, Anda memenangkan jackpot.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>times";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>times";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>times";

text.setting.title = "SePengaturantting";
text.setting.sound = "Suara";