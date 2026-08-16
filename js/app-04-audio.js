/* Motor de audio (MP3 + Web Audio fallback)
 *
 * Parte 4/14 do antigo app.js (linhas 2648-2865 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 6. HIGH-QUALITY AUDIO ENGINE (IA MP3 & Web Audio Fallbacks)
let audioCtx = null;

// Dynamic Water Animation (Jiggle and Bubbles)
function triggerWaterAnimation(waterPct) {
  const cylinder = document.querySelector('.water-cylinder');
  if (cylinder) {
    cylinder.classList.remove('cylinder-bounce');
    void cylinder.offsetWidth; // Force reflow
    cylinder.classList.add('cylinder-bounce');
    
    // Remove class after animation ends
    setTimeout(() => {
      cylinder.classList.remove('cylinder-bounce');
    }, 600);
  }

  if (waterPct > 0 && cylinder) {
    const bubblesCount = 6 + Math.floor(Math.random() * 5); // 6 to 10 bubbles
    const floatDist = (waterPct / 100) * 75; // cylinder height is 75px
    
    for (let i = 0; i < bubblesCount; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'water-bubble';
      
      const size = 3 + Math.floor(Math.random() * 5); // 3px to 7px
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      
      const leftVal = 10 + Math.random() * 80; // 10% to 90%
      bubble.style.left = `${leftVal}%`;
      
      const delay = Math.random() * 0.4;
      bubble.style.animationDelay = `${delay}s`;
      
      const duration = 0.5 + Math.random() * 0.4;
      bubble.style.animationDuration = `${duration}s`;
      
      bubble.style.setProperty('--float-distance', `${floatDist}px`);
      
      cylinder.appendChild(bubble);
      
      const cleanupTime = (duration + delay) * 1000 + 100;
      setTimeout(() => {
        bubble.remove();
      }, cleanupTime);
    }
  }
}

function playSound(type) {
  if (!state.soundEnabled) return;
  playSynthSound(type);
}

function speakMentor(mentorId) {
  // Vozes desativadas
}

function playSynthSound(type) {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch(type) {
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      break;

    case 'quest':
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.setValueAtTime(0.05, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
      break;

    case 'levelup':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.4); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.5); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.6); // C6
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
      break;

    case 'water':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.16);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'alarm':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      osc.frequency.setValueAtTime(600, now + 0.2);
      osc.frequency.setValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'crunch':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(120, now + 0.08);
      osc.frequency.setValueAtTime(70, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;

    case 'potion':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'point_allocation':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
      break;

    case 'allday':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;

    case 'abreoolho':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1100, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;

    case 'ficafreaky':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      
      // Secondary oscillator for heavy chorus
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(92, now);
      osc2.frequency.exponentialRampToValueAtTime(46, now + 0.8);
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now);
      osc2.stop(now + 0.9);
      
      osc.start(now);
      osc.stop(now + 0.9);
      break;
  }
}

// ==========================================
