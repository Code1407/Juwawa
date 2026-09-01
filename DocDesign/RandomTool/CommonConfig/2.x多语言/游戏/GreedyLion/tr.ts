import { ELang } from "../../shared3/langEnum_shared3";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.tr;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];

text.game.autoPlay=			
`Otomatik Oynat`;			
text.game.stopAuto =			
`Otomatiği Durdur`;			
text.game.result = "Sonuç";			
text.game.mine = "Geçmişim";			
text.game.todayWin =			
`Bugünün Kazancı:`;			
text.game.todayRank =			
`Bugünkü Sıralama`;			
text.game.round = "Tur:";			
text.game.salad = "Salata";			
text.game.pizza = "Pizza";			
text.game.selectTime = "Zaman Seç";			
			
text.help.title = "Kurallar";			
text.help.content =			
`			
1. Maliyet tutarınızı seçin ve maliyetini karşılayacağınız yemeği seçin;
2. Sonuçlar, maliyet süresi sona erdikten sonra açıklanacaktır;
3. Açıklanan sonuç seçtiğiniz yemekle eşleşirse, ilgili maliyete göre ödül kazanacaksınız;
4. Oyuna daha fazla kullanıcı katıldıkça resmi ödül havuzu artacak, ödül havuzu belirli bir miktara ulaştığında "PİZZA" veya "SALATA" ödülü kazanma şansı olacaktır;
5. "SALATA" açıklanırsa, tüm sebzeler ödüllendirilecektir;
6. "PİZZA" açıklanırsa, tüm etler ödüllendirilecektir.		
`			
			
text.rank.title = "Bugünkü Kazanç Sıralaması";			
text.rank.column_Ranking = "Sıralama";			
text.rank.column_Profile = "Profil";			
text.rank.column_Name = "İsim";			
text.rank.column_Revenue = "Kazanç";			
			
text.myHistory.title = "Geçmişim";			
text.myHistory.column_Time = "Oynama Zamanı";			
text.myHistory.column_Details = "Oyun Detayları";			
text.myHistory.column_Result = "Sonuç";			
//text.myHistory.column_Revenue = "Kazanç";			
text.myHistory.round = "Tur:"			
			
text.exceed.content = "Üzgünüz, her oyun turunda 6'dan fazla seçenek için bahis yapamazsınız.";			
text.exceed.confirm = "Onayla";			

text.setting.title = "Ayarlar";			
text.setting.sound = "Ses";			
text.setting.on = "Açık";			
text.setting.off = "Kapalı";			
			
text.roundFinal.thisRoundBets = " Bu Tur Bahisleri: ";			
text.roundFinal.thisRoundRanking = "Bu Tur Sıralaması: ";			
text.roundFinal.thisRoundEarnings = "Bu Tur Kazançları: ";			
text.roundFinal.roundNumber = function roundResult(x: number): string {			
return `Tur ${x}'nin Sonucu:`;			
};			