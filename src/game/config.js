// 游戏配置与牌面工具函数

export const CONFIG = {
    shoeDecks: 6,           // 6副牌
    minBet: 10,
    maxBet: 1000,           // 单局最大下注
    initialChips: 5000,
    dealerStandOn: 17,      // 庄家17点停牌（硬17）
    dealerHitsSoft17: false, // 软17不继续要牌
    blackjackPayout: 1.5,   // 黑杰克赔付 3:2
    reshuffleThreshold: 52, // 剩余少于52张时重新洗牌
};

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

export function rankValue(rank) {
    if (rank === 'A') return 11;
    if (['J','Q','K'].includes(rank)) return 10;
    return parseInt(rank, 10);
}

export function getCardColor(suit) {
    return (suit === '♥' || suit === '♦') ? 'red' : 'black';
}
