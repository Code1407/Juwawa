import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;

text.game.round = "Tur:"
text.game.gainedCoins = "Kazanılan Paralar:"
text.game.again = "TEKRAR";
text.game.new = "Yeni >"
text.game.gameStart = "Oyun Başlat";
text.game.starting = "Başlıyor";
text.gameRecord.title1 = "Oyun Geçmişi";
text.gameRecord.title2 = "Geçmişim";
text.gameRecord.nodata = "veri yok";
text.gameRecord.rule = "Sadece 7 gün boyunca gösterilir, günde en fazla 100 kayıt içerir";
text.gameRecord.new = "Yeni";

text.help.title = "Oyun Kuralı";
text.help.content = 
`Rulet eğlenceli ve heyecan verici bir oyundur.

1. Sayılar: 0 (36 kat ödül), 1-12 (3 kat ödül), 13-24 (3 kat ödül), 25-36 (3 kat ödül)

2. Renk: kırmızı (2 kat ödül), siyah (2 kat ödül)

3. Tek ve çift: tek (2 kat ödül), çift (0 hariç) (2 kat ödül)

İyi oyunlar!
`
text.help.reward = "Ödüllendirici, lütfen bekleyin!";
text.help.wait = "Lütfen bir sonraki turu bekleyin"
codeText.globalContent.Time = "Zaman"
codeText.globalContent.bet = "bahis";
codeText.globalContent.get = "elde et";
codeText.globalContent.win = "kazan";