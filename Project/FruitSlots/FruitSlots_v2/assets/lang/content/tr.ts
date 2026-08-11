import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.autoPlay= `OTO`;
text.game.stopAuto= `OTO`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "satır";
text.game.total = "TOPLAM";

text.help.title = "Oyun Kurulu";
text.help.content = 
`1. Oyunda sunulan 7 normal sembol ve 30 ödeme çizgisi vardır.
2. Makaralar dönmeyi bıraktığında ve soldan sağa doğru ilk 3 sembol aktif ödeme çizgisine geldiğinde, temel bir ödül kazanabilirsiniz.
3. Her ödeme çizgisi ayrı ayrı hesaplanır. Ne kadar çok ödeme hattı etkinleştirirseniz o kadar cevher ödülü kazanabilirsiniz.
4. Her sembolün bonus çarpanı farklıdır. Ödül ödemesi = bahis miktarı x bonus çarpanı. Aşağıdaki ayrıntılara bakın:`
text.help.wildContent = "Bonus ve Scatter sembolleri dışındaki diğer tüm sembollerin yerine geçebilir.";
text.help.freeContent = "3 veya daha fazla göründüğünde, birkaç ücretsiz döndürme süresi elde edersiniz.";
text.help.jackpotContent = "3 veya daha fazla göründüğünde ikramiyeyi kazanırsınız.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>kere";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>kere";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>kere";

text.setting.title = "Ayarlar";
text.setting.sound = "Ses";