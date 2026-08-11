import { ELang } from "../langEnum";
import { LangText, langContent, langNode } from "../node";


const lang = ELang.pt;

langNode[lang] = new LangText();
langContent[lang] = new LangText();

const text = langContent[lang];


text.game.autoPlay= `AUTO`;
text.game.stopAuto= `AUTO`;
text.game.linesLabe1= "30";
text.game.linesLabe2= "linhas";
text.game.total = "TOTAL";

text.help.title = "Ragra";
text.help.gameRule = "Regras do jogo:";
text.help.SpecialSymbols = "Símbolos especiais";
text.help.content =
`1. Existem 7 símbolos regulares e 30 linhas de pagamento oferecidas no jogo;
2. Quando os rolos param de girar e os 3 primeiros símbolos da esquerda para a direita aparecem na linha de pagamento ativada, você pode ganhar um prêmio básico;
3. Cada linha de pagamento é calculada separadamente. Quanto mais linhas de pagamento você ativar, mais prêmios poderá ganhar;
4. O multiplicador de bônus de cada símbolo é diferente, Pagamento do prêmio = valor da aposta x multiplicador de bônus, Veja os detalhes abaixo:
text.help.wildContent = "Ele pode substituir todos os outros símbolos, exceto os símbolos de bônus e scatter.`;
text.help.freeContent = "Ao aparecer 3 ou mais deles, você ganha várias rodadas grátis.";
text.help.jackpotContent = "Ao aparecer 3 deles ou mais, você ganha o jackpot.";
text.help.freeTime3 = "x<color=#00ff00>3</color> = <color=#00ff00>5</color>vezes";
text.help.freeTime4 = "x<color=#00ff00>4</color> = <color=#00ff00>8</color>vezes";
text.help.freeTime5 = "x<color=#00ff00>5</color> = <color=#00ff00>12</color>vezes";

text.setting.title = "Configuração";
text.setting.sound = "Som";