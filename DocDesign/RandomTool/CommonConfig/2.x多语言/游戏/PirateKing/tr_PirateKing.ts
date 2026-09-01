import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node_PirateKing";

let lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

let text = langContent[lang];
text.game.path0 = `ÖDEMELER`;
text.game.path2 = `OTOMATİK`;
text.game.path4 = `HIZ`;
text.game.path34 = `Bu sayfada görüntülenen değerler, toplam bahis 20'de verilebilecek ödülleri temsil eder.`;
text.game.path35 = `WILD, döndürme hariç oyundaki herhangi bir simgeyi değiştirebilir.`;
text.game.path36 = `döndürme yalnızca ekrandaki sayıyı sayar. Çizgilerle bir ilişkisi yoktur. Ekranda 3 veya daha fazla SPIN belirdiğinde, oyuncu rastgele JACKPOT kazanır.`;
text.game.path37 = `Ödeme Hattı`;
text.game.path38 = `Ayarlar`;
text.game.path39 = `Ses`;
text.game.path58 = `KURALLAR`;
text.game.path59 = `Mevcut oyunda, oyuncular için genel uzun vadeli teorik Oyuncuya Dönüş Oranı (RTP) %97.52'dir.`;

text.history.History = `GEÇMİŞ`;
text.history.time = `Zaman`;
text.history.bet = `Bahis`;
text.history.type = `Tip`;
text.history.line = `Çizgi`;
text.history.count = `Sayı`;
text.history.win = `Kazanç`;
text.history.round = `Tur:`;
