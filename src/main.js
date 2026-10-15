import './styles/main.css';
import { Game } from './game/game.js';

// ================================================================
//  启动游戏
// ================================================================
const game = new Game();
window.__blackjack = game;

    // 初始化显示
    game._showMessage('🃏 下注后点击「发牌」开始', '');
    game._updateButtons();
    game.el.btnSoundToggle.textContent = game.sfx.enabled ? '🔊' : '🔇';

    // 首次任意交互时解锁音频上下文（浏览器自动播放策略）
    const unlockAudio = () => {
        game.sfx.init();
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    console.log('🃏 21点豪华版已加载！');
    console.log('💡 快捷键: [H]要牌 [S]停牌 [D]加倍 [P]分牌 [Space]发牌 [R]重置');
