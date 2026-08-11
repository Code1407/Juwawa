import { Logger } from "pinus";
import { EPokerHands, IPokerItem } from "../interface/IGame";

type IPokerCards = IPokerItem[];

export class Poker {
    pokerPool: IPokerItem[] = this.reset();

    constructor(private logger: Logger) {
    }

    length(): number {
        return this.pokerPool.length;
    }

    reset(): IPokerItem[] {
        let pokerPool: IPokerItem[] = [];
        for (let num = 0; num < 13; num++) { // ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
            for (let decor = 0; decor < 4 ; decor++) { //"黑桃","红桃","梅花","方块"
                pokerPool.push({num, decor});
            }
        }
        this.pokerPool = pokerPool;
        return pokerPool;
    }

    pop(): IPokerItem {
        if (this.length() <= 0) this.reset();
    
        let index = Math.floor(Math.random() * this.pokerPool.length);
        let item: IPokerItem[] = this.pokerPool.splice(index, 1);
        return item[0];
    }

    maxCardsIndex(arrCards: IPokerCards[]): number {
        if (arrCards.length < 1) {
            this.logger.error("maxCardsIndex: arrCards.length < 1", arrCards);
            return -1;
        }

        let maxIndex = 0;
        let maxCards = arrCards[maxIndex];
        for (let i = 1; i < arrCards.length; i++) {
            let cards = arrCards[i];
            if (this.compare(maxCards, cards) == 0) {
                return -1;
            }
            if (this.compare(maxCards, cards) > 0) {
                maxIndex = i;
                maxCards = arrCards[maxIndex];
            }
        }
        return maxIndex;
    }

    maxHands(arrCards: IPokerCards[]): EPokerHands {
        if (arrCards.length < 1) {
            this.logger.error("maxCardsIndex: arrCards.length < 1", arrCards);
            return EPokerHands.unknow;
        }

        let allHands: EPokerHands[] = [];
        for (let i = 1; i < arrCards.length; i++) {
            allHands.push(this.hands(arrCards[i]));
        }
        let maxIndex = 0;
        for (let i = 1; i < allHands.length; i++) {
            if (allHands[i] > allHands[maxIndex]) {
                maxIndex = i;
            }
        }
        return allHands[maxIndex];
    }

    compare(cardsA: IPokerCards, cardsB: IPokerCards): number {
        if (cardsA.length < 2 && cardsB.length < 2) {
            this.logger.error("compare: cardsA.length < 2 && cardsB.length < 2", cardsA, cardsB);
            return 0;
        }
        if (cardsA.length < 2) {
            this.logger.error("compare: cardsA.length < 2", cardsA);
            return 1;
        }
        if (cardsB.length < 2) {
            this.logger.error("compare: cardsB.length < 2", cardsB);
            return -1;
        }
        if (cardsA.length != cardsB.length) {
            this.logger.error("compare: cardsA.length < 2 && cardsB.length < 2", cardsA, cardsB);
            return 0;
        }

        let handsA = this.hands(cardsA);
        let handsB = this.hands(cardsB);
        if (handsA != handsB) return handsB - handsA;
        
        let tmpCardsA: IPokerCards = JSON.parse(JSON.stringify(cardsA));
        let tmpCardsB: IPokerCards = JSON.parse(JSON.stringify(cardsB));
        for (let i = 0; i < tmpCardsA.length; i++) {
            let item = tmpCardsA[i];
            if (item.num == 0) item.num = 13;
        }
        for (let i = 0; i < tmpCardsB.length; i++) {
            let item = tmpCardsB[i];
            if (item.num == 0) item.num = 13;
        }
        tmpCardsA.sort((a, b) => b.num - a.num);
        tmpCardsB.sort((a, b) => b.num - a.num);
        for (let i = 0; i < Math.min(tmpCardsA.length, tmpCardsB.length); i++) {
            let numA = tmpCardsA[i].num;
            let numB = tmpCardsB[i].num;
            if (numB != numA) return numB - numA;
        }
        return 0;
    }

    hands(cards: IPokerCards): EPokerHands {
        let sameNum = this.isSameNum(cards);
        if (sameNum) return EPokerHands.sameNum;

        let straight = this.isStraight(cards);
        let sameDecor = this.isSameDecor(cards);
        if (straight && sameDecor) return EPokerHands.sameDecorStraight;
        if (straight) return EPokerHands.straight;
        if (sameDecor) return EPokerHands.sameDecor;

        let pair = this.isPair(cards);
        if (pair) return EPokerHands.pair;

        return EPokerHands.highCard;
    }

    isStraight(cards: IPokerCards): boolean {
        if (cards.length < 2) { 
            this.logger.error("isStraight: cards.length < 2", cards);
            return false;
        }

        let tmpCards: IPokerCards = JSON.parse(JSON.stringify(cards));
        tmpCards.sort((a, b) => a.num - b.num);

        let index = 0;
        let itemLast = tmpCards[index];
        let itemMax = tmpCards[tmpCards.length-1];
        index++;
        if (itemLast.num == 0 && itemMax.num == 12) { // 第1张为A，最后1张为K
            itemLast = tmpCards[index]; // 则以第2张作为最小
            index++;
        }
        for (; index < tmpCards.length; index++) {
            let itemIndex = tmpCards[index];
            if (itemIndex.num != itemLast.num + 1) return false;
            itemLast = itemIndex;
        }

        return true;
    }

    isSameNum(cards: IPokerCards): boolean {
        if (cards.length < 2) {
            this.logger.error("isSameNum: cards.length < 2", cards);
            return false;
        }

        let itemFirst = cards[0];
        for (let i = 1; i < cards.length; i++) {
            let item = cards[i];
            if (item.num != itemFirst.num) return false;
        }

        return true;
    }

    isSameDecor(cards: IPokerCards): boolean {
        if (cards.length < 2) {
            this.logger.error("isSameNum: cards.length < 2", cards);
            return false;
        }

        let item1 = cards[0];
        for (let i = 1; i < cards.length; i++) {
            let item = cards[i];
            if (item.decor != item1.decor) return false;
        }

        return true;
    }

    isPair(cards: IPokerCards): boolean {
        let numCount: {[num: string]: number} = {};
        for (let i = 0; i < cards.length; i++) {
            let item: IPokerItem = cards[i];
            if (numCount[item.num] && numCount[item.num] > 0) { 
                numCount[item.num]++;
            } else {
                numCount[item.num] = 1;
            }
        }
        for (let num in numCount) {
            if (numCount[num] >= 2) return true;
        }
        return false;
    }
}