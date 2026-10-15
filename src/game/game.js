// 游戏主类：状态、下注、发牌判定、DOM 渲染

import { CONFIG, getCardColor } from './config.js';
import { SoundFX } from './sound.js';
import { Deck, Hand } from './cards.js';
import { ACHIEVEMENTS } from './achievements.js';

export class Game {
    constructor() {
        // DOM
        this.el = {};
        this._cacheDOM();

        // 状态
        this.deck = new Deck();
        this.playerHands = [];
        this.dealerHand = new Hand(0);
        this.currentHandIndex = 0;
        this.state = 'idle'; // idle | betting | playing | dealerTurn | gameOver
        this.chips = CONFIG.initialChips;
        this.currentBet = 0;
        this.lastBet = 0; // 上一局下注额（同注再战用）
        this.insuranceBet = 0;
        this.insuranceActive = false;
        this.waitingForInsurance = false;
        this.splitCount = 0;
        this.maxSplitHands = 4;
        // 牌对象 → DOM元素 缓存（重渲染复用，避免动画重播）
        this._cardEls = new WeakMap();
        // 重生确认状态
        this.rebornStep = 0;

        // 音效引擎
        this.sfx = new SoundFX();

        // 统计
        this.stats = new StatsManager();

        // 从localStorage恢复筹码
        this._loadChips();

        this._bindEvents();
        this._renderBetChips();
        this._updateChipDisplay();
        this._updateShoeInfo();
        this._updateStatsUI();
        this._enterState('idle');
    }

    // ---- DOM 缓存 ----
    _cacheDOM() {
        const id = (n) => document.getElementById(n);
        this.el = {
            dealerHand: id('dealerHand'),
            dealerScore: id('dealerScoreDisplay'),
            playerHandsContainer: id('playerHandsContainer'),
            playerScore: id('playerScoreDisplay'),
            gameMessage: id('gameMessage'),
            btnHit: id('btnHit'),
            btnStand: id('btnStand'),
            btnDouble: id('btnDouble'),
            btnSplit: id('btnSplit'),
            btnReset: id('btnReset'),
            btnRebuy: id('btnRebuy'),
            btnClearBet: id('btnClearBet'),
            btnRebet: id('btnRebet'),
            btnDeal: id('btnDeal'),
            btnStatsToggle: id('btnStatsToggle'),
            btnHelpToggle: id('btnHelpToggle'),
            btnSoundToggle: id('btnSoundToggle'),
            btnCloseStats: id('btnCloseStats'),
            statsOverlay: id('statsOverlay'),
            statsGrid: id('statsGrid'),
            achList: id('achList'),
            helpOverlay: id('helpOverlay'),
            btnCloseHelp: id('btnCloseHelp'),
            btnReborn: id('btnReborn'),
            rebornOverlay: id('rebornOverlay'),
            rebornTitle: id('rebornTitle'),
            rebornDesc: id('rebornDesc'),
            rebornHint: id('rebornHint'),
            btnRebornConfirm: id('btnRebornConfirm'),
            btnCloseReborn: id('btnCloseReborn'),
            dot1: id('dot1'),
            dot2: id('dot2'),
            dot3: id('dot3'),
            chipAmount: id('chipAmount'),
            betAmount: id('betAmount'),
            betChips: id('betChips'),
            bettingArea: id('bettingArea'),
            insuranceArea: id('insuranceArea'),
            insuranceCost: id('insuranceCost'),
            btnInsuranceYes: id('btnInsuranceYes'),
            btnInsuranceNo: id('btnInsuranceNo'),
            wins: id('wins'),
            pushes: id('pushes'),
            losses: id('losses'),
            shoeCount: id('shoeCount'),
            shoeInfo: id('shoeInfo'),
            achToast: id('achievementToast'),
            achToastIcon: id('achToastIcon'),
            achToastTitle: id('achToastTitle'),
            achToastDesc: id('achToastDesc'),
            playerArea: id('playerArea'),
            sideAchList: id('sideAchList'),
            sideStatsGrid: id('sideStatsGrid'),
        };
    }

    // ---- 状态机 ----
    _enterState(newState) {
        this.state = newState;
        this._updateButtons();
    }

    // ---- 按钮状态 ----
    _updateButtons() {
        const s = this.state;
        const isPlaying = s === 'playing';
        const isDealer = s === 'dealerTurn';
        const isGameOver = s === 'gameOver';
        const isIdle = s === 'idle' && !this.waitingForInsurance;
        // 下注区在下注与结算后两个状态可见（保险等待时隐藏）
        const showBetting = (s === 'idle' || s === 'gameOver') && !this.waitingForInsurance;

        this.el.btnHit.disabled = !isPlaying;
        this.el.btnStand.disabled = !isPlaying;
        this.el.btnDouble.disabled = !this._canDoubleDown();
        this.el.btnSplit.disabled = !this._canSplit();
        this.el.btnDeal.disabled = !isIdle || this.currentBet < CONFIG.minBet || this.chips < this.currentBet;
        this.el.btnClearBet.disabled = !showBetting || this.currentBet === 0;
        // 同注再战：结算后/下注时沿用上局赌注直接开局
        this.el.btnRebet.disabled = !showBetting ||
            this.lastBet < CONFIG.minBet || this.lastBet > this.chips || this.lastBet > CONFIG.maxBet;
        this.el.btnRebet.textContent = this.lastBet > 0 ? '🔁 同注再战 ' + this.lastBet : '🔁 同注再战';

        // 破产（筹码不足以下最低注）时显示重新开始按钮
        const broke = this.chips < CONFIG.minBet && !this.waitingForInsurance;
        this.el.btnRebuy.classList.toggle('hidden-btn', !(broke && (s === 'idle' || s === 'gameOver')));

        // 右下角按钮仅用于重置到可下注状态，不发牌
        this.el.btnReset.textContent = '🔄 重新下注';
        this.el.btnReset.disabled = isDealer;

        // 下注区域可见性（见 showBetting）
        this.el.bettingArea.classList.toggle('hidden', !showBetting);
    }

    _canDoubleDown() {
        if (this.state !== 'playing') return false;
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand || hand.isDone) return false;
        if (!hand.canDoubleDown) return false;
        // 筹码要够加倍
        return this.chips >= hand.bet;
    }

    _canSplit() {
        if (this.state !== 'playing') return false;
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand || hand.isDone) return false;
        if (!hand.canSplit) return false;
        if (this.splitCount >= this.maxSplitHands) return false;
        // 筹码要够分牌（下注同额）
        return this.chips >= hand.bet;
    }

    // ---- 下注筹码渲染 ----
    _renderBetChips() {
        const denominations = [10, 25, 50, 100, 200, 500];
        this.el.betChips.innerHTML = '';
        for (const denom of denominations) {
            if (denom > CONFIG.maxBet) continue;
            const btn = document.createElement('button');
            btn.className = 'bet-chip-btn';
            btn.textContent = denom;
            btn.dataset.value = denom;
            btn.addEventListener('click', () => this._addBet(denom));
            btn.addEventListener('mouseenter', () => this.sfx.init());
            this.el.betChips.appendChild(btn);
        }
    }

    _addBet(amount) {
        if (this.state !== 'idle') return;
        const newBet = this.currentBet + amount;
        if (newBet > this.chips) return;
        if (newBet > CONFIG.maxBet) return;
        this.currentBet = newBet;
        this.el.betAmount.textContent = this.currentBet;
        this.sfx.chip();
        this._updateButtons();
    }

    _clearBet() {
        this.currentBet = 0;
        this.el.betAmount.textContent = '0';
        this._updateButtons();
    }

    // 同注再战：沿用上局赌注并直接发牌
    rebet() {
        if (this.state === 'gameOver') this.resetGame(); // 清桌进入下注状态
        if (this.state !== 'idle') return;
        if (this.lastBet < CONFIG.minBet || this.lastBet > this.chips || this.lastBet > CONFIG.maxBet) return;
        this.currentBet = this.lastBet;
        this.el.betAmount.textContent = this.currentBet;
        this.startRound();
    }

    // ---- 筹码显示 ----
    _updateChipDisplay() {
        this.el.chipAmount.textContent = this.chips;
        this.el.chipAmount.classList.toggle('negative', this.chips < 0);
        this.stats.updateChips(this.chips);
    }

    // ---- 牌靴信息 ----
    _updateShoeInfo() {
        const rem = this.deck.remaining;
        this.el.shoeCount.textContent = rem;
        const warn = rem <= CONFIG.reshuffleThreshold;
        this.el.shoeInfo.querySelector('span').style.color = warn ? '#cc8844' : '#6a7a5a';
    }

    // ---- 发牌 ----
    startRound() {
        if (this.state !== 'idle') return;
        if (this.currentBet < CONFIG.minBet) {
            this._showMessage('请先下注！', '');
            return;
        }
        if (this.currentBet > this.chips) {
            this._showMessage('筹码不足！', 'lose');
            return;
        }

        // 检查是否需要重新洗牌
        if (this.deck.needsReshuffle) {
            this.deck.shuffle();
            this.sfx.shuffle();
        }

        // 记录本局下注额供「同注再战」使用
        this.lastBet = this.currentBet;

        // 扣筹码
        this.chips -= this.currentBet;
        this._updateChipDisplay();
        this._saveChips();

        // 重置
        this.playerHands = [new Hand(this.currentBet)];
        this.dealerHand = new Hand(0);
        this.currentHandIndex = 0;
        this.splitCount = 0;
        this.insuranceActive = false;
        this.insuranceBet = 0;
        this.waitingForInsurance = false;

        // 发牌：玩家2张，庄家2张
        this.playerHands[0].addCard(this.deck.deal());
        this.sfx.cardDeal(0);
        this.dealerHand.addCard(this.deck.deal());
        this.sfx.cardDeal(0.12);
        this.playerHands[0].addCard(this.deck.deal());
        this.sfx.cardDeal(0.24);
        this.dealerHand.addCard(this.deck.deal());
        this.sfx.cardDeal(0.36);

        this._renderAll();
        this._updateShoeInfo();

        // 检查庄家明牌是否为A → 进入保险流程
        if (this.dealerHand.cards[0].rank === 'A') {
            this._offerInsurance();
            return;
        }

        this._afterDeal();
    }

    _offerInsurance() {
        const cost = Math.floor(this.currentBet / 2);
        if (this.chips < cost) {
            // 筹码不够买保险，直接跳过
            this._afterDeal();
            return;
        }
        this.waitingForInsurance = true;
        this.el.insuranceCost.textContent = cost;
        this.el.insuranceArea.classList.remove('hidden');
        this._showMessage('庄家明牌为A，是否购买保险？', '');
        // 保持当前状态，不发牌按钮可用
        this._updateButtons();
    }

    _handleInsurance(buy) {
        if (!this.waitingForInsurance) return;
        this.waitingForInsurance = false;
        this.el.insuranceArea.classList.add('hidden');

        if (buy) {
            const cost = Math.floor(this.currentBet / 2);
            this.insuranceBet = cost;
            this.chips -= cost;
            this._updateChipDisplay();
            this._saveChips();
            this.insuranceActive = true;
            this.sfx.chip();
        } else {
            this.sfx.click();
        }

        // 检查庄家是否黑杰克
        if (this.dealerHand.isBlackjack) {
            if (this.insuranceActive) {
                // 保险赔付 2:1；主注照输，净损失为赌注一半
                const payout = this.insuranceBet * 2;
                this.chips += payout;
                this.stats.recordInsuranceWin(payout);
                this.stats.recordGame('lose', this.currentBet);
                this.stats.recordRound({ handsCount: 1, netWin: payout - this.insuranceBet - this.currentBet });
                this._updateChipDisplay();
                this._endRound('lose', '庄家黑杰克！保险赔付 ' + payout + '，主注输 ' + this.currentBet + '（净亏 ' + (this.currentBet - this.insuranceBet) + '）💀', 'lose');
            } else {
                this.stats.recordGame('lose', this.currentBet);
                this._endRound('lose', '庄家黑杰克！你输了... 💀', 'lose');
            }
            return;
        }

        // 保险不中，保险金已扣
        if (this.insuranceActive) {
            this._showMessage('保险不中，继续游戏', '');
        }

        this._afterDeal();
    }

    _afterDeal() {
        // 检查玩家黑杰克
        if (this.playerHands[0].isBlackjack) {
            if (this.dealerHand.isBlackjack) {
                // 平局
                this.chips += this.currentBet; // 退回本金
                this._updateChipDisplay();
                this.stats.recordGame('push', this.currentBet);
                this.stats.recordRound({ naturalBlackjack: true, handsCount: 1, allWon: false, netWin: 0 });
                this._endRound('push', '双方都是黑杰克！平局 🤝', 'push');
            } else {
                const payout = this.currentBet + Math.floor(this.currentBet * CONFIG.blackjackPayout);
                this.chips += payout;
                this._updateChipDisplay();
                this.stats.recordGame('win', this.currentBet, true);
                this.stats.recordRound({ naturalBlackjack: true, handsCount: 1, allWon: true, netWin: payout - this.currentBet });
                this._endRound('win', '🎉 黑杰克！赢得 ' + (payout - this.currentBet) + ' 筹码！', 'blackjack-msg');
            }
            return;
        }

        // 检查庄家黑杰克（明牌10时peek直接结算；明牌A未买保险）
        if (this.dealerHand.isBlackjack) {
            // 玩家不是黑杰克，输
            this.stats.recordGame('lose', this.currentBet);
            this.stats.recordRound({ handsCount: 1, allWon: false, netWin: -this.currentBet });
            this._endRound('lose', '庄家黑杰克！你输了... 💀', 'lose');
            return;
        }

        // 正常进入玩家回合
        this._enterState('playing');
        this._showMessage('你的回合，要牌还是停牌？', '');
        this._renderAll();
    }

    // ---- 玩家操作 ----
    hit() {
        if (this.state !== 'playing') return;
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand || hand.isDone) return;

        hand.addCard(this.deck.deal());
        this._renderAll();
        this._updateShoeInfo();

        if (hand.isBust) {
            hand.isDone = true;
            this.sfx.bust();
            this._showMessage('💥 爆牌了！', 'lose');
            this._advanceToNextHandOrDealer();
        } else if (hand.score === 21) {
            hand.isDone = true;
            // 记录软21(A算11达到21)
            if (hand.isSoft) {
                this.stats.data.soft21Count = (this.stats.data.soft21Count || 0) + 1;
                this.stats.save();
            }
            this.sfx.stand();
            this._showMessage('21点！', '');
            this._advanceToNextHandOrDealer();
        } else {
            this.sfx.hit();
            this._showMessage('继续要牌还是停牌？', '');
        }
    }

    stand() {
        if (this.state !== 'playing') return;
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand || hand.isDone) return;
        hand.isDone = true;
        this.sfx.stand();
        this._advanceToNextHandOrDealer();
    }

    doubleDown() {
        if (this.state !== 'playing') return;
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand || hand.isDone || !hand.canDoubleDown) return;
        if (this.chips < hand.bet) return;

        // 记录加倍使用次数
        this.stats.data.doubleUseCount = (this.stats.data.doubleUseCount || 0) + 1;

        // 加倍赌注
        this.chips -= hand.bet;
        this._saveChips();
        hand.bet *= 2;
        hand.isDoubled = true;
        this.sfx.double();
        this._updateChipDisplay();

        // 只拿一张牌
        hand.addCard(this.deck.deal());
        hand.isDone = true;
        this._renderAll();
        this._updateShoeInfo();

        if (hand.isBust) {
            // 记录加倍后爆牌
            this.stats.data.doubleBustCount = (this.stats.data.doubleBustCount || 0) + 1;
            this.sfx.bust();
            this._showMessage('💥 加倍后爆牌！', 'lose');
        } else {
            this._showMessage('加倍成功！', '');
        }
        this.stats.save();

        this._advanceToNextHandOrDealer();
    }

    split() {
        if (this.state !== 'playing') return;
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand || hand.isDone || !hand.canSplit) return;
        if (this.chips < hand.bet) return;
        if (this.splitCount >= this.maxSplitHands) return;

        // 记录分牌使用次数
        this.stats.data.splitUseCount = (this.stats.data.splitUseCount || 0) + 1;
        this.stats.save();

        // 分牌：创建两手
        this.splitCount++;
        const isAces = hand.cards[0].rank === 'A';
        const card1 = hand.cards[0];
        const card2 = hand.cards[1];
        const newHand1 = new Hand(hand.bet);
        const newHand2 = new Hand(hand.bet);
        newHand1.fromSplit = true;
        newHand2.fromSplit = true;
        newHand1.addCard(card1);
        newHand2.addCard(card2);

        // 各补一张牌
        newHand1.addCard(this.deck.deal());
        newHand2.addCard(this.deck.deal());

        // 分牌A：各拿一张后强制停牌，不可再分/再加倍
        if (isAces) {
            newHand1.isSplitAces = true;
            newHand2.isSplitAces = true;
            newHand1.isDone = true;
            newHand2.isDone = true;
        }

        // 扣筹码（第二手下注）
        this.chips -= hand.bet;
        this._updateChipDisplay();
        this._saveChips();
        this.sfx.split();

        // 替换当前手牌，索引保持在当前位置（newHand1 插在原手牌位置）
        this.playerHands.splice(this.currentHandIndex, 1, newHand1, newHand2);

        this._renderAll();
        this._updateShoeInfo();
        this._showMessage(isAces ? '分牌A！各拿一张，自动停牌' : '分牌完成！', '');

        // 检查分出的手牌是否21点或爆牌（分牌A已全部isDone）
        this._checkCurrentHand();
    }

    _checkCurrentHand() {
        const hand = this.playerHands[this.currentHandIndex];
        if (!hand) return;
        if (hand.isDone) {
            // 分牌A等已完成的手牌，直接流转
            this._advanceToNextHandOrDealer();
            return;
        }
        if (hand.isBlackjack) {
            hand.isDone = true;
            this._showMessage('分牌黑杰克！', '');
            this._advanceToNextHandOrDealer();
        } else if (hand.isBust) {
            hand.isDone = true;
            this._showMessage('💥 爆牌！', 'lose');
            this._advanceToNextHandOrDealer();
        } else {
            this._updateButtons();
            this._renderAll();
        }
    }

    // ---- 多手牌流转 ----
    _advanceToNextHandOrDealer() {
        // 找下一个未完成的hand
        this.currentHandIndex++;
        while (this.currentHandIndex < this.playerHands.length) {
            const h = this.playerHands[this.currentHandIndex];
            if (!h.isDone) {
                this._renderAll();
                this._showMessage('操作第 ' + (this.currentHandIndex + 1) + ' 手牌', '');
                this._updateButtons();
                return;
            }
            this.currentHandIndex++;
        }

        // 所有手牌已完成，庄家回合
        this._dealerTurn();
    }

    // ---- 庄家回合 ----
    _dealerTurn() {
        this._enterState('dealerTurn');
        this._showMessage('庄家回合...', '');
        this._renderAll(true);

        // 检查玩家是否全爆
        const allBust = this.playerHands.every(h => h.isBust);
        if (allBust) {
            // 所有手牌都爆了，直接结算
            this._finalSettle();
            return;
        }

        // 庄家出牌逻辑
        const step = () => {
            if (this.state !== 'dealerTurn') return;

            const score = this.dealerHand.score;
            const shouldHit = score < CONFIG.dealerStandOn ||
                (CONFIG.dealerHitsSoft17 && score === 17 && this.dealerHand.isSoft);

            if (shouldHit) {
                this.dealerHand.addCard(this.deck.deal());
                this.sfx.cardDeal();
                this._renderAll(true);
                this._updateShoeInfo();

                if (this.dealerHand.isBust) {
                    this._finalSettle();
                    return;
                }
                if (this.dealerHand.score >= CONFIG.dealerStandOn) {
                    this._finalSettle();
                    return;
                }
                setTimeout(step, 400);
            } else {
                this._finalSettle();
            }
        };

        setTimeout(step, 500);
    }

    // ---- 结算 ----
    _finalSettle() {
        this._enterState('gameOver');
        this._renderAll(true);

        const dScore = this.dealerHand.score;
        const dBlackjack = this.dealerHand.isBlackjack;
        const dBust = this.dealerHand.isBust;

        let totalWin = 0;
        let totalLose = 0;
        let totalPush = 0;
        let totalLoseAmt = 0;
        const results = [];

        for (let i = 0; i < this.playerHands.length; i++) {
            const hand = this.playerHands[i];
            const pScore = hand.score;
            const pBust = hand.isBust;
            const pBlackjack = hand.isBlackjack;

            let result;
            let winAmount = 0;

            if (pBust) {
                result = 'lose';
            } else if (dBust) {
                result = 'win';
                winAmount = hand.bet;
            } else if (pBlackjack && !dBlackjack) {
                result = 'win';
                winAmount = Math.floor(hand.bet * CONFIG.blackjackPayout);
            } else if (dBlackjack && !pBlackjack) {
                result = 'lose';
            } else if (pScore > dScore) {
                result = 'win';
                winAmount = hand.bet;
            } else if (pScore < dScore) {
                result = 'lose';
            } else {
                result = 'push';
                winAmount = hand.bet; // 退回本金
            }

            if (result === 'win') {
                this.chips += hand.bet + winAmount;
                totalWin += winAmount;
            } else if (result === 'push') {
                this.chips += hand.bet;
                totalPush++;
            } else {
                totalLose++;
                totalLoseAmt += hand.bet;
            }

            results.push(result);

            // 记录统计
            this.stats.recordGame(result, hand.bet,
                hand.isBlackjack && this.splitCount === 0,
                this.splitCount > 0,
                hand.isDoubled);

            // 记录全押胜场(下注>=1000)
            if (result === 'win' && hand.bet >= 1000) {
                this.stats.data.allInWins = (this.stats.data.allInWins || 0) + 1;
                this.stats.save();
            }
        }

        this._updateChipDisplay();
        this._updateStatsUI();

        // 结算音效
        const hasBlackjack = this.playerHands.some(h => h.isBlackjack);
        if (this.chips < CONFIG.minBet) {
            this.sfx.bankrupt();
        } else if (hasBlackjack && totalLose === 0) {
            this.sfx.blackjack();
        } else if (totalWin > 0 && totalLose === 0) {
            this.sfx.win();
        } else if (totalWin > 0) {
            this.sfx.win();
        } else if (totalPush > 0 && totalLose === 0) {
            this.sfx.push();
        } else {
            this.sfx.lose();
        }

        // 显示消息
        if (this.chips < CONFIG.minBet) {
            this._showMessage('💸 破产了！点击「重新开始」获得 5000 筹码再战', 'lose');
        } else if (totalWin > 0 && totalLose === 0) {
            this._showMessage('🎉 全胜！赢得 ' + totalWin + ' 筹码！', 'win');
        } else if (totalWin > 0) {
            this._showMessage('🎉 赢得 ' + totalWin + ' 筹码！', 'win');
        } else if (totalPush > 0 && totalLose === 0) {
            this._showMessage('平局 🤝', 'push');
        } else {
            this._showMessage('输了... 再试一次！ 💀', 'lose');
        }

        // 本局汇总统计（成就判定）
        this.stats.recordRound({
            naturalBlackjack: this.playerHands.some(h => h.isBlackjack),
            handsCount: this.playerHands.length,
            allWon: results.length > 0 && results.every(r => r === 'win'),
            netWin: totalWin - totalLoseAmt,
        });

        this._saveChips();
        this._updateButtons();
        this._renderAll(true);
    }

    // 兼容老版 _endRound (用于黑杰克/保险直接结算)
    _endRound(result, message, msgClass) {
        this._enterState('gameOver');
        if (msgClass === 'blackjack-msg') this.sfx.blackjack();
        else if (result === 'win') this.sfx.win();
        else if (result === 'push') this.sfx.push();
        else this.sfx.lose();
        this._showMessage(message, msgClass);
        this._updateStatsUI();
        this._saveChips();
        this._updateButtons();
        this._renderAll(true);
        this._checkAchievements();
    }

    // ---- 成就检查 ----
    _checkAchievements() {
        const newAchs = this.stats.getNewAchievements();
        for (const ach of newAchs) {
            this._showAchievementToast(ach);
        }
    }

    _showAchievementToast(ach) {
        this.el.achToastIcon.textContent = ach.icon;
        this.el.achToastTitle.textContent = '🏅 ' + ach.name;
        this.el.achToastDesc.textContent = ach.desc;
        this.sfx.achievement();
        this.el.achToast.classList.add('show');
        setTimeout(() => {
            this.el.achToast.classList.remove('show');
        }, 3000);
    }

    // ---- 渲染 ----
    _renderAll(revealDealer = false) {
        this._renderDealerHand(revealDealer);
        this._renderPlayerHands();
        this._updateScoreDisplay(revealDealer);
    }

    _renderDealerHand(revealDealer) {
        this.el.dealerHand.innerHTML = '';
        const hand = this.dealerHand;
        for (let i = 0; i < hand.cards.length; i++) {
            const card = hand.cards[i];
            const isHidden = (i === 1 && !revealDealer && this.state !== 'gameOver' && this.state !== 'dealerTurn');
            this.el.dealerHand.appendChild(this._createCardElement(card, isHidden));
        }
    }

    _renderPlayerHands() {
        this.el.playerHandsContainer.innerHTML = '';
        for (let i = 0; i < this.playerHands.length; i++) {
            const hand = this.playerHands[i];
            const container = document.createElement('div');
            container.className = 'hand-container' + (i === this.currentHandIndex && this.state === 'playing' ? ' active-hand' : '');

            if (this.playerHands.length > 1) {
                const label = document.createElement('div');
                label.className = 'hand-label';
                label.textContent = '手牌 ' + (i + 1) + ' 点数: ' + hand.score;
                if (hand.isDone) {
                    label.textContent += hand.isBust ? ' 💥' : ' ✓';
                }
                label.innerHTML += ' <span class="hand-bet">下注: ' + hand.bet + '</span>';
                container.appendChild(label);
            }

            const handDiv = document.createElement('div');
            handDiv.className = 'hand';
            for (const card of hand.cards) {
                handDiv.appendChild(this._createCardElement(card, false));
            }
            container.appendChild(handDiv);
            this.el.playerHandsContainer.appendChild(container);
        }
    }

    _updateScoreDisplay(revealDealer) {
        // 玩家分数
        const currentHand = this.playerHands[this.currentHandIndex] || this.playerHands[0];
        if (currentHand) {
            const pScore = currentHand.score;
            this.el.playerScore.textContent = pScore;
            this.el.playerScore.className = 'score-tag' + (pScore > 21 ? ' bust' : '') +
                (currentHand.isBlackjack ? ' blackjack' : '');
        }

        // 庄家分数
        const revealed = revealDealer || this.state === 'gameOver' || this.state === 'dealerTurn';
        if (revealed) {
            const dScore = this.dealerHand.score;
            this.el.dealerScore.textContent = dScore;
            this.el.dealerScore.className = 'score-tag' + (dScore > 21 ? ' bust' : '') +
                (this.dealerHand.isBlackjack ? ' blackjack' : '');
        } else {
            // 暗牌期间只显示明牌点数，不套用结算样式
            this.el.dealerScore.textContent = '?';
            this.el.dealerScore.className = 'score-tag';
        }
    }

    _createCardElement(card, hidden = false) {
        // 复用已有牌元素（避免重渲染重播动画、支持暗牌翻面）
        const cached = this._cardEls && this._cardEls.get(card);
        if (cached) {
            // 旧牌不再重播入场动画
            cached.classList.remove('card-enter');
            if (cached.dataset.hidden === '1' && !hidden) {
                // 暗牌揭示：填充正面并翻面
                // 补上 card 类使 .card .rank-suit-* 角落定位与配色生效
                cached._front.className = 'card-flip-front card ' + getCardColor(card.suit);
                this._fillCardFace(cached._front, card);
                const inner = cached._inner;
                this.sfx.cardFlip();
                requestAnimationFrame(() => requestAnimationFrame(() => inner.classList.add('flipped')));
                cached.dataset.hidden = '0';
            }
            return cached;
        }

        if (hidden) {
            // 使用翻牌容器
            const container = document.createElement('div');
            container.className = 'card-flip-container card-enter';
            container.dataset.hidden = '1';

            const inner = document.createElement('div');
            inner.className = 'card-flip-inner';
            container._inner = inner;

            // 背面（显示）
            const back = document.createElement('div');
            back.className = 'card-back card-flip-back';
            back.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:10px;' +
                'background:linear-gradient(135deg,#1a3a7a,#0f2350);border:2px solid #b8860b;' +
                'background-image:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,215,0,0.06) 10px,rgba(255,215,0,0.06) 11px),' +
                'repeating-linear-gradient(-45deg,transparent,transparent 10px,rgba(255,215,0,0.06) 10px,rgba(255,215,0,0.06) 11px);' +
                'display:flex;justify-content:center;align-items:center;';
            const pattern = document.createElement('span');
            pattern.style.cssText = 'font-size:32px;opacity:0.3;letter-spacing:4px;color:rgba(255,215,0,0.2);';
            pattern.textContent = '♠♥♦♣';
            back.appendChild(pattern);

            // 正面（隐藏，揭示时填充）
            const front = document.createElement('div');
            front.className = 'card-flip-front';
            front.style.cssText = 'position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:10px;' +
                'background:#fcf9f2;border:1px solid #d4c9b0;transform:rotateY(180deg);' +
                'display:flex;flex-direction:column;justify-content:center;align-items:center;';
            container._front = front;

            inner.appendChild(back);
            inner.appendChild(front);
            container.appendChild(inner);
            this._cardEls.set(card, container);
            return container;
        }

        const div = document.createElement('div');
        const color = getCardColor(card.suit);
        div.className = `card ${color} card-enter`;
        this._fillCardFace(div, card);
        this._cardEls.set(card, div);
        return div;
    }

    _fillCardFace(el, card) {
        const color = getCardColor(card.suit);
        el.innerHTML = '';
        const top = document.createElement('div');
        top.className = 'rank-suit-top';
        top.innerHTML = `${card.rank}<br>${card.suit}`;
        el.appendChild(top);

        const center = document.createElement('div');
        center.className = `center-suit ${color}`;
        center.textContent = card.suit;
        el.appendChild(center);

        const bottom = document.createElement('div');
        bottom.className = 'rank-suit-bottom';
        bottom.innerHTML = `${card.rank}<br>${card.suit}`;
        el.appendChild(bottom);
    }

    // ---- 消息 ----
    _showMessage(text, type = '') {
        this.el.gameMessage.textContent = text;
        this.el.gameMessage.className = 'message';
        if (type) this.el.gameMessage.classList.add(type);
        // 弹出动画
        this.el.gameMessage.classList.remove('pop');
        void this.el.gameMessage.offsetWidth;
        this.el.gameMessage.classList.add('pop');
    }

    // ---- 统计UI ----
    _updateStatsUI() {
        const s = this.stats.getStats();
        this.el.wins.textContent = s.totalWins;
        this.el.pushes.textContent = s.totalPushes;
        this.el.losses.textContent = s.totalLosses;
        this._renderSideStats(s);
        this._renderSideAchievements();
    }

    _renderSideStats(s) {
        if (!this.el.sideStatsGrid) return;
        const netColor = s.netChips >= 0 ? 'green' : 'red';
        const items = [
            { label: '总场次', value: s.totalGames, cls: '' },
            { label: '胜场', value: s.totalWins, cls: 'green' },
            { label: '负场', value: s.totalLosses, cls: 'red' },
            { label: '平局', value: s.totalPushes, cls: '' },
            { label: '胜率', value: s.winRate + '%', cls: 'gold' },
            { label: '当前连胜', value: s.currentStreak, cls: 'gold' },
            { label: '最佳连胜', value: s.bestStreak, cls: 'gold' },
            { label: '最长不输', value: s.bestNonLoseStreak, cls: 'gold' },
            { label: '黑杰克', value: s.blackjackCount, cls: 'gold' },
            { label: '黑杰克率', value: s.blackjackRate + '%', cls: 'gold' },
            { label: '软21次数', value: s.soft21Count, cls: '' },
            { label: '累计赢筹码', value: s.totalChipsWon, cls: 'green' },
            { label: '累计输筹码', value: s.totalChipsLost, cls: 'red' },
            { label: '净赢筹码', value: s.netChips, cls: netColor },
            { label: '平均每局下注', value: s.avgBet, cls: '' },
            { label: '最大下注', value: s.maxBet, cls: 'gold' },
            { label: '分牌胜', value: s.splitWins, cls: '' },
            { label: '分牌次数', value: s.splitUseCount, cls: '' },
            { label: '加倍胜', value: s.doubleWins, cls: '' },
            { label: '加倍次数', value: s.doubleUseCount, cls: '' },
            { label: '加倍爆牌', value: s.doubleBustCount, cls: 'red' },
            { label: '保险胜', value: s.insuranceWins, cls: '' },
            { label: '全押胜', value: s.allInWins, cls: 'gold' },
            { label: '筹码峰值', value: s.peakChips, cls: 'gold' },
            { label: '当前连输', value: s.lossStreak, cls: 'red' },
            { label: '最高连输', value: s.bestLossStreak, cls: 'red' },
            { label: '破产次数', value: s.bankruptCount, cls: 'red' },
        ];
        this.el.sideStatsGrid.innerHTML = '';
        for (const item of items) {
            const div = document.createElement('div');
            div.className = 'side-stats-item';
            div.innerHTML = `<span class="stat-label">${item.label}</span><span class="stat-value ${item.cls}">${item.value}</span>`;
            this.el.sideStatsGrid.appendChild(div);
        }
    }

    _renderSideAchievements() {
        if (!this.el.sideAchList) return;
        this.el.sideAchList.innerHTML = '';
        for (const ach of ACHIEVEMENTS) {
            const unlocked = this.stats.unlocked.includes(ach.id);
            const div = document.createElement('div');
            div.className = 'side-ach-item' + (unlocked ? '' : ' locked');
            div.innerHTML = `
                <span class="ach-icon">${ach.icon}</span>
                <div class="ach-info">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
                <span class="ach-check">${unlocked ? '✅' : '🔒'}</span>
            `;
            this.el.sideAchList.appendChild(div);
        }
    }

    // ---- 筹码持久化 ----
    _saveChips() {
        try {
            localStorage.setItem('bj_chips_v2', this.chips.toString());
        } catch (_) {}
    }

    _loadChips() {
        try {
            const raw = localStorage.getItem('bj_chips_v2');
            if (raw !== null) {
                const val = parseInt(raw, 10);
                if (val >= 0) this.chips = val;
            }
        } catch (_) {}
    }

    // ---- 重置/新游戏 ----
    resetGame() {
        // 保险等待中取消：退还筹码、隐藏保险区
        if (this.waitingForInsurance) {
            this.waitingForInsurance = false;
            this.el.insuranceArea.classList.add('hidden');
            // 退还主注（已在startRound中扣除）
            this.chips += this.currentBet;
            this._updateChipDisplay();
        }

        // 如果游戏结束或空闲，直接进入下注状态
        if (this.state === 'gameOver' || this.state === 'idle') {
            this.playerHands = [];
            this.dealerHand = new Hand(0);
            this.currentHandIndex = 0;
            this.currentBet = 0;
            this.el.betAmount.textContent = '0';
            this.el.playerHandsContainer.innerHTML = '';
            this.el.dealerHand.innerHTML = '';
            this.el.playerScore.textContent = '0';
            this.el.playerScore.className = 'score-tag';
            this.el.dealerScore.textContent = '?';
            this.el.dealerScore.className = 'score-tag';
            this._enterState('idle');
            this.el.bettingArea.classList.remove('hidden');
            this._showMessage('下注后点击「发牌」开始', '');
            this._renderAll(true);
            this._updateButtons();
            return;
        }

        // 游戏中强行重置（退还筹码）
        if (this.state === 'playing' || this.state === 'dealerTurn') {
            // 退还当前下注
            for (const hand of this.playerHands) {
                this.chips += hand.bet;
            }
            this._updateChipDisplay();
            this.playerHands = [];
            this.dealerHand = new Hand(0);
            this.currentHandIndex = 0;
            this.currentBet = 0;
            this.el.betAmount.textContent = '0';
            this._enterState('idle');
            this.el.bettingArea.classList.remove('hidden');
            this._showMessage('已取消，重新下注', '');
            this._renderAll(true);
            this._updateButtons();
        }
    }

    // ---- 破产重开 ----
    rebuy() {
        if (this.chips >= CONFIG.minBet) return;
        this.stats.recordBankrupt();
        this._checkAchievements();
        this.chips = CONFIG.initialChips;
        this._saveChips();
        this._updateChipDisplay();
        // 复用重置流程回到下注状态
        this.resetGame();
        this.sfx.achievement();
        this._showMessage('🌅 重获 5000 筹码，卷土重来！', 'win');
    }

    // ---- 统计弹窗 ----
    _openStats() {
        const s = this.stats.getStats();
        const grid = this.el.statsGrid;
        grid.innerHTML = '';
        const netColor = s.netChips >= 0 ? 'green' : 'red';
        const items = [
            { label: '总场次', value: s.totalGames, cls: '' },
            { label: '胜场', value: s.totalWins, cls: 'green' },
            { label: '负场', value: s.totalLosses, cls: 'red' },
            { label: '平局', value: s.totalPushes, cls: '' },
            { label: '胜率', value: s.winRate + '%', cls: 'gold' },
            { label: '当前连胜', value: s.currentStreak, cls: 'gold' },
            { label: '最佳连胜', value: s.bestStreak, cls: 'gold' },
            { label: '最长不输', value: s.bestNonLoseStreak, cls: 'gold' },
            { label: '黑杰克次数', value: s.blackjackCount, cls: 'gold' },
            { label: '黑杰克率', value: s.blackjackRate + '%', cls: 'gold' },
            { label: '软21次数', value: s.soft21Count, cls: '' },
            { label: '累计赢得', value: s.totalChipsWon, cls: 'green' },
            { label: '累计输掉', value: s.totalChipsLost, cls: 'red' },
            { label: '净赢筹码', value: s.netChips, cls: netColor },
            { label: '平均每局下注', value: s.avgBet, cls: '' },
            { label: '最大下注', value: s.maxBet, cls: 'gold' },
            { label: '分牌胜', value: s.splitWins, cls: '' },
            { label: '分牌次数', value: s.splitUseCount, cls: '' },
            { label: '加倍胜', value: s.doubleWins, cls: '' },
            { label: '加倍次数', value: s.doubleUseCount, cls: '' },
            { label: '加倍爆牌', value: s.doubleBustCount, cls: 'red' },
            { label: '保险胜', value: s.insuranceWins, cls: '' },
            { label: '全押胜', value: s.allInWins, cls: 'gold' },
            { label: '筹码峰值', value: s.peakChips, cls: 'gold' },
            { label: '当前连输', value: s.lossStreak, cls: 'red' },
            { label: '最高连输', value: s.bestLossStreak, cls: 'red' },
            { label: '破产次数', value: s.bankruptCount, cls: 'red' },
        ];
        for (const item of items) {
            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `<div class="stat-label">${item.label}</div><div class="stat-value ${item.cls}">${item.value}</div>`;
            grid.appendChild(div);
        }

        // 成就列表
        const achList = this.el.achList;
        achList.innerHTML = '';
        for (const ach of ACHIEVEMENTS) {
            const unlocked = this.stats.unlocked.includes(ach.id);
            const div = document.createElement('div');
            div.className = 'ach-item' + (unlocked ? '' : ' locked');
            div.innerHTML = `
                <span class="ach-icon">${ach.icon}</span>
                <div class="ach-info">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
                <span class="ach-status">${unlocked ? '✅' : '🔒'}</span>
            `;
            achList.appendChild(div);
        }

        this.el.statsOverlay.classList.add('open');
    }

    _closeStats() {
        this.el.statsOverlay.classList.remove('open');
    }

    _openHelp() {
        this.el.helpOverlay.classList.add('open');
    }

    _closeHelp() {
        this.el.helpOverlay.classList.remove('open');
    }

    // ---- 重生确认 ----
    _openReborn() {
        this.rebornStep = 0;
        this._updateRebornUI();
        this.el.rebornOverlay.classList.add('open');
    }

    _closeReborn() {
        this.rebornStep = 0;
        this.el.rebornOverlay.classList.remove('open');
    }

    _updateRebornUI() {
        const step = this.rebornStep;
        // 更新圆点状态
        this.el.dot1.className = 'reborn-dot' + (step >= 1 ? ' active' : '');
        this.el.dot2.className = 'reborn-dot' + (step >= 2 ? ' active' : '');
        this.el.dot3.className = 'reborn-dot' + (step >= 3 ? ' active' : '');

        // 更新标题和描述
        const titles = ['确定要重生吗？', '真的确定吗？', '最后确认！'];
        const descs = [
            '这将清除所有游戏数据，包括筹码、统计和成就。',
            '你的所有进度将被永久删除，无法恢复！',
            '点击后将立即执行，所有数据将被清除！'
        ];
        const hints = ['点击下方按钮开始确认', '再次点击继续', '最后一次点击确认重生'];

        this.el.rebornTitle.textContent = titles[step];
        this.el.rebornDesc.textContent = descs[step];
        this.el.rebornHint.textContent = hints[step];

        // 更新按钮文字
        const btnTexts = ['确认重生', '继续确认', '执行重生！'];
        this.el.btnRebornConfirm.textContent = btnTexts[step];
    }

    _handleRebornClick() {
        this.rebornStep++;

        if (this.rebornStep >= 3) {
            // 第三次确认，执行重生
            this._executeReborn();
        } else {
            // 更新UI
            this._updateRebornUI();
        }
    }

    _executeReborn() {
        // 清除所有localStorage数据
        try {
            localStorage.removeItem('bj_chips_v2');
            localStorage.removeItem('bj_stats_v2');
        } catch (_) {}

        // 重置游戏状态
        this.chips = CONFIG.initialChips;
        this.currentBet = 0;
        this.lastBet = 0;
        this.insuranceBet = 0;
        this.insuranceActive = false;
        this.waitingForInsurance = false;
        this.splitCount = 0;
        this.playerHands = [];
        this.dealerHand = new Hand(0);
        this.currentHandIndex = 0;

        // 重新创建统计管理器
        this.stats = new StatsManager();

        // 更新UI
        this._updateChipDisplay();
        this._updateStatsUI();
        this._updateShoeInfo();
        this.resetGame();

        // 关闭弹窗
        this._closeReborn();

        this._showMessage('💀 重生成功！获得 5000 筹码', 'win');
    }

    // ---- 事件绑定 ----
    _bindEvents() {
        this.el.btnHit.addEventListener('click', () => this.hit());
        this.el.btnStand.addEventListener('click', () => this.stand());
        this.el.btnDouble.addEventListener('click', () => this.doubleDown());
        this.el.btnSplit.addEventListener('click', () => this.split());
        this.el.btnDeal.addEventListener('click', () => this.startRound());
        this.el.btnReset.addEventListener('click', () => {
            this.sfx.click();
            this.resetGame();
        });
        this.el.btnRebuy.addEventListener('click', () => this.rebuy());
        this.el.btnClearBet.addEventListener('click', () => this._clearBet());
        this.el.btnRebet.addEventListener('click', () => this.rebet());
        this.el.btnStatsToggle.addEventListener('click', () => {
            this.sfx.click();
            this._openStats();
        });
        this.el.btnCloseStats.addEventListener('click', () => this._closeStats());
        this.el.statsOverlay.addEventListener('click', (e) => {
            if (e.target === this.el.statsOverlay) this._closeStats();
        });
        this.el.btnHelpToggle.addEventListener('click', () => {
            this.sfx.click();
            this._openHelp();
        });
        this.el.btnCloseHelp.addEventListener('click', () => this._closeHelp());
        this.el.helpOverlay.addEventListener('click', (e) => {
            if (e.target === this.el.helpOverlay) this._closeHelp();
        });
        this.el.btnSoundToggle.addEventListener('click', () => {
            const on = this.sfx.toggle();
            this.el.btnSoundToggle.textContent = on ? '🔊' : '🔇';
        });
        this.el.btnReborn.addEventListener('click', () => this._openReborn());
        this.el.btnRebornConfirm.addEventListener('click', () => this._handleRebornClick());
        this.el.btnCloseReborn.addEventListener('click', () => this._closeReborn());
        this.el.rebornOverlay.addEventListener('click', (e) => {
            if (e.target === this.el.rebornOverlay) this._closeReborn();
        });
        this.el.btnInsuranceYes.addEventListener('click', () => this._handleInsurance(true));
        this.el.btnInsuranceNo.addEventListener('click', () => this._handleInsurance(false));

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // 不处理输入框中的按键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // 统计弹窗打开时，ESC关闭
            if (e.key === 'Escape' && this.el.statsOverlay.classList.contains('open')) {
                this._closeStats();
                return;
            }
            // 帮助弹窗打开时，ESC关闭
            if (e.key === 'Escape' && this.el.helpOverlay.classList.contains('open')) {
                this._closeHelp();
                return;
            }
            // 重生弹窗打开时，ESC关闭
            if (e.key === 'Escape' && this.el.rebornOverlay.classList.contains('open')) {
                this._closeReborn();
                return;
            }
            switch (e.key.toLowerCase()) {
                case 'h': if (!this.el.btnHit.disabled) this.hit(); break;
                case 's': if (!this.el.btnStand.disabled) this.stand(); break;
                case 'd': if (!this.el.btnDouble.disabled) this.doubleDown(); break;
                case 'p': if (!this.el.btnSplit.disabled) this.split(); break;
                case ' ': e.preventDefault(); if (!this.el.btnDeal.disabled) this.startRound(); break;
                case 'r': if (!this.el.btnReset.disabled) this.resetGame(); break;
                case 'm': {
                    const on = this.sfx.toggle();
                    this.el.btnSoundToggle.textContent = on ? '🔊' : '🔇';
                    break;
                }
            }
        });

        // 触屏优化：防止双击缩放
        document.addEventListener('dblclick', (e) => e.preventDefault());
    }
}
