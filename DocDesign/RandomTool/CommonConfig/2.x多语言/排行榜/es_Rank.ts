import { Path, textsMap } from "../Path_Rank";
import { ELang } from "../langEnum_Rank";

let lang = ELang.es;

let text = textsMap[lang] = new Path();

text.path0 = `Clasificación`;
text.path1 = `Jugador`;
text.path2 = `Puntuación`;
text.path3 = `Otorgar`;
text.path7 = `Reglas`;
text.path8 = `1. Cada jugador que realice una apuesta recibirá puntos para la clasificación según el monto apostado y obtendrá recompensas en función de dichos puntos.

2. Los 10 mejores jugadores del día podrán reclamar sus recompensas diarias de la clasificación después de las 24:00.

3. Los 10 mejores jugadores de la semana podrán reclamar sus recompensas semanales de la clasificación después de las 24:00 del sábado.

4. Aviso: La clasificación comienza el domingo y finaliza el sábado. Las recompensas deben reclamarse dentro de las 24 horas posteriores a la finalización del período correspondiente de la clasificación; transcurrido este plazo, las recompensas caducan.`;
text.path9 = `Cargando...`;
text.path10 = `Clasificación`;
text.path11 = `Confirmar`;
text.path12 = `¡Felicidades por alcanzar el puesto <color=#FFFF00>{0}</c> en la liga y recibir la bonificación <color=#FFFF00>{1}</c>!`;