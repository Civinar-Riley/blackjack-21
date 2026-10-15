// 音效引擎（原生 Web Audio，无外部依赖）

export class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        try {
            this.enabled = localStorage.getItem('bj_sound') !== 'off';
        } catch (_) {}
    }

    init() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.init();
        try {
            localStorage.setItem('bj_sound', this.enabled ? 'on' : 'off');
        } catch (_) {}
        return this.enabled;
    }

    // 主工具：振荡器音符
    _tone(freq, duration, type = 'sine', volume = 0.15, when = 0, slideTo = null) {
        if (!this.enabled) return;
        const ctx = this.init();
        if (!ctx) return;
        const t = ctx.currentTime + when;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    // 噪声工具（发牌/洗牌用）
    _noise(duration, volume = 0.1, filterFreq = 3000, when = 0) {
        if (!this.enabled) return;
        const ctx = this.init();
        if (!ctx) return;
        const t = ctx.currentTime + when;
        const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(t);
    }

    // 发牌 "嗒"
    cardDeal(when = 0) {
        this._noise(0.06, 0.12, 2400, when);
    }

    // 翻牌
    cardFlip() {
        this._noise(0.04, 0.1, 1800, 0);
        this._noise(0.05, 0.08, 3200, 0.05);
    }

    // 下注筹码声
    chip() {
        this._tone(2200, 0.04, 'square', 0.06);
        this._tone(1600, 0.05, 'square', 0.05, 0.03);
    }

    // 要牌
    hit() {
        this.cardDeal();
    }

    // 停牌
    stand() {
        this._tone(523, 0.08, 'triangle', 0.1);
        this._tone(392, 0.1, 'triangle', 0.08, 0.06);
    }

    // 加倍
    double() {
        this._tone(440, 0.07, 'triangle', 0.1);
        this._tone(660, 0.07, 'triangle', 0.1, 0.07);
        this._tone(880, 0.1, 'triangle', 0.1, 0.14);
    }

    // 分牌
    split() {
        this._noise(0.08, 0.1, 2000);
        this._tone(660, 0.06, 'triangle', 0.08, 0.05);
        this._tone(880, 0.08, 'triangle', 0.08, 0.12);
    }

    // 赢
    win() {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => this._tone(f, 0.14, 'triangle', 0.14, i * 0.09));
    }

    // 输
    lose() {
        this._tone(330, 0.2, 'sawtooth', 0.08, 0, 220);
        this._tone(220, 0.3, 'sawtooth', 0.08, 0.15, 130);
    }

    // 平局
    push() {
        this._tone(440, 0.1, 'triangle', 0.1);
        this._tone(440, 0.1, 'triangle', 0.1, 0.12);
    }

    // 黑杰克！
    blackjack() {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];
        notes.forEach((f, i) => this._tone(f, 0.16, 'triangle', 0.15, i * 0.07));
        notes.forEach((f, i) => this._tone(f * 2, 0.1, 'sine', 0.05, i * 0.07));
    }

    // 爆牌
    bust() {
        this._tone(200, 0.25, 'sawtooth', 0.12, 0, 80);
        this._noise(0.2, 0.08, 800, 0.05);
    }

    // 破产
    bankrupt() {
        const notes = [392, 349.23, 311.13, 261.63, 196];
        notes.forEach((f, i) => this._tone(f, 0.22, 'sawtooth', 0.1, i * 0.16));
    }

    // 成就解锁
    achievement() {
        const notes = [659.25, 783.99, 987.77, 1318.5];
        notes.forEach((f, i) => this._tone(f, 0.12, 'sine', 0.12, i * 0.08));
        this._tone(2093, 0.3, 'sine', 0.06, 0.32);
    }

    // 洗牌
    shuffle() {
        for (let i = 0; i < 6; i++) {
            this._noise(0.05, 0.07, 1500 + Math.random() * 1500, i * 0.05);
        }
    }

    // 点击
    click() {
        this._tone(1200, 0.03, 'square', 0.05);
    }
}
