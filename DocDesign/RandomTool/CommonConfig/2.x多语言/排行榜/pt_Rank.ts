import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.pt;

let text = textsMap[lang] = new Path();

text.path0 = `Classificação`;
text.path1 = `Jogador`;
text.path2 = `Pontuação`;
text.path3 = `Prémio`;
text.path7 = `Regras`;
text.path8 = `1. Cada jogador que fizer uma aposta receberá pontos na tabela de classificação com base no valor da sua aposta e será premiado de acordo com os pontos correspondentes;

2.º Os 10 melhores jogadores do dia podem reclamar as suas recompensas diárias na tabela de classificação após as 24h00;

3.º Os 10 melhores jogadores da semana podem reclamar as suas recompensas semanais na tabela de classificação após as 24h00 de sábado;

4.º Atenção: A lista começa no domingo e termina no sábado. As recompensas devem ser reclamadas no prazo de 24 horas após o termo do período da tabela de classificação correspondente; as recompensas expiram após esse período.`;
text.path9 = `Carregando...`;
text.path10 = `Classificação`;
text.path11 = `Confirmar`;
text.path12 = `Parabéns por alcançar o <color=#FFFF00>{0}</c>º lugar na liga e receber o bónus <color=#FFFF00>{1}</c>`;