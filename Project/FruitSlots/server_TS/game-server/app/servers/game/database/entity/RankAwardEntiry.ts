import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
import { SDK_trade } from "./SDKEntity";

@Entity("RankAward_day")
export class RankAward_day {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    day: Date;
    @Column()
    round: number;
    @Column()
    uid: string;
    @Column()
    score: number;
    @Column()
    bonus: number;
    @Column()
    game_name: string;
    @Column()
    save_time: Date;
}

@Entity("RankAward_week")
export class RankAward_week extends RankAward_day  {}

@Entity("RankAward_trade")
export class RankAward_trade extends SDK_trade  {
    @Column()
    game_name: string;
}