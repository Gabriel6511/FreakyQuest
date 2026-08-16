/* Modais utilitarios
 *
 * Parte 12/14 do antigo app.js (linhas 6750-6928 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 19. MODALS UTILITIES
// ==========================================
function showLevelUpModal() {
  const modal = document.getElementById('level-up-modal');
  document.getElementById('modal-level-val').innerText = state.level;
  document.getElementById('modal-subclass-val').innerText = getSubclassRank(state.charClass, state.level);
  const descEl = modal.querySelector('.level-up-desc');
  if (descEl) {
    descEl.innerText = `${resolveVoiceLine('levelUp', { level: state.level })} Recebeu +5 Pontos de Atributos para alocar na aba de Status.`;
  }
  modal.classList.remove('hidden');
}

function showItemAcquiredModal(icon, name, desc, opts) {
  const { subtitle = 'NOVO ITEM ENCONTRADO', btnText = 'EQUIPAR NO SHAPE' } = opts || {};
  const modal = document.getElementById('item-acquired-modal');
  const iconEl = document.getElementById('modal-item-icon');
  document.getElementById('modal-item-subtitle').innerText = subtitle;
  document.getElementById('btn-close-item-modal').innerText = btnText;
  if (icon && (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.webp'))) {
    iconEl.innerHTML = `<img src="${icon}" alt="${name}" style="width: 44px; height: 44px; object-fit: contain;" onerror="this.replaceWith(document.createTextNode('🖼️'))" />`;
  } else {
    iconEl.innerText = icon;
  }
  document.getElementById('modal-item-name').innerText = name;
  document.getElementById('modal-item-desc').innerText = desc;
  modal.classList.remove('hidden');
}

function triggerNeuralFlash(mentor) {
  const container = document.getElementById('neural-transition-layer');
  if (!container) return;
  
  container.innerHTML = '';
  
  const flash = document.createElement('div');
  flash.className = 'mentor-flash-overlay';
  const color = mentor.colorHex || '#00f2fe';
  flash.style.setProperty('--flash-color', color);
  
  const alertBox = document.createElement('div');
  alertBox.className = 'neural-hacker-alert';
  alertBox.style.setProperty('--flash-color', color);
  alertBox.style.setProperty('--flash-color-glow', color + '55');
  alertBox.innerText = `[ BASE NEURAL SINCRONIZADA COM ${mentor.name.toUpperCase()} ]`;
  
  container.appendChild(flash);
  container.appendChild(alertBox);
  
  setTimeout(() => {
    if (flash.parentNode === container) {
      container.removeChild(flash);
    }
    if (alertBox.parentNode === container) {
      container.removeChild(alertBox);
    }
  }, 2000);
}

function getSubclassLore(charClass, rankName) {
  const lores = {
    bodybuilder: {
      "FIT 🤡": "Um recruta iniciante que acabou de pisar na academia. Seu shape é uma tela em branco. Força e foco trarão redenção!",
      "BETA 🐣": "Um pequeno frango que começou a entender o que é supino. Menos de 6 meses de treino, mas já tem determinação.",
      "FRANGO EM CRESCIMENTO 🐓": "O shape começou a responder! A manga da camiseta já aperta um pouco. Continue comendo limpo e treinando pesado.",
      "FORTINHO DO BAIRRO 🦁": "Já chama atenção na rua de regata. O pump do treino dura algumas horas. Você está evoluindo rápido!",
      "SHAPE LEGAL 🔥": "O shape clássico de praia. Definição muscular visível e peitoral desenhado. O caminho do gigante está logo ali.",
      "GRANDE DA ACADEMIA 🐂": "Quando você passa, a galera repara. Pega as anilhas pesadas sem esforço. Respeitado na academia.",
      "MONSTRO INTIMIDADOR 👹": "Braços gigantescos, costas em V. As pessoas evitam revezar aparelhos com você por puro respeito ao seu tamanho.",
      "ESTRANHO DE VERDADE 👽": "Proporções assustadoras, vascularização brutal. Um mutante estético incomparável.",
      "IMENSO INCONTROLÁVEL 🌋": "Uma montanha de músculos ambulante. Ninguém duvida de que você ultrapassou os limites genéticos normais.",
      "FREAKY SUPREMO 😈🔥": "Lendário! Você atingiu o ápice da hipertrofia mística. Um verdadeiro deus da musculação nascido do ferro!"
    },
    powerlifter: {
      "PVC LIFTER 🥖": "Levantando barras vazias ou tubos de PVC. O foco atual é inteiramente na postura e na técnica inicial.",
      "INICIANTE DE BARRA 🏋️": "A técnica de levantamento básico está se assentando. A barra olímpica de 20kg não te assusta mais.",
      "SUPINADOR DE 10KG 🥚": "Colocando anilhas pequenas nas pontas, mas a base de força está se solidificando. O terra de 100kg está próximo.",
      "CAVALO DE CARGA 🐴": "Você já levanta pesos que a maioria não consegue nem tirar do chão. O agachamento está ficando intimidador.",
      "OGRO DAS ANILHAS 🦍": "Seu aquecimento é o PR máximo dos iniciantes. Barulhento, bruto e extremamente forte.",
      "QUEBRADOR DE TERRA 🪨": "Quando você faz levantamento terra, o chão da academia treme. O ferro é seu melhor amigo.",
      "TRATOR HUMANO 🚜": "Cargas massivas em todos os três levantamentos básicos (Agachamento, Supino, Terra). Uma força da natureza.",
      "FORÇA HERCÚLEA 🏛️": "Poder mitológico. Suas articulações parecem feitas de titânio e seus músculos de rocha sólida.",
      "TITÃ DE AÇO 🤖": "Você dominou a biomecânica da força bruta. Nenhuma gravidade pode deter suas repetições de carga máxima.",
      "FREAKY BEAST 🦖👹": "O monstro supremo da força pura. Capaz de mover montanhas de anilhas. Um ser indomável e colossal!"
    },
    calistenia: {
      "GRAVIDADE ZERO 🕸️": "Lutando para completar 3 barras fixas consecutivas. A gravidade parece sua pior inimiga no momento.",
      "FRANGO DE BARRA 🍗": "As primeiras barras limpas saíram! A força nos braços e dorsais está começando a surgir.",
      "PRANCHA INSTÁVEL 🤸": "Seu abdômen e core estão se fortalecendo. Você já consegue manter uma postura decente por alguns segundos.",
      "ACROBATA DE PARQUE 🐒": "Fazendo pull-ups explosivas e brincando nas barras públicas. Seu corpo se move com leveza e precisão.",
      "MESTRE DAS PARALELAS 🥷": "Dips com peso adicional e controle muscular absurdo. A gravidade está perdendo o controle sobre você.",
      "HOMEM-ARANHA DO SHAPE 🕷️": "Controle total do corpo no espaço. Você faz movimentos que parecem desafiar o bom senso físico.",
      "REI DA ISOMETRIA 🧱": "Mantém o front lever e human flag com expressão serena. Seus tendões e core são inquebráveis.",
      "LEVITAÇÃO HUMANA 🛸": "Seus movimentos são tão limpos e controlados que parece que você está flutuando sobre as barras.",
      "DESAFIADOR DA FÍSICA 🌀": "Acrobacias colossais e controle estático absoluto em qualquer ângulo. Uma lenda do peso corporal.",
      "FREAKY SHINOBI 🌀⚡": "O ápice do ninja moderno. Seu corpo é uma arma de precisão e leveza absurda. Flutua como vento, bate como trovão!"
    },
    maratonista: {
      "TARTARUGA MANCA 🐢": "Falta ar depois de correr 400 metros na esteira. O pulmão arde, mas o espírito quer continuar.",
      "ANDARILHO DE ESTEIRA 🚶": "Alternando caminhada rápida e corrida leve. A resistência cardiovascular está se construindo.",
      "CORREDOR RECREATIVO 👟": "Completando os primeiros 5km sem parar! A respiração está controlada e as pernas estão fortes.",
      "PAPA-LÉGUAS DA PISTA 🦤": "O ritmo (pace) de corrida está caindo constantemente. 10km já virou corrida de rotina para você.",
      "PULMÃO DE FERRO 🫁": "Seu VO2 max está disparando. Você corre subidas e distâncias longas com vigor incomparável.",
      "VELOCISTA DE ELITE 🐆": "Passadas largas, ritmo absurdo e resistência mental inabalável. O cansaço é apenas um conceito distante.",
      "MARATONISTA LENDÁRIO 🏆": "Completou meias e maratonas inteiras com tempos dignos de atleta. Suas pernas são pistões incansáveis.",
      "CYBORG DO CARDIO 🔌": "Seu coração opera com eficiência perfeita. Você corre por horas a fio sem sofrer desgaste visível.",
      "MÁQUINA DE ENDURANCE 🏎️": "Resistência sem fim. Seu corpo consome oxigênio e gordura com eficiência termodinâmica brutal.",
      "FREAKY RUNNER ⚡🌀": "O corredor supremo. Você atravessa o horizonte em alta velocidade constante, um maratonista indestrutível!"
    }
  };
  return lores[charClass]?.[rankName] || "Uma classe em desenvolvimento contínuo em direção ao status Freaky.";
}

window.showAttributeHelp = function(attrKey) {
  playSound('click');
  const details = {
    for: {
      icon: '✊',
      name: 'FORÇA (FOR)',
      desc: 'Sua capacidade bruta de mover cargas. Cada ponto de Força aumenta o ganho de XP básico ao completar séries em exercícios de força de 0.5% a 1.5%.'
    },
    res: {
      icon: '🫁',
      name: 'RESISTÊNCIA (RES)',
      desc: 'Seu fôlego e resiliência biológica. Aumenta a capacidade de manter o volume de repetições e reduz a penalidade de cansaço quando treina sob RPE extremo.'
    },
    agi: {
      icon: '⚡',
      name: 'AGILIDADE (AGI)',
      desc: 'Aumenta a velocidade metabólica e a eficiência do treino. Cada ponto de Agilidade acima de 10 concede +1% de bônus de XP ao finalizar qualquer treino.'
    },
    vig: {
      icon: '❤️',
      name: 'VIGOR (VIG)',
      desc: 'Aumenta a eficácia de hidratação e recuperação de HP. Cada ponto de Vigor acima de 10 concede +2% de bônus de XP ao beber água no reservatório.'
    },
    foc: {
      icon: '🎯',
      name: 'FOCO (FOC)',
      desc: 'Sua clareza mental e disciplina no ginásio. Cada ponto adiciona um bônus multiplicador de +1% de XP em todas as Quests Diárias finalizadas.'
    }
  };
  
  const item = details[attrKey] || { icon: '❓', name: 'Atributo Desconhecido', desc: 'Atributo não cadastrado.' };
  showItemAcquiredModal(item.icon, item.name, item.desc, { subtitle: 'INFORMAÇÕES DO ATRIBUTO', btnText: 'ENTENDI' });
};

function spawnAttrFloatingText(attrKey) {
  const labelMap = {
    for: 'FORÇA ✊',
    res: 'RESISTÊNCIA 🫁',
    agi: 'AGILIDADE ⚡',
    vig: 'VIGOR ❤️',
    foc: 'FOCO 🎯'
  };
  
  const attrValueEl = document.getElementById(`val-${attrKey}`);
  if (!attrValueEl) return;
  const parent = attrValueEl.parentElement;
  if (!parent) return;
  
  const oldPopups = parent.querySelectorAll('.attr-floating-popup');
  oldPopups.forEach(p => p.remove());
  
  const popup = document.createElement('div');
  popup.className = 'attr-floating-popup';
  popup.innerText = `+1 ${labelMap[attrKey] || attrKey.toUpperCase()}!`;
  
  parent.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentNode === parent) {
      parent.removeChild(popup);
    }
  }, 1200);
}


// ==========================================
