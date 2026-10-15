// 牌靴（多副牌）与手牌

import { CONFIG, SUITS, RANKS, rankValue } from './config.js';

export class Deck {
    constructor(numDecks = CONFIG.shoeDecks) {
        this.numDecks = numDecks;
        this.cards = [];
        this.shuffle();
    }

    shuffle() {
        this.cards = [];
        for (let d = 0; d < this.numDecks; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    this.cards.push({ rank, suit });
                }
            }
        }
        // Fisher-Yates
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        if (this.cards.length === 0) {
            this.shuffle();
        }
        return this.cards.pop();
    }

    get remaining() { return this.cards.length; }
    get needsReshuffle() { return this.remaining <= CONFIG.reshuffleThreshold; }
}

export class Hand {
    constructor(bet = 0) {
        this.cards = [];
        this.bet = bet;
        this.isDoubled = false;
        this.isDone = false;  // 已完成（停牌/爆牌/黑杰克）
        this.fromSplit = false; // 分牌产生的手牌（不算黑杰克）
        this.isSplitAces = false; // 分牌A：各拿一张后强制停牌
    }

    addCard(card) {
        this.cards.push(card);
    }

    get score() {
        let total = 0;
        let aces = 0;
        for (const c of this.cards) {
            const v = rankValue(c.rank);
            if (v === 11) aces++;
            total += v;
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }

    get isBlackjack() {
        return !this.fromSplit && this.cards.length === 2 && this.score === 21;
    }

    get isBust() {
        return this.score > 21;
    }

    get canSplit() {
        // 标准规则：点值相同即可分（10+K 等混合十点也可分，A 除外见 isSplitAces）
        return this.cards.length === 2 &&
               rankValue(this.cards[0].rank) === rankValue(this.cards[1].rank) &&
               !this.isSplitAces;
    }

    get canDoubleDown() {
        return this.cards.length === 2 && !this.isDoubled;
    }

    get isSoft() {
        let total = 0;
        let aces = 0;
        for (const c of this.cards) {
            const v = rankValue(c.rank);
            if (v === 11) aces++;
            total += v;
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return aces > 0;
    }
}
