// 成就定义

import { CONFIG } from './config.js';

export const ACHIEVEMENTS = [
    { id: 'first_win',     name: '首胜',       desc: '赢得第一局游戏',        icon: '🏆', check: s => s.totalWins >= 1 },
    { id: 'blackjack',     name: '黑杰克！',    desc: '获得一次黑杰克',        icon: '⭐', check: s => s.blackjackCount >= 1 },
    { id: 'win_streak_3',  name: '三连胜',     desc: '连胜3局',               icon: '🔥', check: s => s.bestStreak >= 3 },
    { id: 'win_streak_5',  name: '五连胜',     desc: '连胜5局',               icon: '💫', check: s => s.bestStreak >= 5 },
    { id: 'big_winner',    name: '大赢家',     desc: '累计赢得1000筹码',      icon: '💰', check: s => s.totalChipsWon >= 1000 },
    { id: 'high_roller',   name: '豪客',       desc: '单局下注达到500',       icon: '👑', check: s => s.maxBet >= 500 },
    { id: 'split_win',     name: '分牌取胜',   desc: '分牌后赢得一手',        icon: '✂️', check: s => s.splitWins >= 1 },
    { id: 'double_win',    name: '加倍成功',   desc: '加倍后赢得一手',        icon: '📈', check: s => s.doubleWins >= 1 },
    { id: 'insurance_win', name: '保险理赔',   desc: '购买保险并庄家确实黑杰克', icon: '🛡️', check: s => s.insuranceWins >= 1 },
    { id: 'ten_games',     name: '老玩家',     desc: '完成10局游戏',          icon: '🎮', check: s => s.totalGames >= 10 },
    { id: 'fifty_games',   name: '赌场常客',   desc: '完成50局游戏',          icon: '🎯', check: s => s.totalGames >= 50 },
    { id: 'comeback',      name: '绝地翻盘',   desc: '在筹码低于100时赢回500以上', icon: '🦅', check: s => s.comebackCount >= 1 },
    { id: 'phoenix',       name: '不死鸟',     desc: '破产后重新开始并赢回1000', icon: '🌅', check: s => s.postBankruptChipsWon >= 1000 },
    { id: 'double_bj',     name: '双喜临门',   desc: '连续两局黑杰克',           icon: '🎴', check: s => s.consecutiveBlackjacks >= 2 },
    { id: 'quad_win',      name: '四手全胜',   desc: '分到4手牌并全部获胜',      icon: '🂡', check: s => s.quadSplitWins >= 1 },
    { id: 'grand_slam',    name: '大满贯',     desc: '单局净赢500以上',          icon: '💎', check: s => s.biggestRoundWin >= 500 },
    { id: 'veteran',       name: '千局老兵',   desc: '完成1000局游戏',           icon: '🎖️', check: s => s.totalGames >= 1000 },
    { id: 'first_bankrupt', name: '初次破产',   desc: '首次破产',                 icon: '💀', check: s => s.bankruptCount >= 1 },
    { id: 'persistence',  name: '坚持不懈',   desc: '破产3次后重新来过',         icon: '🔄', check: s => s.bankruptCount >= 3 },
    { id: 'win_streak_10', name: '十连胜',    desc: '连胜10局',                  icon: '⚡', check: s => s.bestStreak >= 10 },
    { id: 'unlucky',      name: '非酋',       desc: '连输5局',                   icon: '🍀', check: s => s.bestLossStreak >= 5 },
    { id: 'millionaire',  name: '大富豪',     desc: '筹码峰值达到10000',         icon: '🏦', check: s => s.peakChips >= 10000 },
    { id: 'gambler',      name: '赌徒',       desc: '完成100局游戏',             icon: '🎰', check: s => s.totalGames >= 100 },
    { id: 'triple_bj',    name: '三连黑杰克', desc: '连续3局黑杰克',             icon: '✨', check: s => s.consecutiveBlackjacks >= 3 },
    { id: 'all_in',       name: '全押豪赌',   desc: '单局下注达到1000',           icon: '🎲', check: s => s.maxBet >= 1000 },
    // 新增成就
    { id: 'loser_1000',    name: '输家',       desc: '累计输掉1000筹码',          icon: '💸', check: s => s.totalChipsLost >= 1000 },
    { id: 'loss_streak_7', name: '七连败',     desc: '连输7局',                   icon: '😭', check: s => s.bestLossStreak >= 7 },
    { id: 'loss_streak_10', name: '十连败',    desc: '连输10局',                  icon: '😱', check: s => s.bestLossStreak >= 10 },
    { id: 'win_streak_7',  name: '七连胜',     desc: '连胜7局',                   icon: '🌟', check: s => s.bestStreak >= 7 },
    { id: 'hundred_lost',  name: '百败之王',   desc: '累计输掉100局',              icon: '🥀', check: s => s.totalLosses >= 100 },
    { id: 'two_hundred',   name: '沉迷',       desc: '完成200局游戏',              icon: '🎭', check: s => s.totalGames >= 200 },
    { id: 'five_hundred',  name: '传奇赌神',   desc: '完成500局游戏',              icon: '👑', check: s => s.totalGames >= 500 },
    { id: 'millionaire_20k', name: '千万富翁', desc: '筹码峰值达到20000',          icon: '💎', check: s => s.peakChips >= 20000 },
    { id: 'all_in_win',    name: '全押制胜',   desc: '下注>=1000并赢得一局',       icon: '🔥', check: s => s.allInWins >= 1 },
    { id: 'soft_21',       name: '软21点',     desc: '用软手(A算11)达到21点',     icon: '🅰️', check: s => s.soft21Count >= 1 },
    { id: 'non_lose_10',   name: '稳如泰山',   desc: '连续10局不输(胜或平)',       icon: '🛡️', check: s => s.bestNonLoseStreak >= 10 },
    { id: 'double_user',   name: '加倍狂人',   desc: '使用加倍操作10次',           icon: '📈', check: s => s.doubleUseCount >= 10 },
    { id: 'split_user',    name: '分牌专家',   desc: '使用分牌操作10次',           icon: '✂️', check: s => s.splitUseCount >= 10 },
    { id: 'net_winner',    name: '净赢家',     desc: '净赢筹码达到2000',           icon: '💰', check: s => (s.totalChipsWon - s.totalChipsLost) >= 2000 },
    { id: 'double_bust',   name: '加倍冒险家', desc: '加倍后爆牌5次',              icon: '💥', check: s => s.doubleBustCount >= 5 },
];

export class StatsManager {
    constructor() {
        this.data = this._load();
        this._checkNewAchievements = [];
    }

    _load() {
        const defaults = {
            totalGames: 0, totalWins: 0, totalLosses: 0, totalPushes: 0,
            blackjackCount: 0, currentStreak: 0, bestStreak: 0,
            totalChipsWon: 0, totalChipsLost: 0, totalBet: 0, maxBet: 0,
            splitWins: 0, doubleWins: 0, insuranceWins: 0,
            comebackCount: 0, lowestChips: 5000,
            unlockedAchievements: [],
            // 筹码历史峰值
            peakChips: 5000,
            // 新增字段（向后兼容旧存档）
            lossStreak: 0,
            consecutiveBlackjacks: 0,
            bankruptCount: 0,
            bestLossStreak: 0,
            postBankrupt: false,       // 破产后尚未赢回1000
            postBankruptChipsWon: 0,
            quadSplitWins: 0,
            biggestRoundWin: 0,
            comebackLowMark: 0,        // 首次跌破100时的筹码，0=未跌破
            // 扩展统计字段
            allInWins: 0,              // 全押(>=1000)胜场
            soft21Count: 0,            // 软21次数(A算11达到21)
            doubleBustCount: 0,        // 加倍后爆牌次数
            doubleUseCount: 0,         // 加倍使用总次数
            splitUseCount: 0,          // 分牌使用总次数
            bestNonLoseStreak: 0,      // 最长不输纪录(胜+平)
            currentNonLoseStreak: 0,   // 当前不输连胜
        };
        try {
            const raw = localStorage.getItem('bj_stats_v2');
            if (raw) return Object.assign(defaults, JSON.parse(raw));
        } catch (_) {}
        return defaults;
    }

    save() {
        try {
            localStorage.setItem('bj_stats_v2', JSON.stringify(this.data));
        } catch (_) {}
    }

    get unlocked() { return this.data.unlockedAchievements; }

    recordGame(result, bet, isBlackjack = false, isSplit = false, isDouble = false) {
        this.data.totalGames++;
        if (result === 'win') {
            this.data.totalWins++;
            this.data.currentStreak++;
            this.data.lossStreak = 0;
            if (this.data.currentStreak > this.data.bestStreak) {
                this.data.bestStreak = this.data.currentStreak;
            }
            const winAmount = isBlackjack ? Math.floor(bet * CONFIG.blackjackPayout) : bet;
            this.data.totalChipsWon += winAmount;
            if (isBlackjack) this.data.blackjackCount++;
            if (isSplit) this.data.splitWins++;
            if (isDouble) this.data.doubleWins++;
            // 不输连胜
            this.data.currentNonLoseStreak = (this.data.currentNonLoseStreak || 0) + 1;
            if (this.data.currentNonLoseStreak > this.data.bestNonLoseStreak) {
                this.data.bestNonLoseStreak = this.data.currentNonLoseStreak;
            }
        } else if (result === 'lose') {
            this.data.totalLosses++;
            this.data.totalChipsLost += bet;
            this.data.currentStreak = 0;
            this.data.lossStreak = (this.data.lossStreak || 0) + 1;
            if (this.data.lossStreak > this.data.bestLossStreak) {
                this.data.bestLossStreak = this.data.lossStreak;
            }
            // 不输连胜重置
            this.data.currentNonLoseStreak = 0;
        } else {
            this.data.totalPushes++;
            this.data.lossStreak = 0;
            // 平局也算不输
            this.data.currentNonLoseStreak = (this.data.currentNonLoseStreak || 0) + 1;
            if (this.data.currentNonLoseStreak > this.data.bestNonLoseStreak) {
                this.data.bestNonLoseStreak = this.data.currentNonLoseStreak;
            }
        }
        if (bet > this.data.maxBet) this.data.maxBet = bet;
        this.data.totalBet += bet;
        this._checkAchievements();
        this.save();
    }

    // 每局结算后调用一次：记录跨局/单局维度的成就数据
    recordRound({ naturalBlackjack = false, handsCount = 1, allWon = false, netWin = 0 } = {}) {
        this.data.consecutiveBlackjacks = naturalBlackjack ? this.data.consecutiveBlackjacks + 1 : 0;
        if (handsCount === 4 && allWon) this.data.quadSplitWins++;
        if (netWin > this.data.biggestRoundWin) this.data.biggestRoundWin = netWin;
        if (this.data.postBankrupt && netWin > 0) {
            this.data.postBankruptChipsWon += netWin;
            if (this.data.postBankruptChipsWon >= 1000) this.data.postBankrupt = false;
        }
        this._checkAchievements();
        this.save();
    }

    recordBankrupt() {
        this.data.bankruptCount++;
        this.data.postBankrupt = true;
        this.data.postBankruptChipsWon = 0;
        this._checkAchievements();
        this.save();
    }

    recordInsuranceWin(payout = 0) {
        this.data.insuranceWins++;
        this.data.totalChipsWon += payout;
        this._checkAchievements();
        this.save();
    }

    updateChips(chips) {
        if (chips > this.data.peakChips) this.data.peakChips = chips;
        if (chips < this.data.lowestChips) this.data.lowestChips = chips;
        this._checkComeback(chips);
    }

    _checkComeback(chips) {
        if (chips < 100) {
            if (this.data.comebackLowMark === 0) this.data.comebackLowMark = chips;
        } else if (this.data.comebackLowMark > 0 && chips >= this.data.comebackLowMark + 500) {
            this.data.comebackCount++;
            this.data.comebackLowMark = 0; // 重置，可再次触发
            this._checkAchievements();
            this.save();
        }
    }

    _checkAchievements() {
        this._checkNewAchievements = [];
        for (const ach of ACHIEVEMENTS) {
            if (!this.data.unlockedAchievements.includes(ach.id) && ach.check(this.data)) {
                this.data.unlockedAchievements.push(ach.id);
                this._checkNewAchievements.push(ach);
            }
        }
    }

    getNewAchievements() {
        const list = [...this._checkNewAchievements];
        this._checkNewAchievements = [];
        return list;
    }

    getStats() {
        const d = this.data;
        const winRate = d.totalGames > 0 ? (d.totalWins / d.totalGames * 100).toFixed(1) : '0.0';
        return {
            totalGames: d.totalGames,
            totalWins: d.totalWins,
            totalLosses: d.totalLosses,
            totalPushes: d.totalPushes,
            winRate: winRate,
            currentStreak: d.currentStreak,
            bestStreak: d.bestStreak,
            blackjackCount: d.blackjackCount,
            totalChipsWon: d.totalChipsWon,
            totalChipsLost: d.totalChipsLost || 0,
            totalBet: d.totalBet,
            maxBet: d.maxBet,
            splitWins: d.splitWins,
            doubleWins: d.doubleWins,
            insuranceWins: d.insuranceWins,
            peakChips: d.peakChips,
            bankruptCount: d.bankruptCount,
            lossStreak: d.lossStreak || 0,
            bestLossStreak: d.bestLossStreak || 0,
            // 扩展统计
            allInWins: d.allInWins || 0,
            soft21Count: d.soft21Count || 0,
            doubleBustCount: d.doubleBustCount || 0,
            doubleUseCount: d.doubleUseCount || 0,
            splitUseCount: d.splitUseCount || 0,
            bestNonLoseStreak: d.bestNonLoseStreak || 0,
            // 衍生统计
            netChips: (d.totalChipsWon || 0) - (d.totalChipsLost || 0),
            avgBet: d.totalGames > 0 ? (d.totalBet / d.totalGames).toFixed(1) : '0.0',
            blackjackRate: d.totalGames > 0 ? (d.blackjackCount / d.totalGames * 100).toFixed(1) : '0.0',
            unlockedCount: d.unlockedAchievements.length,
            totalAchievements: ACHIEVEMENTS.length,
        };
    }
}
