import { ELang } from "../langEnum";
import { LangText, langContent, langNode, langInCodes, LangInCode } from "../node";


const lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];
const codeText = langInCodes[lang] = new LangInCode;
const addContent: string = ""

text.game.TitleLabel = "ROKET";		
text.game.hisLabel = "onun:";		
text.game.label = "TÜM";		
text.game.cashoutNumDes1 = "otomatik kaçış";		
text.game.cashoutNumDes2 = "otomatik kaçış";		
text.game.cashoutNumDes3 = "otomatik kaçış";		
text.game.waitfornextround1 = "bir sonraki turu bekleyin";		
text.game.waitfornextround2 = "bir sonraki turu bekleyin";		
text.game.waitfornextround3 = "bir sonraki turu bekleyin";		
text.game.escape1 = "KAÇIŞ";		
text.game.escape2 = "KAÇIŞ";		
text.game.escape3 = "KAÇIŞ";		
text.game.joinNow = "Şimdi Katıl!";		
text.game.youHeight = "Kaçış yüksekliğiniz:";		
text.game.youReward = "Ödüllerinizi alın:";		
text.game.PersistentEfforts = "Sürekli Çabalar!!";		
		
		
text.help.title = "Talimatlar";		
text.help.content =		
`1. Fırlatmadan önce bahisinizi yapın.		
2. Risk alın ve oranların daha iyi olmasını bekleyin.		
3. Roket patlamadan önce kaçış yapın!		
4. Patlama noktası @ 1.00x ile 10,000x arasındadır.		
5. En düşük kaçış noktası @1.01x'dir.		
6. Bir oyuncu şu anki oyundan ayrılırsa, bu kaçış olarak kabul edilir ve otomatik bahis iptal edilir.		
7. Lütfen dikkat: Ağ bağlantınıza bağlı olarak, tıklanıldığında yükseklikten daha yüksek bir son kaçış noktası olabilir; bu da patlama öncesinde başarısız bir kaçışa neden olabilir.		`

text.help.addContent = `8.Mevcut oyunda, oyuncuların genel uzun dönem oyun teorisi geri ödeme oranı (RTP) %97.52'dir.`
		
text.ready.content1 = "geri sayım";		
text.ready.content2 = "HAZIRLANIYOR!";		
		
text.inpuView.content3 = "TAMAM";		
text.inpuView.content4 = "maks";		
text.inpuView.content5 = "min";		
		
		
text.quitView.content = "Roket fırlatılıyor, nakit çıkmadan çıkmak istiyor musunuz?";		
text.quitView.confirm = "Onayla";		
text.quitView.cancel = "İptal";		
		
text.myRecord.content = "BAHİS KAYDI";		
text.myRecord.nodata = "veri yok";		
		
text.gameHistory.content1 = "Patlama noktası";		
text.gameHistory.content2 = "Patlama noktası istatistikleri:";		
text.gameHistory.content3 = "yükseklik";		
text.gameHistory.content4 = "son 10 tur";		
text.gameHistory.content5 = "son 20 tur";		
text.gameHistory.content6 = "son 30 tur";		
text.gameHistory.content7 = "son 50 tur";		
text.gameHistory.content8 = "son 100 tur";		

text.disconnectCash.content = `Ağ bağlantısı kesildi ve otomatik olarak kaçtınız.
NOT: Başarılı bir şekilde kaçmak için lütfen AĞ'I AÇIK tutun!`;
text.disconnectCash.reconnect = "Yeniden bağlan";
text.disconnectCash.exit = "Çık";
		
codeText.betView.alreadybet = "Zaten Bahis Yapıldı!";		
codeText.betView.bet = "BAHİS";		
codeText.betView.holdtoauto = "otomatik için basılı tut";		
codeText.betView.cancelauto = "OTOMATİĞİ DURDUR";		
codeText.betView.betnext = "SONRAKİ BAHİS";		
codeText.betView.automodel = "OTOMATİK BAHİS";		
codeText.betView.cancel = "İPTAL";		
codeText.betView.cancelnext = "Sonrakini İptal Et";		
codeText.betView.escape = "KAÇIŞ";		
codeText.betView.escape2 = "kaçış";		
codeText.betView.escape3 = "Kaçamadı";		
codeText.betView.cancelbet = "Bahisi İptal Et";		
codeText.betView.betnext2 = "Sonraki Bahis+";		
codeText.betView.exploded = "patladı";		
codeText.betView.maxBetLimit = "Limit aşıldı";		
		
codeText.globalContent.flightheight = "Uçuş Yüksekliği";		
codeText.globalContent.vacancy = "boşluk";		
codeText.globalContent.rocket = "ROKET";		
codeText.globalContent.inputContent1 = "Limit: 100.00-50,000.00";		
codeText.globalContent.inputContent2 = "Miktarı girin:";		
codeText.globalContent.inputContent3 = "Kaçış yüksekliği: 1.01-100.00";		
codeText.globalContent.inputContent4 = "Bir kaçış noktası girin:";		
codeText.globalContent.round =  "tur: ";