/* ==========================================================================
   FREAKYQUEST - RPG FITNESS STATE & LOGIC ENGINE (UPGRADED VERSION)
   ========================================================================== */

// 1. SUB-CLASSES PROGRESSION SYSTEM (RANKS) - UPDATED LEVEL 1 TO "FIT 🤡"
const SUB_CLASSES = {
  bodybuilder: [
    { lvl: 1, name: "FIT 🤡" },
    { lvl: 5, name: "BETA 🐣" },
    { lvl: 10, name: "FRANGO EM CRESCIMENTO 🐓" },
    { lvl: 18, name: "FORTINHO DO BAIRRO 🦁" },
    { lvl: 25, name: "SHAPE LEGAL 🔥" },
    { lvl: 35, name: "GRANDE DA ACADEMIA 🐂" },
    { lvl: 45, name: "MONSTRO INTIMIDADOR 👹" },
    { lvl: 55, name: "ESTRANHO DE VERDADE 👽" },
    { lvl: 65, name: "IMENSO INCONTROLÁVEL 🌋" },
    { lvl: 75, name: "FREAKY SUPREMO 😈🔥" }
  ],
  powerlifter: [
    { lvl: 1, name: "PVC LIFTER 🥖" },
    { lvl: 5, name: "INICIANTE DE BARRA 🏋️" },
    { lvl: 10, name: "SUPINADOR DE 10KG 🥚" },
    { lvl: 18, name: "CAVALO DE CARGA 🐴" },
    { lvl: 25, name: "OGRO DAS ANILHAS 🦍" },
    { lvl: 35, name: "QUEBRADOR DE TERRA 🪨" },
    { lvl: 45, name: "TRATOR HUMANO 🚜" },
    { lvl: 55, name: "FORÇA HERCÚLEA 🏛️" },
    { lvl: 65, name: "TITÃ DE AÇO 🤖" },
    { lvl: 75, name: "FREAKY BEAST 🦖👹" }
  ],
  calistenia: [
    { lvl: 1, name: "GRAVIDADE ZERO 🕸️" },
    { lvl: 5, name: "FRANGO DE BARRA 🍗" },
    { lvl: 10, name: "PRANCHA INSTÁVEL 🤸" },
    { lvl: 18, name: "ACROBATA DE PARQUE 🐒" },
    { lvl: 25, name: "MESTRE DAS PARALELAS 🥷" },
    { lvl: 35, name: "HOMEM-ARANHA DO SHAPE 🕷️" },
    { lvl: 45, name: "REI DA ISOMETRIA 🧱" },
    { lvl: 55, name: "LEVITAÇÃO HUMANA 🛸" },
    { lvl: 65, name: "DESAFIADOR DA FÍSICA 🌀" },
    { lvl: 75, name: "FREAKY SHINOBI 🌀⚡" }
  ],
  maratonista: [
    { lvl: 1, name: "TARTARUGA MANCA 🐢" },
    { lvl: 5, name: "ANDARILHO DE ESTEIRA 🚶" },
    { lvl: 10, name: "CORREDOR RECREATIVO 👟" },
    { lvl: 18, name: "PAPA-LÉGUAS DA PISTA 🦤" },
    { lvl: 25, name: "PULMÃO DE FERRO 🫁" },
    { lvl: 35, name: "VELOCISTA DE ELITE 🐆" },
    { lvl: 45, name: "MARATONISTA LENDÁRIO 🏆" },
    { lvl: 55, name: "CYBORG DO CARDIO 🔌" },
    { lvl: 65, name: "MÁQUINA DE ENDURANCE 🏎️" },
    { lvl: 75, name: "FREAKY RUNNER ⚡🌀" }
  ]
};

// 2. OFFICIAL MENTORS DATABASE — ALL FREE FROM LEVEL 1!
const OFFICIAL_MENTORS = [
  {
    id: 'bebezinho',
    name: 'Gabriel Ganley "Bebezinho"',
    levelReq: 1,
    theme: 'theme-bebezinho',
    avatar: 'bebezinho_tribute.png',
    quote: '"Wake wake! Abre o olho big! Fica Freaky! Hoje é All Day!"',
    buff: '+15% Força & +15% Foco (Tributo Especial)',
    colorHex: '#9b5de5',
    isCustom: false
  },
  {
    id: 'brolyz',
    name: 'Broly (Saga Z)',
    levelReq: 1,
    theme: 'theme-brolyz',
    avatar: 'brolyz.png',
    quote: '"O meu poder é máximo! Kakarotooooo!"',
    buff: '+25% Força & +10% Resistência (Poder Supremo)',
    colorHex: '#adff2f',
    isCustom: false
  },
  {
    id: 'rocklee',
    name: 'Rock Lee',
    levelReq: 1,
    theme: 'theme-rocklee',
    avatar: 'rocklee.png',
    quote: '"O trabalho duro vence o talento natural quando o talento natural não trabalha duro!"',
    buff: '+10% Agilidade & +10% Vigor',
    colorHex: '#38b000',
    isCustom: false
  },
  {
    id: 'ramondino',
    name: 'Ramon Dino',
    levelReq: 1,
    theme: 'theme-ramondino',
    avatar: 'ramondino.png',
    quote: '"Não tem segredo, irmão. É bater o peso certinho, treinar braço pesado e comer limpo! Acorda pro treino!"',
    buff: '+12% Vigor & +8% Força',
    colorHex: '#0077b6',
    isCustom: false
  },
  {
    id: 'goku',
    name: 'Son Goku',
    levelReq: 1,
    theme: 'theme-goku',
    avatar: 'goku.png',
    quote: '"Oi, eu sou o Goku! Treinar na gravidade 100x vai te deixar insano. Vamos superar nossos limites hoje?"',
    buff: '+15% Força & +5% Foco',
    colorHex: '#f77f00',
    isCustom: false
  },
  {
    id: 'arnold',
    name: 'Arnold S.',
    levelReq: 1,
    theme: 'theme-arnold',
    avatar: 'arnold.png',
    quote: '"Se você quer crescer, tem que passar pela dor. Sinta o pump e venha comigo se quiser ficar gigantesco!"',
    buff: '+20% Força e Hipertrofia Estética',
    colorHex: '#d4af37',
    isCustom: false
  },
  {
    id: 'saitama',
    name: 'Saitama',
    levelReq: 1,
    theme: 'theme-saitama',
    avatar: 'saitama.png',
    quote: '"100 flexões, 100 agachamentos, 100 abdominais e 10 km de corrida todos os dias! Isso é tudo."',
    buff: '+30% Resistência & +30% Agilidade',
    colorHex: '#e63946',
    isCustom: false
  },
  {
    id: 'nickwalker',
    name: 'Nick Walker "The Mutant"',
    levelReq: 1,
    theme: 'theme-nickwalker',
    avatar: 'nickwalker.png',
    quote: '"Foque em progredir a carga, treine com intensidade bizarra de verdade e seja um Mutante no ginásio!"',
    buff: '+25% Força & +10% Vigor (Hipertrofia Extrema)',
    colorHex: '#ff5e00',
    isCustom: false
  }
];

const MENTOR_DASHBOARD_QUOTES = {
  bebezinho: [
    "Wake wake! Abre o olho big! Fica Freaky! Hoje é All Day!",
    "Tudo nosso, nada deles! O progresso não para!",
    "Vem com o bebê! Mais um dia de pura dedicação!",
    "Foca no pump, fecha a cara e vai!",
    "A constância é a chave para moldar o herói!"
  ],
  brolyz: [
    "O meu poder é máximo! Kakarotooooo!",
    "Sinta o poder transbordar do seu peitoral!",
    "Não há limites para a fúria dos seus treinos!",
    "Destrua cada barreira hoje!",
    "A força acumulada vai explodir nos pesos!"
  ],
  rocklee: [
    "O trabalho duro vence o talento natural quando o talento natural não trabalha duro!",
    "O fogo da juventude queima dentro de você hoje!",
    "Se você acredita no seu sonho, eu provarei que você pode com trabalho duro!",
    "Mais 100 repetições! Não desista antes do fim!",
    "Um fracassado pode superar um gênio com esforço!"
  ],
  ramondino: [
    "Não tem segredo, irmão. É bater o peso certinho, treinar braço pesado e comer limpo! Acorda pro treino!",
    "Cada grama na balança conta! Foco na dieta hoje!",
    "O Acre tem força bruta! Mostre sua garra!",
    "Não pula o treino de antebraço, hein big!",
    "O shape fala por si só!"
  ],
  goku: [
    "Oi, eu sou o Goku! Treinar na gravidade 100x vai te deixar insano. Vamos superar nossos limites hoje?",
    "Eu estou tão animado para treinar pesado hoje!",
    "Sinto um grande poder vindo de você!",
    "Coma bastante e treine ainda mais!",
    "A dor de hoje é a força de amanhã!"
  ],
  arnold: [
    "Se você quer crescer, tem que passar pela dor. Sinta o pump e venha comigo se quiser ficar gigantesco!",
    "No pain, no gain! Sem esforço não há glória!",
    "A última repetição é o que faz o músculo crescer!",
    "Mantenha a mente focada no músculo e sinta a contração!",
    "Descanse apenas o necessário e volte ao combate!"
  ],
  saitama: [
    "100 flexões, 100 agachamentos, 100 abdominais e 10 km de corrida todos os dias! Isso é tudo.",
    "Você já treinou tanto que está ficando careca?",
    "Apenas faça o que precisa ser feito.",
    "A força de verdade vem de dentro.",
    "Mais um treino normal concluído sem esforço."
  ],
  nickwalker: [
    "Foque em progredir a carga, treine com intensidade bizarra de verdade e seja um Mutante no ginásio!",
    "Cresça a cada treino! O pump é indescritível!",
    "Sem desculpas, coloque mais carga e esmague!",
    "Intensidade bizarra é o nosso padrão!",
    "Você quer ser comum ou quer ser um mutante?"
  ]
};

// 2b. MENTOR REWARDS — Desbloqueados a cada 5 níveis do mentor ativo
const MENTOR_REWARDS = {
  bebezinho: [
    { lvl: 5,  id: 'm_beb_5',  type: 'sound',    value: 'wakewake',      name: 'Som "Wake Wake!" 🕊️',     icon: '🕊️', desc: 'Som especial do Bebezinho ao completar treino desbloqueado!' },
    { lvl: 10, id: 'm_beb_10', type: 'css_class', value: 'has-men-beb10', name: 'Partículas Tributo ✨',     icon: '✨',  desc: 'Faíscas douradas aparecem no fundo do app em tributo ao Bebezinho!' },
    { lvl: 15, id: 'm_beb_15', type: 'buff',      value: 'foc+5',         name: '+5% Foco Permanente 🧠',   icon: '🧠',  desc: 'Foco aumentado permanentemente como tributo ao Bebezinho!' },
    { lvl: 20, id: 'm_beb_20', type: 'css_class', value: 'has-men-beb20', name: 'Tema Roxo Lendário 💜',    icon: '💜',  desc: 'Header com gradiente roxo/dourado em homenagem ao Bebezinho!' },
    { lvl: 25, id: 'm_beb_25', type: 'css_class', value: 'has-men-beb25', name: 'Aura + Título "WAKE WAKE MASTER" 👑', icon: '👑', desc: 'Aura dourada especial e título lendário de fiel discípulo do Bebezinho!' },
  ],
  rocklee: [
    { lvl: 5,  id: 'm_lee_5',  type: 'css_class', value: 'has-item-faixa', name: 'Faixa do Rock Lee 🟢',      icon: '🟢', desc: 'Borda verde néon no avatar! A faixa do trabalho duro foi equipada.' },
    { lvl: 10, id: 'm_lee_10', type: 'sound',      value: 'ninja',          name: 'Som de Treino Ninja 🥷',    icon: '🥷', desc: 'Som ninja especial ao finalizar treino desbloqueado!' },
    { lvl: 15, id: 'm_lee_15', type: 'buff',       value: 'agi+5',          name: '+5% Agilidade Permanente ⚡', icon: '⚡', desc: 'Agilidade aumentada! O treino com pesos de Lee está rendendo.' },
    { lvl: 20, id: 'm_lee_20', type: 'css_class',  value: 'has-men-lee20',  name: 'Faixa Vermelha de Elite 🔴', icon: '🔴', desc: 'Faixa vermelha de elite equipada! Você superou seus limites.' },
    { lvl: 25, id: 'm_lee_25', type: 'css_class',  value: 'has-men-lee25',  name: 'Aura + Título "SHINOBI SUPREMO" 🌿', icon: '🌿', desc: 'Aura verde intensa máxima! Título de Shinobi Supremo desbloqueado.' },
  ],
  goku: [
    { lvl: 5,  id: 'm_gok_5',  type: 'css_class', value: 'has-item-aura',  name: 'Aura SSJ Dourada ⚡',        icon: '⚡', desc: 'Aura Super Saiyajin dourada ao redor do seu avatar!' },
    { lvl: 10, id: 'm_gok_10', type: 'sound',      value: 'kicharge',       name: 'Som de Ki Charge 🔋',       icon: '🔋', desc: 'Som de carregamento de Ki ao subir de nível desbloqueado!' },
    { lvl: 15, id: 'm_gok_15', type: 'buff',       value: 'for+5',          name: '+5% Força Permanente 💪',    icon: '💪', desc: 'Força aumentada pelo poder do Super Saiyajin!' },
    { lvl: 20, id: 'm_gok_20', type: 'css_class',  value: 'has-men-gok20',  name: 'Aura SSJ Suprema ✨',       icon: '✨', desc: 'Aura dourada suprema pulsando em máxima potência!' },
    { lvl: 25, id: 'm_gok_25', type: 'css_class',  value: 'has-men-gok25',  name: 'SSJ Max + Título "PODER SAIYAJIN" 🌟', icon: '🌟', desc: 'Poder máximo! Título "PODER DE UM SAIYAJIN" desbloqueado.' },
  ],
  arnold: [
    { lvl: 5,  id: 'm_arn_5',  type: 'css_class', value: 'has-men-arn5',    name: 'Badge Mr. Olympia 🏆',       icon: '🏆', desc: 'Badge dourado de Mr. Olympia aparece ao lado do seu nome!' },
    { lvl: 10, id: 'm_arn_10', type: 'css_class', value: 'has-item-cinturo', name: 'Cinturão de Ouro 🥇',       icon: '🥇', desc: 'O Cinturão de Ouro de Arnold equipado nos cards do status!' },
    { lvl: 15, id: 'm_arn_15', type: 'buff',       value: 'for+5',           name: '+5% Força Permanente 💪',    icon: '💪', desc: 'Força estética de Arnold aumentada permanentemente!' },
    { lvl: 20, id: 'm_arn_20', type: 'sound',      value: 'illbeback',       name: 'Som Arnold Épico 🎬',        icon: '🎬', desc: 'Som épico especial do Arnold ao finalizar o treino!' },
    { lvl: 25, id: 'm_arn_25', type: 'css_class',  value: 'has-men-arn25',   name: 'Layout Dourado + Título "O GOVERNADOR" 👑', icon: '👑', desc: 'Layout premium dourado! Título O GOVERNADOR desbloqueado.' },
  ],
  ramondino: [
    { lvl: 5,  id: 'm_ram_5',  type: 'css_class', value: 'has-men-ram5',   name: 'Borda Azul Neon 💙',          icon: '💙', desc: 'Borda azul/cyan néon ao redor do avatar estilo Ramon Dino!' },
    { lvl: 10, id: 'm_ram_10', type: 'sound',      value: 'acorda',         name: '"Acorda pro Treino!" 🇧🇷',   icon: '🇧🇷', desc: 'Som motivacional do Ramon Dino ao iniciar treino!' },
    { lvl: 15, id: 'm_ram_15', type: 'buff',       value: 'vig+5',          name: '+5% Vigor Permanente 🏋️',    icon: '🏋️', desc: 'Vigor aumentado! O treino pesado do Ramon está valendo.' },
    { lvl: 20, id: 'm_ram_20', type: 'css_class',  value: 'has-men-ram20',  name: 'Gradiente Oceano 🌊',         icon: '🌊', desc: 'Gradiente azul oceano no tema! Estilo brasileiro de elite.' },
    { lvl: 25, id: 'm_ram_25', type: 'css_class',  value: 'has-men-ram25',  name: 'Aura + Título "CAMPEÃO BR" 🏆', icon: '🏆', desc: 'Aura azul néon máxima! Título CAMPEÃO BRASILEIRO desbloqueado.' },
  ],
  brolyz: [
    { lvl: 5,  id: 'm_bro_5',  type: 'css_class', value: 'has-item-aurabroly', name: 'Aura Lendária Verde 🐉',   icon: '🐉', desc: 'Aura verde néon lendária de Broly ao redor do avatar!' },
    { lvl: 10, id: 'm_bro_10', type: 'sound',      value: 'brolyki',            name: 'Explosão de Ki 💥',        icon: '💥', desc: 'Explosão de Ki lendária do Broly ao finalizar treino!' },
    { lvl: 15, id: 'm_bro_15', type: 'buff',       value: 'for+5',              name: '+5% Força Permanente 💪',  icon: '💪', desc: 'Força lendária do Broly transferida para você permanentemente!' },
    { lvl: 20, id: 'm_bro_20', type: 'css_class',  value: 'has-men-bro20',      name: 'Partículas Verdes 🌿',     icon: '🌿', desc: 'Partículas verdes lendárias no fundo do app!' },
    { lvl: 25, id: 'm_bro_25', type: 'css_class',  value: 'has-men-bro25',      name: 'Aura + Título "LENDÁRIO INVENCÍVEL" 🌋', icon: '🌋', desc: 'Aura verde colossal máxima! Título LENDÁRIO INVENCÍVEL desbloqueado.' },
  ],
  saitama: [
    { lvl: 5,  id: 'm_sai_5',  type: 'css_class', value: 'has-item-capa',  name: 'Capa do Saitama ⬜',          icon: '⬜', desc: 'A lendária capa branca do Saitama flutua atrás do avatar!' },
    { lvl: 10, id: 'm_sai_10', type: 'sound',      value: 'ok',             name: 'Som "OK" do Saitama 😐',     icon: '😐', desc: 'O famoso OK do Saitama toca ao completar quests!' },
    { lvl: 15, id: 'm_sai_15', type: 'buff',       value: 'res+5',          name: '+5% Resistência Permanente 🛡️', icon: '🛡️', desc: 'Resistência aumentada! O treino absurdo do Saitama funciona.' },
    { lvl: 20, id: 'm_sai_20', type: 'css_class',  value: 'has-men-sai20',  name: 'Layout Minimalista ⬜',       icon: '⬜', desc: 'Layout cinza ultra minimalista! Estilo do homem mais forte.' },
    { lvl: 25, id: 'm_sai_25', type: 'css_class',  value: 'has-men-sai25',  name: 'Poder + Título "UM SOCO APENAS" 👊', icon: '👊', desc: 'Poder máximo! Título UM SOCO APENAS desbloqueado.' },
  ],
  nickwalker: [
    { lvl: 5,  id: 'm_nic_5',  type: 'css_class', value: 'has-men-nic5',    name: 'Borda Laranja Mutante 🍊',   icon: '🍊', desc: 'Borda laranja néon ao redor do seu avatar no estilo Nick Walker!' },
    { lvl: 10, id: 'm_nic_10', type: 'sound',      value: 'freaky',          name: 'Som Mutante Bizarro 🗣️',     icon: '🗣️', desc: 'Som de mutação bizarro ao finalizar treinos desbloqueado!' },
    { lvl: 15, id: 'm_nic_15', type: 'buff',       value: 'for+5',           name: '+5% Força Permanente 💪',    icon: '💪', desc: 'Força extrema de Nick Walker injetada nos seus músculos!' },
    { lvl: 20, id: 'm_nic_20', type: 'css_class',  value: 'has-men-nic20',  name: 'Glow Mutante Extremo ✨',    icon: '✨', desc: 'Visual com glow laranja pulsante na barra de progresso!' },
    { lvl: 25, id: 'm_nic_25', type: 'css_class',  value: 'has-men-nic25',  name: 'Aura + Título "MUTANTE SUPREMO" 🌋', icon: '🌋', desc: 'Aura de chamas laranja vibrante e título MUTANTE SUPREMO desbloqueado!' },
  ],
};

// 3. EXERCISE TEMPLATES BY CLASS
const WORKOUT_TEMPLATES = {
  bodybuilder: {
    A: {
      title: "Treino A - Peito & Tríceps",
      desc: "Foco total na hipertrofia peitoral e pump insano de tríceps.",
      exercises: [
        { name: "Supino Reto (Barra)", sets: 4, targetReps: "8-12", muscle: "Peito", weight: 40 },
        { name: "Supino Inclinado (Halteres)", sets: 4, targetReps: "10-12", muscle: "Peito", weight: 18 },
        { name: "Crossover no Pulley", sets: 3, targetReps: "12-15", muscle: "Peito", weight: 20 },
        { name: "Tríceps Testa", sets: 3, targetReps: "10-12", muscle: "Tríceps", weight: 15 },
        { name: "Tríceps Corda (Pulley)", sets: 4, targetReps: "12-15", muscle: "Tríceps", weight: 25 }
      ]
    },
    B: {
      title: "Treino B - Costas & Bíceps",
      desc: "Expansão dorsal e contração máxima para braços gigantescos.",
      exercises: [
        { name: "Puxada Alta (Pulley)", sets: 4, targetReps: "10-12", muscle: "Costas", weight: 45 },
        { name: "Remada Curvada (Barra)", sets: 4, targetReps: "8-12", muscle: "Costas", weight: 35 },
        { name: "Rosca Direta W", sets: 4, targetReps: "8-12", muscle: "Bíceps", weight: 12 },
        { name: "Rosca Martelo Alternada", sets: 3, targetReps: "10-12", muscle: "Bíceps", weight: 14 },
        { name: "Encolhimento (Halteres)", sets: 3, targetReps: "12-15", muscle: "Trapezio", weight: 24 }
      ]
    },
    C: {
      title: "Treino C - Pernas & Ombros",
      desc: "Destruindo quadríceps e alargando ombros estilo armadura.",
      exercises: [
        { name: "Agachamento Livre", sets: 4, targetReps: "8-12", muscle: "Pernas", weight: 50 },
        { name: "Leg Press 45°", sets: 4, targetReps: "10-12", muscle: "Pernas", weight: 120 },
        { name: "Cadeira Flexora", sets: 3, targetReps: "12-15", muscle: "Pernas", weight: 35 },
        { name: "Desenvolvimento com Halteres", sets: 4, targetReps: "8-12", muscle: "Ombros", weight: 16 },
        { name: "Elevação Lateral", sets: 4, targetReps: "12-15", muscle: "Ombros", weight: 8 }
      ]
    }
  },
  powerlifter: {
    A: {
      title: "Treino A - Supino (Bench Press Day)",
      desc: "Trabalho de força máxima na barra horizontal.",
      exercises: [
        { name: "Supino Reto Competitivo", sets: 5, targetReps: "3-5", muscle: "Peito", weight: 60 },
        { name: "Supino Inclinado c/ Barra", sets: 3, targetReps: "5-6", muscle: "Peito", weight: 50 },
        { name: "Supino Fechado (Tríceps)", sets: 4, targetReps: "6-8", muscle: "Braços", weight: 45 },
        { name: "Desenvolvimento Militar (OHP)", sets: 4, targetReps: "5", muscle: "Ombros", weight: 30 }
      ]
    },
    B: {
      title: "Treino B - Levantamento Terra (Deadlift Day)",
      desc: "Força nas costas, glúteos e pegada esmagadora de aço.",
      exercises: [
        { name: "Levantamento Terra (Deadlift)", sets: 5, targetReps: "3", muscle: "Costas", weight: 80 },
        { name: "Remada Curvada Pesada", sets: 4, targetReps: "5", muscle: "Costas", weight: 55 },
        { name: "Barra Fixa com Carga", sets: 3, targetReps: "5", muscle: "Costas", weight: 5 },
        { name: "Prancha Abdominal com Anilha", sets: 3, targetReps: "60s", muscle: "Cardio", weight: 10 }
      ]
    },
    C: {
      title: "Treino C - Agachamento (Squat Day)",
      desc: "Força pura nas pernas para agachar até o chão.",
      exercises: [
        { name: "Agachamento Livre (Barra)", sets: 5, targetReps: "3-5", muscle: "Pernas", weight: 70 },
        { name: "Agachamento Pausado", sets: 3, targetReps: "5", muscle: "Pernas", weight: 55 },
        { name: "Good Morning (Bom Dia)", sets: 3, targetReps: "8", muscle: "Pernas", weight: 30 },
        { name: "Elevação de Gêmeos em Pé", sets: 4, targetReps: "12-15", muscle: "Pernas", weight: 40 }
      ]
    }
  },
  calistenia: {
    A: {
      title: "Treino A - Empurrar & Paralelas",
      desc: "Controle de empurrar usando peso corporal e gravidade.",
      exercises: [
        { name: "Dips (Paralelas)", sets: 4, targetReps: "8-12", muscle: "Braços", weight: 0 },
        { name: "Flexões Declinadas", sets: 4, targetReps: "12-15", muscle: "Peito", weight: 0 },
        { name: "Pike Pushups (Ombro)", sets: 3, targetReps: "8-10", muscle: "Ombros", weight: 0 },
        { name: "Tríceps no Banco", sets: 3, targetReps: "15", muscle: "Braços", weight: 0 }
      ]
    },
    B: {
      title: "Treino B - Puxar & Abdominais",
      desc: "Desenvolvimento de dorsal larga e abdômen trincado de pedra.",
      exercises: [
        { name: "Barra Fixa Pronada (Pull-ups)", sets: 4, targetReps: "6-10", muscle: "Costas", weight: 0 },
        { name: "Barra Fixa Supinada (Chin-ups)", sets: 4, targetReps: "8-10", muscle: "Costas", weight: 0 },
        { name: "Abdominal V-Up (Canivete)", sets: 4, targetReps: "15", muscle: "Cardio", weight: 0 },
        { name: "L-Sit Hold (Segurar na Barra)", sets: 3, targetReps: "20s", muscle: "Cardio", weight: 0 }
      ]
    },
    C: {
      title: "Treino C - Pernas & Equilíbrio",
      desc: "Pistols explosivos e controle de estabilização corporal.",
      exercises: [
        { name: "Pistol Squat (Agachamento Unilateral)", sets: 3, targetReps: "5 cada", muscle: "Pernas", weight: 0 },
        { name: "Jump Lunges (Passada Saltando)", sets: 4, targetReps: "16 totais", muscle: "Pernas", weight: 0 },
        { name: "Handstand Hold (Parada de Mão)", sets: 3, targetReps: "30s", muscle: "Ombros", weight: 0 },
        { name: "Elevação de Panturrilha Unilateral", sets: 4, targetReps: "15 cada", muscle: "Pernas", weight: 0 }
      ]
    }
  },
  maratonista: {
    A: {
      title: "Treino A - Velocidade & Explosão",
      desc: "Tiros intervalados de alta intensidade para fôlego extremo.",
      exercises: [
        { name: "Tiros na Pista (200m)", sets: 6, targetReps: "Tiro Máximo", muscle: "Cardio", weight: 0 },
        { name: "Burpees Explosivos", sets: 4, targetReps: "15", muscle: "Cardio", weight: 0 },
        { name: "Saltos na Caixa (Box Jumps)", sets: 4, targetReps: "12", muscle: "Pernas", weight: 0 },
        { name: "Polichinelos Velocidade", sets: 3, targetReps: "45s", muscle: "Cardio", weight: 0 }
      ]
    },
    B: {
      title: "Treino B - Corrida de Resistência",
      desc: "Volume aeróbico contínuo para expandir sua barreira de fadiga.",
      exercises: [
        { name: "Corrida Contínua", sets: 1, targetReps: "5 KM ou 30 min", muscle: "Cardio", weight: 0 },
        { name: "Agachamento Livre sem Carga", sets: 4, targetReps: "20", muscle: "Pernas", weight: 0 },
        { name: "Prancha Abdominal Isométrica", sets: 3, targetReps: "60s", muscle: "Cardio", weight: 0 }
      ]
    },
    C: {
      title: "Treino C - Subidas & Força no Cardio",
      desc: "Fortalecimento muscular específico para corrida em terrenos íngremes.",
      exercises: [
        { name: "Corrida na Subida / Inclinação", sets: 5, targetReps: "3 min", muscle: "Cardio", weight: 0 },
        { name: "Passada Caminhando (Lunges)", sets: 4, targetReps: "20 passos", muscle: "Pernas", weight: 0 },
        { name: "Corrida com Elevação de Joelho", sets: 4, targetReps: "40s", muscle: "Cardio", weight: 0 },
        { name: "Pular Corda", sets: 3, targetReps: "3 min", muscle: "Cardio", weight: 0 }
      ]
    }
  }
};

// 4. TROPHIES DATABASE
const TROPHIES = [
  { id: 'primeiro_passo', name: 'Primeiro Treino Concluído', icon: '🐣', desc: 'Saiu da inércia!' },
  { id: 'monstro_agua', name: 'Hidratação Freaky', icon: '💧', desc: 'Bebeu mais de 3L em um dia.' },
  { id: 'monstro_prot', name: 'Meta de Dieta Batida', icon: '🍗', desc: 'Bateu meta diária de proteínas.' },
  { id: 'limite_superado', name: 'Limite Superado', icon: '⚡', desc: 'Subiu para o Nível 5!' },
  { id: 'freaky_tier', name: 'Atingiu Shape Lendário', icon: '👑', desc: 'Chegou ao Nível 25!' },
  { id: 'overload_champion', name: 'Rei do Overload', icon: '✊', desc: 'Progrediu carga pela primeira vez!' }
];



let userProfile = {
  name: '',
  sex: '',
  mainObjective: '',
  motivation: '',
  focusArea: '',
  class: '',
  experienceLevel: '',
  activityLevel: '',
  height: 170,
  currentWeight: 70,
  targetWeight: 70,
  jointPain: [],
  profilePic: '',
  workoutHistory: {},
  weeklyDaysGoal: 3,
  notificationsEnabled: true,
  notificationTime: '18:00',
  attributes: {
    FOR: 10,
    RES: 10,
    AGI: 10,
    VIG: 10,
    FOC: 10
  }
};

// ==========================================
// 5. APPLICATION STATE ENGINE
// ==========================================
let state = {
  charName: '',
  charClass: 'bodybuilder',
  charWeight: 75,
  charHeight: 178,
  charGoal: 'engordar', // emagrecer, engordar, manter
  charFreq: 'medio',
  charExp: 'rato',
  charGender: 'masculino',
  motivation: 'saude',
  focusMuscle: 'FullBody',
  injury: 'Nenhum',
  weeklyTrainGoal: 4,
  notificationEnabled: true,
  notificationTime: '18:00',
  workoutsThisWeek: 0,
  lastWorkoutDate: '',
  lastNotificationDate: '',
  targetWeight: 75,
  level: 1,
  xp: 0,
  xpNeeded: 100,
  attributes: {
    for: 10,
    res: 10,
    agi: 10,
    vig: 10,
    foc: 10
  },
  attrPoints: 0,
  activeMentor: 'rocklee',
  activeWorkoutDiv: 'A',
  workoutsCompleted: 0,
  waterIntake: 0, // LITRES E.g. 1, 2, 3
  waterDrank: 0,
  waterTarget: 3, // Target Litres
  
  // Diet trackers
  kcalTarget: 2500,
  protTarget: 150,
  fiberTarget: 25,
  dailyMacros: { kcal: 0, prot: 0, fiber: 0, carbs: 0 },
  
  dailyQuests: [],
  unlockedTrophies: [],
  soundEnabled: true,
  
  // Custom workouts system
  useCustomWorkout: false,
  customWorkouts: {
    A: { title: "Custom A", desc: "Sua ficha de treino customizada", exercises: [] },
    B: { title: "Custom B", desc: "Sua ficha de treino customizada", exercises: [] },
    C: { title: "Custom C", desc: "Sua ficha de treino customizada", exercises: [] }
  },

  // Logged meals today
  mealLogs: [],
  
  // Food items database (official + custom ones)
  foodsDb: [
    { id: 'frango', name: "Peito de Frango", kcal: 165, prot: 31.0, fiber: 0.0, isCustom: false },
    { id: 'arroz', name: "Arroz Branco Cozido", kcal: 130, prot: 2.7, fiber: 0.4, isCustom: false },
    { id: 'ovos', name: "Ovos Inteiros Cozidos", kcal: 155, prot: 13.0, fiber: 0.0, isCustom: false },
    { id: 'whey', name: "Whey Protein", kcal: 400, prot: 80.0, fiber: 1.0, isCustom: false },
    { id: 'banana', name: "Banana Prata", kcal: 89, prot: 1.1, fiber: 2.6, isCustom: false },
    { id: 'batatadoce', name: "Batata Doce Cozida", kcal: 86, prot: 1.6, fiber: 3.0, isCustom: false },
    { id: 'aveia', name: "Aveia em Flocos", kcal: 389, prot: 16.9, fiber: 10.6, isCustom: false },
    { id: 'feijao', name: "Feijão Carioca Cozido", kcal: 76, prot: 4.8, fiber: 8.5, isCustom: false }
  ],
  
  // Custom mentors created by the user
  customMentors: [],
  
  // Personal Records map for exercises: { "Supino Reto (Barra)": 40 }
  personalRecords: {},

  // Tutorial and cosmetics
  tutorialCompleted: false,
  unlockedItems: [],
  profilePic: '',

  // --- NEW MENTOR PROGRESSION STATE ---
  mentorLevels: {
    bebezinho: 1,
    rocklee: 1,
    goku: 1,
    arnold: 1,
    ramondino: 1,
    brolyz: 1,
    saitama: 1,
    nickwalker: 1
  },
  mentorXP: {
    bebezinho: 0,
    rocklee: 0,
    goku: 0,
    arnold: 0,
    ramondino: 0,
    brolyz: 0,
    saitama: 0,
    nickwalker: 0
  },
  mentorXPNeeded: 100, // Fixo por nível
  
  // Custom features
  dailyChallenge: { id: 'dc_water', progress: 0, completed: false, claimed: false },
  weightHistory: [],
  strengthHistory: [],

  // Persistência de séries do treino (por dia)
  activeSetsTracker: {}
};

const ACTIVITY_MULTIPLIERS = {
  pouco: 1.2,
  ativo: 1.375,
  moderado: 1.55,
  muito: 1.725
};

const EXP_SCALE = {
  novico: { weight: 0.75, sets: -1 },
  rato: { weight: 1.0, sets: 0 },
  oldschool: { weight: 1.15, sets: 1 }
};

const MENTOR_XP_BONUS = {
  bebezinho: 1.15,
  brolyz: 1.20,
  rocklee: 1.08,
  ramondino: 1.10,
  goku: 1.12,
  arnold: 1.18,
  saitama: 1.10,
  nickwalker: 1.22
};

const FOCUS_BONUS_EXERCISES = {
  Peito: { name: 'Crucifixo com Halteres (Foco Peito)', sets: 3, targetReps: '12-15', muscle: 'Peito', weight: 10 },
  Costas: { name: 'Remada Unilateral (Foco Costas)', sets: 3, targetReps: '10-12', muscle: 'Costas', weight: 12 },
  Ombros: { name: 'Elevação Frontal (Foco Ombros)', sets: 3, targetReps: '12-15', muscle: 'Ombros', weight: 8 },
  Braços: { name: 'Rosca Alternada (Foco Braços)', sets: 3, targetReps: '10-12', muscle: 'Braços', weight: 10 },
  Pernas: { name: 'Cadeira Extensora (Foco Pernas)', sets: 3, targetReps: '12-15', muscle: 'Pernas', weight: 30 },
  FullBody: null
};

const MOTIVATION_FLAVOR = {
  saude: 'Longevidade e disposição no radar.',
  peso: 'Queimar calorias e secar o shape.',
  aura: 'Exalar aura máxima no espelho.',
  estresse: 'Canalizar a raiva em ferro puro.',
  filosofico: 'Redescobrir o melhor de si.',
  moral: 'Ficar fortinho pra quem importa.'
};

function getTodayKey() {
  return new Date().toDateString();
}

function buildSetKey(exIdx, setNum) {
  return `${state.useCustomWorkout ? 'cust' : 'std'}_${state.activeWorkoutDiv}_ex${exIdx}_set${setNum}_${getTodayKey()}`;
}

function normalizeSetEntry(entry) {
  if (!entry) return null;
  if (entry === true) return { completed: true, weight: 0, reps: 0 };
  return entry;
}

function isSetCompleted(entry) {
  const normalized = normalizeSetEntry(entry);
  return !!(normalized && normalized.completed);
}

function parseTargetReps(repsStr) {
  if (!repsStr) return 10;
  const match = String(repsStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 10;
}

function getMentorXPBonus() {
  return MENTOR_XP_BONUS[state.activeMentor] || 1.0;
}

function updateWaterTargetFromWeight() {
  const w = parseFloat(state.charWeight) || 70;
  state.waterTarget = Math.max(2, Math.min(6, Math.round(w * 0.035)));
}

function purgeOldSetTrackerKeys() {
  if (!state.activeSetsTracker) state.activeSetsTracker = {};
  const today = getTodayKey();
  Object.keys(state.activeSetsTracker).forEach((key) => {
    if (!key.endsWith(today)) delete state.activeSetsTracker[key];
  });
}

function getResolvedWorkoutTemplate() {
  if (state.useCustomWorkout) {
    const base = state.customWorkouts[state.activeWorkoutDiv];
    return {
      title: base.title,
      desc: base.desc,
      exercises: base.exercises.map((ex) => ({ ...ex }))
    };
  }

  const raw = WORKOUT_TEMPLATES[state.charClass][state.activeWorkoutDiv];
  const expCfg = EXP_SCALE[state.charExp] || EXP_SCALE.rato;
  const exercises = raw.exercises.map((ex) => ({
    ...ex,
    weight: Math.round((ex.weight || 0) * expCfg.weight),
    sets: Math.max(2, Math.min(6, ex.sets + expCfg.sets))
  }));

  const focus = state.focusMuscle;
  if (focus && focus !== 'FullBody' && FOCUS_BONUS_EXERCISES[focus]) {
    const bonus = { ...FOCUS_BONUS_EXERCISES[focus] };
    bonus.weight = Math.round((bonus.weight || 0) * expCfg.weight);
    exercises.unshift(bonus);
  }

  const focusNote = focus && focus !== 'FullBody' ? ` · Ênfase: ${focus}` : '';
  const expNote = state.charExp === 'novico' ? ' · Iniciante' : state.charExp === 'oldschool' ? ' · Avançado' : '';

  return {
    title: raw.title,
    desc: raw.desc + focusNote + expNote,
    exercises
  };
}

function getWorkoutCompletionStats() {
  const template = getResolvedWorkoutTemplate();
  let totalSets = 0;
  let completedSets = 0;

  template.exercises.forEach((ex, exIdx) => {
    for (let s = 1; s <= ex.sets; s++) {
      totalSets++;
      if (isSetCompleted(state.activeSetsTracker[buildSetKey(exIdx, s)])) completedSets++;
    }
  });

  return {
    totalSets,
    completedSets,
    percent: totalSets ? (completedSets / totalSets) * 100 : 0
  };
}

function calculateSessionVolume() {
  const template = getResolvedWorkoutTemplate();
  let volume = 0;

  template.exercises.forEach((ex, exIdx) => {
    for (let s = 1; s <= ex.sets; s++) {
      const entry = normalizeSetEntry(state.activeSetsTracker[buildSetKey(exIdx, s)]);
      if (entry && entry.completed) {
        const weight = entry.weight || ex.weight || 0;
        const reps = entry.reps || parseTargetReps(ex.targetReps);
        volume += weight * reps;
      }
    }
  });

  return volume;
}

let restTimerInterval = null;

function startRestTimer(seconds) {
  const banner = document.getElementById('rest-timer-banner');
  const countdown = document.getElementById('rest-timer-countdown');
  const fill = document.getElementById('rest-timer-progress-fill');
  if (!banner || !countdown) return;

  // Rock Lee Cuts
  let leeCut = 0;
  if (state.activeMentor === 'rocklee') {
    const leeLvl = (state.mentorAffinities && state.mentorAffinities['rocklee'] && state.mentorAffinities['rocklee'].level) || state.mentorLevels['rocklee'] || 1;
    if (leeLvl >= 35) {
      leeCut = 10;
    } else if (leeLvl >= 15) {
      leeCut = 5;
    }
  }
  
  // Permanent baked buff check (Tier 3)
  if (state.bakedBuffs && state.bakedBuffs.includes('rocklee_t3_passive')) {
    leeCut = Math.max(leeCut, 15);
  }

  const adjusted = Math.max(30, seconds - Math.floor((state.attributes.agi || 10) / 5) - leeCut);
  let remaining = adjusted;

  if (restTimerInterval) clearInterval(restTimerInterval);
  banner.classList.remove('hidden');
  countdown.innerText = remaining;
  if (fill) fill.style.width = '100%';

  restTimerInterval = setInterval(() => {
    remaining -= 1;
    countdown.innerText = remaining;
    if (fill) fill.style.width = `${Math.max(0, (remaining / adjusted) * 100)}%`;
    if (remaining <= 0) {
      clearInterval(restTimerInterval);
      restTimerInterval = null;
      banner.classList.add('hidden');
      playSound('alarm');
      
      // Screen shake effect
      document.body.classList.add('screen-shake');
      setTimeout(() => {
        document.body.classList.remove('screen-shake');
      }, 500);
    }
  }, 1000);
}

function stopRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  const banner = document.getElementById('rest-timer-banner');
  if (banner) banner.classList.add('hidden');
}

function getWeekNumber(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + '-W' + (1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7));
}

function checkWeeklyReset() {
  const today = new Date();
  const currentWeekId = getWeekNumber(today);

  if (state.lastWorkoutDate) {
    const lastDate = new Date(state.lastWorkoutDate);
    const lastWeekId = getWeekNumber(lastDate);

    if (currentWeekId !== lastWeekId) {
      state.workoutsThisWeek = 0;
      saveState();
    }
  }
}

function showExtraWorkoutToast(current, target) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  if (message && toast) {
    message.innerText = `💥 AURA EXTRA! Treino extra ${current}/${target} concluído! (+30 XP Bônus)`;
    toast.classList.remove('hidden');
    playSound('quest');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3800);
  }
}

// 6. HIGH-QUALITY AUDIO ENGINE (IA MP3 & Web Audio Fallbacks)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!state.soundEnabled) return;
  playSynthSound(type);
}

function speakMentor(mentorId) {
  // Vozes desativadas
}

function playSynthSound(type) {
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
// 7. LOCAL STORAGE ENGINE
// ==========================================
function saveState() {
  try {
    localStorage.setItem('freakyquest_state_v2', JSON.stringify(state));
    // Persist all active status states to localStorage under 'freaky_quest_user'
    const raw = localStorage.getItem('freaky_quest_user');
    const userObj = raw ? JSON.parse(raw) : {};
    userObj.anabolicActive = !!state.anabolicActive;
    userObj.catabolizandoActive = !!state.catabolizandoActive;
    userObj.dailyMacros = state.dailyMacros;
    userObj.workoutHistory = userProfile.workoutHistory || {};
    localStorage.setItem('freaky_quest_user', JSON.stringify(userObj));
  } catch (e) {
    console.error("localStorage save blocked or failed", e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('freakyquest_state_v2');
    if (saved) {
      try {
        state = JSON.parse(saved);
        // Fallback arrays
        if (!state.mealLogs) state.mealLogs = [];
        if (!state.personalRecords) state.personalRecords = {};
        if (!state.customWorkouts) {
          state.customWorkouts = {
            A: { title: "Custom A", desc: "Sua ficha de treino customizada", exercises: [] },
            B: { title: "Custom B", desc: "Sua ficha de treino customizada", exercises: [] },
            C: { title: "Custom C", desc: "Sua ficha de treino customizada", exercises: [] }
          };
        }
        if (!state.foodsDb || state.foodsDb.length === 0) {
          state.foodsDb = [
            { id: 'frango', name: "Peito de Frango", kcal: 165, prot: 31.0, fiber: 0.0, isCustom: false },
            { id: 'arroz', name: "Arroz Branco Cozido", kcal: 130, prot: 2.7, fiber: 0.4, isCustom: false },
            { id: 'ovos', name: "Ovos Inteiros Cozidos", kcal: 155, prot: 13.0, fiber: 0.0, isCustom: false },
            { id: 'whey', name: "Whey Protein", kcal: 400, prot: 80.0, fiber: 1.0, isCustom: false },
            { id: 'banana', name: "Banana Prata", kcal: 89, prot: 1.1, fiber: 2.6, isCustom: false },
            { id: 'batatadoce', name: "Batata Doce Cozida", kcal: 86, prot: 1.6, fiber: 3.0, isCustom: false },
            { id: 'aveia', name: "Aveia em Flocos", kcal: 389, prot: 16.9, fiber: 10.6, isCustom: false },
            { id: 'feijao', name: "Feijão Carioca Cozido", kcal: 76, prot: 4.8, fiber: 8.5, isCustom: false }
          ];
        }
        if (!state.customMentors) state.customMentors = [];
        
        // Fallback for new onboarding fields
        if (state.motivation === undefined) state.motivation = 'saude';
        if (state.focusMuscle === undefined) state.focusMuscle = 'FullBody';
        if (state.injury === undefined) state.injury = 'Nenhum';
        if (state.weeklyTrainGoal === undefined) state.weeklyTrainGoal = 4;
        if (state.notificationEnabled === undefined) state.notificationEnabled = true;
        if (state.notificationTime === undefined) state.notificationTime = '18:00';
        if (state.workoutsThisWeek === undefined) state.workoutsThisWeek = 0;
        if (state.lastWorkoutDate === undefined) state.lastWorkoutDate = '';
        if (state.lastNotificationDate === undefined) state.lastNotificationDate = '';
        if (state.targetWeight === undefined) state.targetWeight = state.charWeight || 75;
        if (state.tutorialCompleted === undefined) state.tutorialCompleted = false;
        if (state.unlockedItems === undefined) state.unlockedItems = [];
        if (state.profilePic === undefined) state.profilePic = '';
        try {
          const userObj = JSON.parse(localStorage.getItem('freaky_quest_user'));
          if (userObj) {
            if (userObj.profilePic) {
              state.profilePic = userObj.profilePic;
              userProfile.profilePic = userObj.profilePic;
            }
            // Sync jointPain array → state.injury so workout warnings render on reload
            if (userObj.jointPain) {
              userProfile.jointPain = userObj.jointPain;
              state.injury = Array.isArray(userObj.jointPain)
                ? userObj.jointPain
                : [userObj.jointPain];
            }
          }
        } catch (e) {}

        // Fallbacks for mentor progression state
        if (!state.mentorLevels) {
          state.mentorLevels = { bebezinho: 1, rocklee: 1, goku: 1, arnold: 1, ramondino: 1, brolyz: 1, saitama: 1, nickwalker: 1 };
        } else if (state.mentorLevels.nickwalker === undefined) {
          state.mentorLevels.nickwalker = 1;
        }
        if (!state.mentorXP) {
          state.mentorXP = { bebezinho: 0, rocklee: 0, goku: 0, arnold: 0, ramondino: 0, brolyz: 0, saitama: 0, nickwalker: 0 };
        } else if (state.mentorXP.nickwalker === undefined) {
          state.mentorXP.nickwalker = 0;
        }
        if (state.mentorXPNeeded === undefined) state.mentorXPNeeded = 100;
        
        if (state.dailyMacros === undefined) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
        if (!state.mentorAffinities) state.mentorAffinities = {};
        OFFICIAL_MENTORS.forEach(m => {
          if (!state.mentorAffinities[m.id]) {
            state.mentorAffinities[m.id] = {
              level: (state.mentorLevels && state.mentorLevels[m.id]) || 1,
              xp: (state.mentorXP && state.mentorXP[m.id]) || 0,
              prestige: 0
            };
          }
        });
        if (!state.bakedBuffs) state.bakedBuffs = [];
        
        // Custom features fallbacks
        if (!state.weightHistory) state.weightHistory = [parseFloat(state.charWeight) || 80];
        if (!state.strengthHistory) state.strengthHistory = [50 + (state.attributes.for || 10) * 1.5];
        if (!state.dailyChallenge) {
          state.dailyChallenge = { id: 'dc_water', progress: 0, completed: false, claimed: false };
        }
        if (!state.activeSetsTracker) state.activeSetsTracker = {};
        if (state.waterTargetManual === undefined) state.waterTargetManual = false;
        if (state.waterDrank === undefined) state.waterDrank = state.waterIntake || 0;
        if (state.dailyMacros === undefined) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };

        // Sync workoutHistory from freaky_quest_user into userProfile on load
        if (!userProfile.workoutHistory) userProfile.workoutHistory = {};
        if (!userProfile.rivals) {
          userProfile.rivals = {
            "Supino Reto (Barra)": { name: "Gabriel ganley bebezinho", weight: 40 },
            "Agachamento Livre": { name: "Rock Lee", weight: 30 }
          };
        }
        try {
          const _fqu = JSON.parse(localStorage.getItem('freaky_quest_user'));
          if (_fqu) {
            if (_fqu.workoutHistory && typeof _fqu.workoutHistory === 'object') {
              userProfile.workoutHistory = _fqu.workoutHistory;
              // Back-fill state.personalRecords from workoutHistory for consistency
              Object.entries(_fqu.workoutHistory).forEach(([exName, maxW]) => {
                if (!state.personalRecords[exName] || maxW > state.personalRecords[exName]) {
                  state.personalRecords[exName] = maxW;
                }
              });
            }
            if (_fqu.rivals && typeof _fqu.rivals === 'object') {
              userProfile.rivals = _fqu.rivals;
            }
          }
        } catch (_e) {}

        purgeOldSetTrackerKeys();
        
        // Auto recalculate target numbers if weights or goals changed
        recalculateMacrosTargets();
        if (!state.waterTargetManual) updateWaterTargetFromWeight();
        return true;
      } catch(e) {
        console.error("Falha ao ler save do localStorage v2", e);
      }
    }
  } catch (e) {
    console.error("localStorage reading blocked or failed", e);
  }
  return false;
}

// Recalculates Target Kcal and Protein dynamically based on user profile weight, goal and activity!
function recalculateMacrosTargets() {
  const w = parseFloat(state.charWeight) || 70;
  const targetW = parseFloat(state.targetWeight) || w;
  const h = parseFloat(state.charHeight) || 170;
  const activityMult = ACTIVITY_MULTIPLIERS[state.charFreq] || ACTIVITY_MULTIPLIERS.moderado;

  let refWeight = w;
  if (state.charGoal === 'engordar' || state.charGoal === 'estetico') {
    refWeight = Math.max(w, targetW);
  } else if (state.charGoal === 'emagrecer') {
    refWeight = Math.min(w, targetW);
  }

  const hMeters = h / 100;
  const bmr = state.charGender === 'feminino'
    ? 655 + (9.6 * w) + (1.8 * h) - (4.7 * 25)
    : 66 + (13.7 * w) + (5 * h) - (6.8 * 25);

  let goalFactor = 1.0;
  if (state.charGoal === 'emagrecer') goalFactor = 0.85;
  else if (state.charGoal === 'engordar') goalFactor = 1.12;
  else if (state.charGoal === 'estetico') goalFactor = 1.0;
  else if (state.charGoal === 'saude') goalFactor = 0.95;

  state.kcalTarget = Math.round(bmr * activityMult * goalFactor);

  if (state.charGoal === 'emagrecer') {
    state.protTarget = Math.round(refWeight * 2.2);
  } else if (state.charGoal === 'engordar') {
    state.protTarget = Math.round(refWeight * 2.0);
  } else if (state.charGoal === 'estetico') {
    state.protTarget = Math.round(refWeight * 2.3);
  } else {
    state.protTarget = Math.round(refWeight * 1.8);
  }

  state.fiberTarget = Math.max(20, Math.round(refWeight * 0.35));
  if (!state.waterTargetManual) updateWaterTargetFromWeight();
}

// 8. PROGRESSION SYSTEM
function getSubclassRank(charClass, lvl) {
  const list = SUB_CLASSES[charClass];
  let activeRank = list[0].name;
  for (let rank of list) {
    if (lvl >= rank.lvl) {
      activeRank = rank.name;
    }
  }
  return activeRank;
}

// XP addition helper - now levels up player level AND credits active mentor XP!
function addXP(amount) {
  const mentorBonus = getMentorXPBonus();
  amount = Math.round(amount * mentorBonus);
  state.xp += amount;
  
  // Add equivalent XP to the active mentor!
  addMentorXP(state.activeMentor, amount);

  // Dynamic floating combat text XP popup
  const floatingXp = document.createElement('div');
  floatingXp.className = 'floating-combat-xp';
  floatingXp.innerText = `+${amount} XP ⚔️`;
  floatingXp.style.left = `${40 + Math.random() * 20}%`;
  floatingXp.style.top = `${60 + Math.random() * 10}%`;
  document.body.appendChild(floatingXp);
  setTimeout(() => floatingXp.remove(), 1200);

  state.xpNeeded = 100 + (state.level * 25);

  while (state.xp >= state.xpNeeded) {
    const oldLevel = state.level;
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = 100 + (state.level * 25);
    state.attrPoints += 5; // Unlocks 5 points per lvl

    playSound('levelup');
    showLevelUpModal();

    if (state.level >= 5) unlockTrophy('limite_superado');
    if (state.level >= 25) unlockTrophy('freaky_tier');
    
    checkLevelRewards(oldLevel, state.level);
  }
  saveState();
  updateUI();
}

function checkLevelRewards(oldLvl, newLvl) {
  const rewards = [
    { lvl: 5, id: 'item_faixa', name: 'Faixa do Rock Lee 🟩', icon: '🟢', desc: 'Sua agilidade foi notada. Você equipou a faixa do Rock Lee! Ganha uma borda verde neon no seu avatar.' },
    { lvl: 10, id: 'item_bracelete', name: 'Braceletes de Aço 🦾', icon: '⚙️', desc: 'Seus braços estão se tornando resistentes. Braceletes de metal equipados ao lado do seu nome!' },
    { lvl: 20, id: 'item_aura', name: 'Aura de Super Saiyajin ⚡🔥', icon: '🔥', desc: 'Seu Ki despertou! Uma aura de chamas douradas agora brilha ao redor do seu avatar!' },
    { lvl: 30, id: 'item_cinturão', name: 'Cinturão de Ouro 🏆', icon: '👑', desc: 'Estética inquestionável. O Cinturão de Ouro de Arnold foi equipado no fundo do seu Status!' },
    { lvl: 40, id: 'item_aurabroly', name: 'Aura Lendária de Broly Z 🟩🔥', icon: '🐉', desc: 'Seu poder é máximo! Uma aura colossal de chamas verde néon foi equipada no seu avatar!' },
    { lvl: 50, id: 'item_capa', name: 'Capa do Saitama ⬜', icon: '⬜', desc: 'Treino concluído. Você destravou a Capa do Saitama, que flutua atrás do seu avatar!' }
  ];

  if (!state.unlockedItems) state.unlockedItems = [];

  rewards.forEach(r => {
    if (newLvl >= r.lvl && !state.unlockedItems.includes(r.id)) {
      state.unlockedItems.push(r.id);
      setTimeout(() => {
        showItemAcquiredModal(r.icon, r.name, r.desc);
      }, 1500);
    }
  });
}

// 8b. MENTOR XP & REWARD SYSTEM
function addMentorXP(mentorId, amount) {
  if (!state.mentorAffinities) state.mentorAffinities = {};
  if (!state.mentorAffinities[mentorId]) {
    state.mentorAffinities[mentorId] = { level: 1, xp: 0, prestige: 0 };
  }
  
  let mData = state.mentorAffinities[mentorId];
  if (mData.level >= 50) {
    // Lock XP at level 50
    mData.level = 50;
    mData.xp = 0;
    state.mentorXP[mentorId] = 0;
    state.mentorLevels[mentorId] = 50;
    return;
  }
  
  mData.xp += amount;
  let requiredXP = 100 + (mData.level * 25);
  
  while (mData.xp >= requiredXP && mData.level < 50) {
    mData.xp -= requiredXP;
    const oldLvl = mData.level;
    mData.level += 1;
    requiredXP = 100 + (mData.level * 25);
    
    // Sync to legacy keys
    state.mentorLevels[mentorId] = mData.level;
    state.mentorXP[mentorId] = mData.xp;
    
    // Play level up sound for active mentor
    playSound('levelup');
    
    // Check level achievements for active mentor
    checkMentorRewards(mentorId, oldLvl, mData.level);
  }
  
  // Sync to legacy keys
  state.mentorLevels[mentorId] = mData.level;
  state.mentorXP[mentorId] = mData.xp;
}

function checkMentorRewards(mentorId, oldLvl, newLvl) {
  const rewards = MENTOR_REWARDS[mentorId];
  if (!rewards) return;

  rewards.forEach(r => {
    if (newLvl >= r.lvl && oldLvl < r.lvl) {
      // Unlock item inside active unlocked items list if not custom (official items are added here)
      if (!state.unlockedItems) state.unlockedItems = [];
      
      // If it is a css_class, save it directly to state.unlockedItems
      if (r.type === 'css_class' && !state.unlockedItems.includes(r.value)) {
        state.unlockedItems.push(r.value);
      }

      // If it is a buff, apply attributes increases dynamically
      if (r.type === 'buff') {
        const parts = r.value.split('+');
        const attr = parts[0]; // e.g. "for", "res", "agi", "vig", "foc"
        const bonus = parseInt(parts[1]) || 5;
        if (state.attributes[attr] !== undefined) {
          state.attributes[attr] += bonus;
        }
      }

      // Play custom unlock sound
      if (r.type === 'sound') {
        setTimeout(() => {
          playSound(r.value);
        }, 1200);
      }

      // Trigger reward modal pop-up on screen
      setTimeout(() => {
        showItemAcquiredModal(r.icon, r.name, `${r.desc} (Ganho ao subir nível do Mentor ${OFFICIAL_MENTORS.find(m => m.id === mentorId)?.name || mentorId}!)`);
      }, 1600);
    }
  });
}

function transcendMentor(mentorId) {
  if (!state.mentorAffinities) state.mentorAffinities = {};
  if (!state.mentorAffinities[mentorId]) {
    state.mentorAffinities[mentorId] = { level: 1, xp: 0, prestige: 0 };
  }
  
  let mData = state.mentorAffinities[mentorId];
  if (mData.level < 50) return; // Must be at least level 50
  
  mData.level = 1;
  mData.xp = 0;
  mData.prestige = (mData.prestige || 0) + 1;
  
  // Sync to legacy keys
  state.mentorLevels[mentorId] = 1;
  state.mentorXP[mentorId] = 0;
  
  if (!state.bakedBuffs) state.bakedBuffs = [];
  const buffName = `${mentorId}_t3_passive`;
  if (!state.bakedBuffs.includes(buffName)) {
    state.bakedBuffs.push(buffName);
  }
  
  const mentor = OFFICIAL_MENTORS.find(m => m.id === mentorId);
  if (mentor) {
    triggerNeuralFlash(mentor);
  }
  playSound('levelup');
  showItemAcquiredModal('⭐', 'ASCENSÃO TRANSCENDIDA!', `O mentor ${OFFICIAL_MENTORS.find(m => m.id === mentorId)?.name || mentorId} atingiu Prestige ${mData.prestige}! Seu bônus passivo Tier 3 (+15s de redução de descanso) foi baked permanentemente na sua conta!`);
  
  saveState();
  updateUI();
}

// ==========================================
// 8b. DAILY FREAKY CHALLENGE SYSTEM
// ==========================================
const DAILY_CHALLENGES = [
  { id: 'dc_water', title: '💧 Hidratação Absurda', desc: 'Beba 4 Litros de água hoje para purificar o organismo e ganhar poder.', target: 4, type: 'water', rewardXP: 120 },
  { id: 'dc_protein', title: '🥩 Hipertrofia Extrema', desc: 'Consuma 100% da sua meta de proteínas diárias na dieta.', target: 1, type: 'protein', rewardXP: 100 },
  { id: 'dc_workout', title: '🏋️ Volume Mutante', desc: 'Conclua seu treino diário com intensidade extrema.', target: 1, type: 'workout', rewardXP: 150 },
  { id: 'dc_quests', title: '⚔️ Conquista Total', desc: 'Complete todas as 3 missões diárias de hoje.', target: 3, type: 'quests', rewardXP: 130 }
];

function initDailyChallenge() {
  const todayStr = new Date().toDateString();
  
  // Select a challenge based on the date so it changes daily
  const dayIndex = Math.abs(todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % DAILY_CHALLENGES.length;
  const challenge = DAILY_CHALLENGES[dayIndex];
  
  if (!state.dailyChallenge || state.dailyChallenge.dateStr !== todayStr) {
    state.dailyChallenge = {
      id: challenge.id,
      progress: 0,
      completed: false,
      claimed: false,
      dateStr: todayStr
    };
    saveState();
  }
}

function updateDailyChallengeProgress(type, amount) {
  if (!state.dailyChallenge || state.dailyChallenge.claimed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge || challenge.type !== type) return;

  if (type === 'water') {
    state.dailyChallenge.progress = Math.min(challenge.target, state.waterIntake);
  } else if (type === 'protein') {
    const isTargetMet = state.proteinIntake >= state.protTarget;
    state.dailyChallenge.progress = isTargetMet ? 1 : 0;
  } else if (type === 'workout') {
    state.dailyChallenge.progress = 1;
  } else if (type === 'quests') {
    const completedCount = state.dailyQuests.filter(q => q.completed).length;
    state.dailyChallenge.progress = Math.min(challenge.target, completedCount);
  }

  if (state.dailyChallenge.progress >= challenge.target && !state.dailyChallenge.completed) {
    state.dailyChallenge.completed = true;
    playSound('quest');
  }

  saveState();
  updateUI();
}

function triggerCelebrationConfetti() {
  const canvas = document.getElementById('celebration-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#ff5e00', '#ffb703', '#9b5de5', '#38b000', '#0077b6', '#d4af37', '#e63946'];
  
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height * 0.6 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 5,
      radius: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    
    particles.forEach(p => {
      if (p.alpha > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
    });
    
    if (active) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  animate();
}

function claimDailyChallengeReward() {
  if (!state.dailyChallenge || !state.dailyChallenge.completed || state.dailyChallenge.claimed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge) return;

  state.dailyChallenge.claimed = true;
  
  const xpReward = challenge.rewardXP;
  addXP(xpReward);

  unlockTrophy('overload_champion');

  playSound('levelup');
  showItemAcquiredModal('🔥', 'RECOMPENSA RESGATADA!', `Você ganhou +${xpReward} XP e a Insígnia Mutante para seu Shape!`);

  triggerCelebrationConfetti();

  saveState();
  updateUI();
}

function renderDailyChallenge() {
  initDailyChallenge();
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge) return;

  // Refresh progress dynamically
  if (!state.dailyChallenge.claimed) {
    if (challenge.type === 'water') {
      state.dailyChallenge.progress = Math.min(challenge.target, state.waterIntake);
    } else if (challenge.type === 'protein') {
      state.dailyChallenge.progress = state.proteinIntake >= state.protTarget ? 1 : 0;
    } else if (challenge.type === 'quests') {
      const completedCount = state.dailyQuests.filter(q => q.completed).length;
      state.dailyChallenge.progress = Math.min(challenge.target, completedCount);
    }
    if (state.dailyChallenge.progress >= challenge.target) {
      state.dailyChallenge.completed = true;
    }
  }

  const titleEl = document.getElementById('daily-challenge-title');
  const descEl = document.getElementById('daily-challenge-desc');
  const progressFill = document.getElementById('daily-challenge-progress-fill');
  const progressText = document.getElementById('daily-challenge-progress-text');
  const rewardEl = document.getElementById('daily-challenge-reward');
  const claimBtn = document.getElementById('btn-claim-challenge');
  const badgeEl = document.getElementById('daily-challenge-badge');

  if (titleEl) titleEl.innerText = challenge.title;
  if (descEl) descEl.innerText = challenge.desc;

  const currentProg = state.dailyChallenge.progress;
  const targetProg = challenge.target;
  const pct = Math.round((currentProg / targetProg) * 100);

  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) {
    if (challenge.type === 'water') {
      progressText.innerText = `${currentProg} / ${targetProg} L`;
    } else if (challenge.type === 'protein') {
      progressText.innerText = currentProg >= targetProg ? 'CONCLUÍDO' : 'PENDENTE';
    } else if (challenge.type === 'workout') {
      progressText.innerText = currentProg >= targetProg ? 'CONCLUÍDO' : 'PENDENTE';
    } else if (challenge.type === 'quests') {
      progressText.innerText = `${currentProg} / ${targetProg}`;
    }
  }

  if (rewardEl) {
    rewardEl.innerText = `Recompensa: +${challenge.rewardXP} XP Mutante 👑`;
  }

  const dailySectionEl = document.querySelector('.daily-challenge-section');
  if (state.dailyChallenge.claimed) {
    if (dailySectionEl) dailySectionEl.classList.remove('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'CONCLUÍDO';
      badgeEl.style.background = '#4caf50';
    }
    if (claimBtn) {
      claimBtn.classList.add('hidden');
    }
  } else if (state.dailyChallenge.completed) {
    if (dailySectionEl) dailySectionEl.classList.add('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'CONCLUÍDO';
      badgeEl.style.background = '#4caf50';
    }
    if (claimBtn) {
      claimBtn.classList.remove('hidden');
    }
  } else {
    if (dailySectionEl) dailySectionEl.classList.remove('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'ATIVO';
      badgeEl.style.background = 'var(--accent-orange, #ff5e00)';
    }
    if (claimBtn) {
      claimBtn.classList.add('hidden');
    }
  }
}

// ==========================================
// 9. DAILY QUEST GENERATOR
// ==========================================
function generateDailyQuests() {
  const quests = [];
  
  // 1. Water Quest
  quests.push({
    id: 'quest_water',
    name: 'Hidratação Padrão',
    desc: `Beber pelo menos ${state.waterTarget}L de água hoje`,
    xpReward: 20,
    completed: false
  });

  // 2. Diet Quest
  quests.push({
    id: 'quest_protein',
    name: 'Meta Nutricional',
    desc: `Bater pelo menos 80% da sua meta de proteínas (${Math.round(state.protTarget * 0.8)}g)`,
    xpReward: 25,
    completed: false
  });

  // 3. Class Quest
  let classQuest = {};
  switch(state.charClass) {
    case 'bodybuilder':
      classQuest = { id: 'quest_class', name: 'Pump Máximo', desc: 'Finalizar um treino completo na arena de treino', xpReward: 30, completed: false };
      break;
    case 'powerlifter':
      classQuest = { id: 'quest_class', name: 'Batalha de Cargas', desc: 'Registrar cargas pesadas com postura perfeita', xpReward: 30, completed: false };
      break;
    case 'calistenia':
      classQuest = { id: 'quest_class', name: 'Controle de Aço', desc: 'Completar rotina calistênica isométrica', xpReward: 30, completed: false };
      break;
    case 'maratonista':
      classQuest = { id: 'quest_class', name: 'Cardio Violento', desc: 'Concluir treino de alta intensidade ou tiros rápidos', xpReward: 30, completed: false };
      break;
  }
  const motivationNote = MOTIVATION_FLAVOR[state.motivation];
  if (motivationNote) {
    classQuest.desc += ` · ${motivationNote}`;
  }
  quests.push(classQuest);
  
  state.dailyQuests = quests;
  saveState();
}

// ==========================================
// 10. DYNAMIC CSS STYLES FOR CUSTOM MENTORS
// ==========================================
function applyMentorVisualTheme(mentor) {
  if (!mentor) return;
  
  // Manage Bebezinho particles
  let particlesContainer = document.getElementById('bebezinho-particles');
  if (mentor.id === 'bebezinho') {
    if (!particlesContainer) {
      particlesContainer = document.createElement('div');
      particlesContainer.id = 'bebezinho-particles';
      particlesContainer.className = 'bebezinho-particles-container';
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'bebezinho-sparkle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.animationDelay = `${Math.random() * 3}s`;
        p.style.animationDuration = `${2 + Math.random() * 4}s`;
        particlesContainer.appendChild(p);
      }
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.appendChild(particlesContainer);
      }
    }
  } else {
    if (particlesContainer) {
      particlesContainer.remove();
    }
  }

  if (mentor.isCustom) {
    // Dynamic styles generation on fly!
    let styleTag = document.getElementById('custom-mentor-theme-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-mentor-theme-style';
      document.head.appendChild(styleTag);
    }
    
    const h = mentor.hue;
    styleTag.innerHTML = `
      body.theme-custom-${mentor.id} {
        --primary-hue: ${h};
        --primary-sat: 90%;
        --primary-light: 50%;
        --accent-hue: ${(h + 150) % 360};
        --accent-sat: 95%;
        --accent-light: 50%;
      }
    `;
    
    document.body.className = `theme-custom-${mentor.id}`;
  } else {
    // Standard themes
    document.body.className = mentor.theme;
  }
}

// ==========================================
// Helper to get avatar source URL (handles URLs, paths, and converts emojis to SVG data URLs)
function getMentorAvatarSrc(mentor) {
  if (!mentor) return 'rocklee.png';
  const avatar = mentor.avatar;
  if (!avatar) return 'rocklee.png';
  
  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.includes('.') || avatar.startsWith('/') || avatar.startsWith('assets/')) {
    return avatar;
  }
  
  // Encode emoji/text into a clean inline SVG data URL
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.82em" font-size="70" x="15">${avatar}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
}

function getUserAvatarSrc() {
  if (state.profilePic) {
    return state.profilePic;
  }
  // Fallback to active mentor avatar
  let activeMentorData = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
  if (!activeMentorData) {
    activeMentorData = state.customMentors.find(m => m.id === state.activeMentor);
  }
  if (!activeMentorData) activeMentorData = OFFICIAL_MENTORS[0];
  return getMentorAvatarSrc(activeMentorData);
}

// 11. UI RENDERING SYSTEM
// ==========================================
// ==========================================
function updateUI() {
  // Recalculate targets just in case
  recalculateMacrosTargets();

  // Basic headers sync
  document.getElementById('player-name').innerText = state.charName;
  document.getElementById('player-level-badge').innerText = `Lvl ${state.level}`;
  
  const classLabels = {
    bodybuilder: 'Bodybuilder 💪',
    powerlifter: 'Powerlifter 🏋️‍♂️',
    calistenia: 'Calistênico 🤸‍♂️',
    maratonista: 'Maratonista 🏃‍♂️'
  };
  document.getElementById('player-class-name').innerText = classLabels[state.charClass] || state.charClass;

  const currentRank = getSubclassRank(state.charClass, state.level);
  document.getElementById('player-rank').innerText = currentRank;

  // XP indicators
  document.getElementById('xp-text').innerText = `${state.xp} / ${state.xpNeeded} XP`;
  const xpPercent = Math.min(100, (state.xp / state.xpNeeded) * 100);
  document.getElementById('xp-fill').style.width = `${xpPercent}%`;

  // Get active mentor data (Official or Custom)
  let activeMentorData = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
  if (!activeMentorData) {
    activeMentorData = state.customMentors.find(m => m.id === state.activeMentor);
  }
  if (!activeMentorData) activeMentorData = OFFICIAL_MENTORS[0]; // fallback Lee

  // Set avatar pictures (using new helper for custom and official mentors)
  const userAvatarSrc = getUserAvatarSrc();
  const avatarSrc = getMentorAvatarSrc(activeMentorData);
  document.getElementById('header-avatar').src = userAvatarSrc;
  document.getElementById('status-avatar').src = userAvatarSrc;

  // Apply aura styles
  const headerAvatarWrapper = document.getElementById('header-avatar').parentElement;
  const statusAvatarWrapper = document.getElementById('status-avatar').parentElement;
  const auraClasses = ['aura-bebezinho', 'aura-brolyz', 'aura-rocklee', 'aura-ramondino', 'aura-goku', 'aura-arnold', 'aura-saitama', 'aura-nickwalker', 'aura-custom'];
  if (headerAvatarWrapper) {
    auraClasses.forEach(c => headerAvatarWrapper.classList.remove(c));
    headerAvatarWrapper.classList.add(activeMentorData.isCustom ? 'aura-custom' : `aura-${activeMentorData.id}`);
  }
  if (statusAvatarWrapper) {
    auraClasses.forEach(c => statusAvatarWrapper.classList.remove(c));
    statusAvatarWrapper.classList.add(activeMentorData.isCustom ? 'aura-custom' : `aura-${activeMentorData.id}`);
  }

  // Mentor speech bubble
  document.getElementById('mentor-bubble-img').src = avatarSrc;
  document.getElementById('mentor-bubble-name').innerText = activeMentorData.name;
  const motivationTip = MOTIVATION_FLAVOR[state.motivation];
  document.getElementById('mentor-bubble-quote').innerText = motivationTip
    ? `${activeMentorData.quote} (${motivationTip})`
    : activeMentorData.quote;

  // Apply theme coloring
  applyMentorVisualTheme(activeMentorData);

  // ==========================================
  // TAB: PAINEL / DASHBOARD
  // ==========================================
  // Synchronize userProfile from localStorage 'freaky_quest_user' if available
  try {
    const storedUser = localStorage.getItem('freaky_quest_user');
    if (storedUser) {
      Object.assign(userProfile, JSON.parse(storedUser));
    }
  } catch (e) {}

  // Sync basic UI elements based on userProfile
  document.getElementById('player-name').innerText = userProfile.name || state.charName || 'Nick';
  document.getElementById('player-level-badge').innerText = `Lvl ${state.level}`;
  
  const uClass = userProfile.class || state.charClass || 'bodybuilder';
  document.getElementById('player-class-name').innerText = classLabels[uClass] || uClass;

  const uRank = getSubclassRank(uClass, state.level);
  document.getElementById('player-rank').innerText = uRank;

  // Mentor speech bubble
  const uMotivationTip = MOTIVATION_FLAVOR[userProfile.motivation || state.motivation];
  document.getElementById('mentor-bubble-quote').innerText = uMotivationTip
    ? `${activeMentorData.quote} (${uMotivationTip})`
    : activeMentorData.quote;

  // IMC Ficha indicators from userProfile
  const weight = parseFloat(userProfile.currentWeight) || parseFloat(state.charWeight) || 75;
  const height = parseFloat(userProfile.height) || parseFloat(state.charHeight) || 175;
  
  document.getElementById('eval-weight').innerText = `${weight} kg`;
  document.getElementById('eval-height').innerText = `${height} cm`;
  
  const hMeters = height / 100;
  const imc = weight / (hMeters * hMeters);
  document.getElementById('eval-imc').innerText = imc.toFixed(1);
  
  let imcCat = "Ideal";
  let imcRpgTip = "";
  if (imc < 18.5) {
    imcCat = "Abaixo do Peso";
    imcRpgTip = "🏹 **Ectomorfo Ágil:** Alta agilidade nativa! Foco em bater o **Surplus de Calorias (Bulking)** urgente para ganhar massa muscular.";
  } else if (imc < 25) {
    imcCat = "Peso Ideal";
    imcRpgTip = "⚔️ **Shape Equilibrado:** Status corporais estáveis. Pronto para qualquer especialidade do ferro!";
  } else if (imc < 30) {
    imcCat = "Sobrepeso";
    imcRpgTip = "🛡️ **Potencial Tanker:** Força muscular acumulada! Ótimo para levantar cargas brutas e lapidar o shape.";
  } else {
    imcCat = "Obesidade";
    imcRpgTip = "🌋 **Titã Supremo:** Enorme potencial de força bruta. Ajuste sua ingestão proteica e rotina semanal para lapidar essa muralha.";
  }
  document.getElementById('eval-imc-class').innerText = imcCat;
  document.getElementById('eval-rpg-tip').innerHTML = imcRpgTip;
  
  const goalsLabels = {
    emagrecer: "Secar (Cutting) ⚡",
    engordar: "Crescer (Bulking) 🌋",
    manter: "Lapidar (Recomp) ⚖️",
    estetico: "Ficar Estético 🏆",
    saude: "Melhorar Saúde 🧬"
  };
  document.getElementById('eval-goal-badge').innerText = goalsLabels[userProfile.mainObjective || state.charGoal] || state.charGoal || '—';

  // Meta semanal de treinos
  checkWeeklyReset();
  const weeklyCurrent = state.workoutsThisWeek || 0;
  const weeklyTarget = userProfile.weeklyDaysGoal || state.weeklyTrainGoal || 4;
  const weeklyPct = Math.min(100, Math.round((weeklyCurrent / weeklyTarget) * 100));
  const weeklyBadge = document.getElementById('weekly-goal-badge');
  const weeklyFill = document.getElementById('weekly-progress-fill');
  const weeklyText = document.getElementById('weekly-goal-text');
  if (weeklyBadge) weeklyBadge.innerText = `${weeklyCurrent}/${weeklyTarget}`;
  if (weeklyFill) weeklyFill.style.width = `${weeklyPct}%`;
  if (weeklyText) {
    if (weeklyCurrent >= weeklyTarget) {
      weeklyText.innerText = `🔥 Meta batida! ${weeklyCurrent - weeklyTarget > 0 ? `+${weeklyCurrent - weeklyTarget} treino(s) extra(s) esta semana.` : 'Constância de caçador!'}`;
    } else {
      weeklyText.innerText = `Faltam ${weeklyTarget - weeklyCurrent} treino(s) para completar sua meta semanal.`;
    }
  }

  // Progresso de séries do treino de hoje
  const workoutStats = getWorkoutCompletionStats();
  const workoutProgressEl = document.getElementById('workout-today-progress');
  if (workoutProgressEl) {
    workoutProgressEl.innerText = `${workoutStats.completedSets}/${workoutStats.totalSets} séries hoje (${Math.round(workoutStats.percent)}%)`;
  }

  // Water bottles rendering (litre by litre!)
  document.getElementById('water-target-input').value = state.waterTarget;
  const bottlesContainer = document.getElementById('water-bottles-container');
  bottlesContainer.innerHTML = '';
  
  const currentLitres = state.waterDrank || state.waterIntake || 0;
  const targetLitres = state.waterTarget;
  
  // Render target bottles
  for (let i = 1; i <= targetLitres; i++) {
    const b = document.createElement('div');
    b.className = `water-bottle-icon ${i <= currentLitres ? 'active' : ''}`;
    b.title = `${i} Litro`;
    b.addEventListener('click', () => {
      playSound('water');
      state.waterDrank = i;
      state.waterIntake = i;
      checkQuestRequirements();
      saveState();
      updateUI();
    });
    bottlesContainer.appendChild(b);
  }
  
  // Litres summary text
  document.getElementById('water-text').innerText = `${currentLitres} / ${state.waterTarget} L`;
  
  // Update water cylinder fill level
  const cylinderFill = document.getElementById('water-cylinder-fill');
  if (cylinderFill) {
    const waterPct = Math.min(100, Math.round((currentLitres / targetLitres) * 100));
    cylinderFill.style.height = `${waterPct}%`;
  }
  
  // Exceeding water litres calculation
  const extraWaterText = document.getElementById('water-extra-text');
  if (currentLitres > state.waterTarget) {
    const extraL = currentLitres - state.waterTarget;
    const extraXp = extraL * 10;
    extraWaterText.classList.remove('hidden');
    extraWaterText.innerText = `🔥 +${extraL} Litros Extras! (+${extraXp} XP creditados)`;
  } else {
    extraWaterText.classList.add('hidden');
  }

  // Linear Macro metrics on Dashboard dock
  // Eaten today sums
  let totalKcal = 0, totalProt = 0, totalFiber = 0, totalCarbs = 0;
  state.mealLogs.forEach(m => {
    totalKcal += (m.kcal || 0);
    totalProt += (m.prot || 0);
    totalFiber += (m.fiber || 0);
    totalCarbs += (m.carbs || 0);
  });
  
  // Float rounded
  totalKcal = Math.round(totalKcal);
  totalProt = Math.round(totalProt * 10) / 10;
  totalFiber = Math.round(totalFiber * 10) / 10;
  totalCarbs = Math.round(totalCarbs * 10) / 10;

  // Sync state values
  if (!state.dailyMacros) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
  state.dailyMacros.kcal = totalKcal;
  state.dailyMacros.prot = totalProt;
  state.dailyMacros.fiber = totalFiber;
  state.dailyMacros.carbs = totalCarbs;

  state.kcalIntake = totalKcal;
  state.proteinIntake = totalProt;
  state.fiberIntake = totalFiber;

  // Render player active status badges based on macros
  const statusBadgesContainer = document.getElementById('player-status-badges');
  if (statusBadgesContainer) {
    statusBadgesContainer.innerHTML = '';
    
    // 🔥 Estado Anabólico Active check
    if (totalProt >= state.protTarget) {
      state.anabolicActive = true;
      const b = document.createElement('span');
      b.className = 'badge';
      b.style.background = 'linear-gradient(90deg, #ff5e00, #ffb703)';
      b.style.color = '#000';
      b.style.border = 'none';
      b.style.fontSize = '0.62rem';
      b.style.fontWeight = '800';
      b.style.padding = '2px 6px';
      b.style.borderRadius = '4px';
      b.innerText = '🔥 Estado Anabólico Active (+10% Treino XP)';
      statusBadgesContainer.appendChild(b);
    } else {
      state.anabolicActive = false;
    }

    // 💀 Catabolizando check
    const kcalPct = state.kcalTarget > 0 ? (totalKcal / state.kcalTarget) : 0;
    // Neglected kcal or carbs (< 30% of target) while fiber is 0
    if ((kcalPct < 0.3 || totalCarbs < 20) && totalFiber === 0) {
      state.catabolizandoActive = true;
      const b = document.createElement('span');
      b.className = 'badge';
      b.style.background = '#e63946';
      b.style.color = '#fff';
      b.style.border = 'none';
      b.style.fontSize = '0.62rem';
      b.style.fontWeight = '800';
      b.style.padding = '2px 6px';
      b.style.borderRadius = '4px';
      b.innerText = '💀 Catabolizando';
      statusBadgesContainer.appendChild(b);
    } else {
      state.catabolizandoActive = false;
    }
  }

  document.getElementById('text-kcal').innerText = `${totalKcal}/${state.kcalTarget}`;
  document.getElementById('text-prot').innerText = `${totalProt}g/${state.protTarget}g`;
  document.getElementById('text-fiber').innerText = `${totalFiber}g/${state.fiberTarget}g`;
  
  const kcalBarPct = Math.min(100, (totalKcal / state.kcalTarget) * 100);
  const protBarPct = Math.min(100, (totalProt / state.protTarget) * 100);
  const fiberBarPct = Math.min(100, (totalFiber / state.fiberTarget) * 100);

  document.getElementById('bar-kcal').style.width = `${kcalBarPct}%`;
  document.getElementById('bar-prot').style.width = `${protBarPct}%`;
  document.getElementById('bar-fiber').style.width = `${fiberBarPct}%`;

  const dockPct = Math.min(100, Math.round((totalProt / state.protTarget) * 100));
  document.getElementById('protein-dock-percent').innerText = `Proteínas: ${dockPct}% da meta`;

  // Render daily quests
  renderDailyQuests();

  // ==========================================
  // TAB: TREINOS (WORKOUTS)
  // ==========================================
  // Standard vs Custom toggle styles
  const btnStd = document.getElementById('toggle-workout-std');
  const btnCust = document.getElementById('toggle-workout-cust');
  const btnAddEx = document.getElementById('btn-open-add-exercise-modal');

  if (state.useCustomWorkout) {
    btnStd.classList.remove('active');
    btnCust.classList.add('active');
    btnAddEx.classList.remove('hidden');
  } else {
    btnStd.classList.add('active');
    btnCust.classList.remove('active');
    btnAddEx.classList.add('hidden');
  }
  renderWorkoutRoutine();

  // ==========================================
  // TAB: DIETA (ALIMENTAÇÃO)
  // ==========================================
  document.getElementById('diet-kcal-summary').innerText = `${totalKcal} / ${state.kcalTarget} kcal`;
  document.getElementById('diet-prot-summary').innerText = `${totalProt} / ${state.protTarget} g`;
  document.getElementById('diet-fiber-summary').innerText = `${totalFiber} / ${state.fiberTarget} g`;
  
  const kcalPercent = Math.min(100, Math.floor((totalKcal / state.kcalTarget) * 100));
  document.getElementById('diet-kcal-percent').innerText = `${kcalPercent}%`;
  
  // Circumference 251.32 for r=40
  const circ = 251.32;
  const ringOffset = circ - (kcalPercent / 100) * circ;
  document.getElementById('diet-kcal-ring-fill').style.strokeDashoffset = ringOffset;

  const goalText = {
    emagrecer: "Secar (Cutting)",
    engordar: "Crescer (Bulking)",
    manter: "Lapidar (Recomp)",
    estetico: "Ficar Estético",
    saude: "Melhorar Saúde"
  };
  document.getElementById('diet-calorie-status').innerText = goalText[state.charGoal] || state.charGoal || '—';

  // Refresh dynamic food selectors
  populateFoodSelector();

  // Update diet buffs card
  const buffsCard = document.getElementById('diet-active-buffs-card');
  const buffsList = document.getElementById('diet-active-buffs-list');
  if (buffsCard && buffsList) {
    buffsList.innerHTML = '';
    let hasBuffs = false;

    if (state.anabolicActive) {
      hasBuffs = true;
      const card = document.createElement('div');
      card.className = 'active-buff-card anabolic';
      card.innerHTML = `
        <span class="buff-icon">🔥</span>
        <div class="buff-details">
          <h5>Estado Anabólico Ativo</h5>
          <p>Meta de proteínas batida! Receba <strong>+10% XP</strong> em todos os treinos finalizados hoje.</p>
        </div>
      `;
      buffsList.appendChild(card);
    }

    if (state.catabolizandoActive) {
      hasBuffs = true;
      const card = document.createElement('div');
      card.className = 'active-buff-card catabolizing';
      card.innerHTML = `
        <span class="buff-icon">💀</span>
        <div class="buff-details">
          <h5>Catabolismo Ativo</h5>
          <p>Ingestão extremamente baixa de calorias ou carboidratos. Seu shape está sob risco! Abasteça o organismo.</p>
        </div>
      `;
      buffsList.appendChild(card);
    }

    if (hasBuffs) {
      buffsCard.classList.remove('hidden');
    } else {
      buffsCard.classList.add('hidden');
    }
  }

  // Render Food meal logs history
  renderMealLogs();

  // ==========================================
  // TAB: MENTORES
  // ==========================================
  renderMentorsList();

  // ==========================================
  // TAB: STATUS & ATRIBUTOS
  // ==========================================
  document.getElementById('stats-total-workouts').innerText = state.workoutsCompleted;
  document.getElementById('stats-level-num').innerText = state.level;
  document.getElementById('status-subclass').innerText = currentRank;
  document.getElementById('status-class').innerText = classLabels[state.charClass];

  let rankChar = 'E';
  if (state.level >= 75) rankChar = 'SSS';
  else if (state.level >= 60) rankChar = 'SS';
  else if (state.level >= 45) rankChar = 'S';
  else if (state.level >= 35) rankChar = 'A';
  else if (state.level >= 25) rankChar = 'B';
  else if (state.level >= 15) rankChar = 'C';
  else if (state.level >= 8) rankChar = 'D';
  document.getElementById('stats-rank-tier').innerText = rankChar;

  // Rank Tier Progress calculation
  let nextLvlReq = 8;
  let currentTierMin = 1;
  if (state.level >= 75) {
    currentTierMin = 75;
    nextLvlReq = 100;
  } else if (state.level >= 60) {
    currentTierMin = 60;
    nextLvlReq = 75;
  } else if (state.level >= 45) {
    currentTierMin = 45;
    nextLvlReq = 60;
  } else if (state.level >= 35) {
    currentTierMin = 35;
    nextLvlReq = 45;
  } else if (state.level >= 25) {
    currentTierMin = 25;
    nextLvlReq = 35;
  } else if (state.level >= 15) {
    currentTierMin = 15;
    nextLvlReq = 25;
  } else if (state.level >= 8) {
    currentTierMin = 8;
    nextLvlReq = 15;
  } else {
    currentTierMin = 1;
    nextLvlReq = 8;
  }
  
  let progressPct = 0;
  if (state.level >= 75) {
    progressPct = 100;
  } else {
    progressPct = Math.round(((state.level - currentTierMin) / (nextLvlReq - currentTierMin)) * 100);
  }
  
  const progressEl = document.getElementById('rank-tier-progress-fill');
  const valEl = document.getElementById('rank-tier-progress-val');
  const labelEl = document.getElementById('rank-tier-progress-label');
  
  if (progressEl && valEl && labelEl) {
    progressEl.style.width = `${progressPct}%`;
    valEl.innerText = `${progressPct}%`;
    if (state.level >= 75) {
      labelEl.innerText = `Rank Máximo Atingido (SSS)`;
    } else {
      const nextTierChar = state.level >= 60 ? 'SSS' :
                           state.level >= 45 ? 'SS' :
                           state.level >= 35 ? 'S' :
                           state.level >= 25 ? 'A' :
                           state.level >= 15 ? 'B' :
                           state.level >= 8 ? 'C' : 'D';
      labelEl.innerText = `Evolução para o Rank ${nextTierChar} (Nv. ${state.level}/${nextLvlReq})`;
    }
  }

  // Subclass Lore Updates
  const loreTitleEl = document.getElementById('lore-subclass-title');
  const loreDescEl = document.getElementById('lore-subclass-desc');
  if (loreTitleEl && loreDescEl) {
    loreTitleEl.innerText = currentRank;
    loreDescEl.innerText = getSubclassLore(state.charClass, currentRank);
  }

  // Attribute values
  document.getElementById('val-for').innerText = state.attributes.for;
  document.getElementById('val-res').innerText = state.attributes.res;
  document.getElementById('val-agi').innerText = state.attributes.agi;
  document.getElementById('val-vig').innerText = state.attributes.vig;
  document.getElementById('val-foc').innerText = state.attributes.foc;

  // Attribute Points Indicator
  const attrBox = document.getElementById('attr-points-box');
  const attrValText = document.getElementById('attr-points-value');
  const addBtnList = document.querySelectorAll('.btn-attr-add');

  if (state.attrPoints > 0) {
    attrBox.classList.remove('hidden');
    attrValText.innerText = state.attrPoints;
    addBtnList.forEach(btn => btn.classList.remove('hidden'));
  } else {
    attrBox.classList.add('hidden');
    addBtnList.forEach(btn => btn.classList.add('hidden'));
  }

  // Render trophies slots
  renderTrophies();

  // Apply unlocked item visual classes to body so CSS selectors work globally
  const itemClassMap = {
    'item_faixa':     'has-item-faixa',
    'item_bracelete': 'has-item-bracelete',
    'item_aura':      'has-item-aura',
    'item_cinturão':  'has-item-cinturo',
    'item_aurabroly': 'has-item-aurabroly',
    'item_capa':      'has-item-capa',
    // Mentor unlocked cosmetics
    'has-men-beb10':  'has-men-beb10',
    'has-men-beb20':  'has-men-beb20',
    'has-men-beb25':  'has-men-beb25',
    'has-men-lee20':  'has-men-lee20',
    'has-men-lee25':  'has-men-lee25',
    'has-men-gok20':  'has-men-gok20',
    'has-men-arn5':   'has-men-arn5',
    'has-men-arn25':  'has-men-arn25',
    'has-men-ram5':   'has-men-ram5',
    'has-men-ram20':  'has-men-ram20',
    'has-men-bro20':  'has-men-bro20',
    'has-men-sai20':  'has-men-sai20',
    'has-men-sai25':  'has-men-sai25',
    'has-men-nic5':   'has-men-nic5',
    'has-men-nic20':  'has-men-nic20',
    'has-men-nic25':  'has-men-nic25'
  };
  // Strip all previous item classes from body
  Object.values(itemClassMap).forEach(cls => document.body.classList.remove(cls));
  // Re-apply currently owned ones
  if (state.unlockedItems && state.unlockedItems.length > 0) {
    state.unlockedItems.forEach(id => {
      const cls = itemClassMap[id];
      if (cls) document.body.classList.add(cls);
    });
  }

  // Render Daily Challenge & Evolution SVG Chart
  renderDailyChallenge();
  renderEvolutionChart();
}

// 12. CHECK META COMPLETIONS (DAILY INTEGRATION)
function checkQuestRequirements() {
  let changed = false;
  const focBonus = 1 + (state.attributes.foc * 0.01);
  state.dailyQuests.forEach(q => {
    if (!q.completed) {
      if (q.id === 'quest_water' && state.waterIntake >= state.waterTarget) {
        q.completed = true;
        addXP(Math.round(q.xpReward * focBonus));
        addMentorXP(state.activeMentor, 15); // Water Goal met (+15 XP)
        playSound('quest');
        changed = true;
        unlockTrophy('monstro_agua');
      }
      if (q.id === 'quest_protein' && state.proteinIntake >= (state.protTarget * 0.8)) {
        q.completed = true;
        addXP(Math.round(q.xpReward * focBonus));
        playSound('quest');
        changed = true;
        if (state.proteinIntake >= state.protTarget) {
          addMentorXP(state.activeMentor, 20); // Protein Goal met (+20 XP)
          unlockTrophy('monstro_prot');
        }
      }
    }
  });
  if (changed) {
    saveState();
  }
}

// 13. RENDER QUESTS ON SCREEN
function renderDailyQuests() {
  const container = document.getElementById('daily-quests-list');
  container.innerHTML = '';
  
  let completedCount = 0;
  state.dailyQuests.forEach(q => {
    if (q.completed) completedCount++;

    const card = document.createElement('div');
    card.className = `quest-item-card glass-panel ${q.completed ? 'completed' : ''}`;
    
    const checkDiv = document.createElement('div');
    checkDiv.className = 'quest-check';
    checkDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    
    if (!q.completed) {
      checkDiv.addEventListener('click', () => {
        playSound('quest');
        q.completed = true;
        const focBonus = 1 + (state.attributes.foc * 0.01);
        addXP(Math.round(q.xpReward * focBonus));
        saveState();
        updateUI();
      });
    }

    const info = document.createElement('div');
    info.className = 'quest-info-text';
    info.innerHTML = `
      <h4>${q.name}</h4>
      <p style="font-size: 0.65rem; color: var(--text-secondary);">${q.desc}</p>
    `;

    const rewards = document.createElement('div');
    rewards.className = 'quest-rewards';
    const focBonus = 1 + (state.attributes.foc * 0.01);
    rewards.innerHTML = `<span class="reward-badge xp-reward">+${Math.round(q.xpReward * focBonus)} XP</span>`;

    const questDetail = document.createElement('div');
    questDetail.className = 'quest-detail';
    questDetail.appendChild(checkDiv);
    questDetail.appendChild(info);

    card.appendChild(questDetail);
    card.appendChild(rewards);
    container.appendChild(card);
  });

  document.getElementById('quests-completed-badge').innerText = `${completedCount}/${state.dailyQuests.length}`;
}

// ==========================================
// 14. EXERCISE PROGRESSION AND OVERLOAD ALERTS
// ==========================================
function showOverloadToast(exerciseName, oldWeight, newWeight) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  const diff = newWeight - oldWeight;
  message.innerText = `${exerciseName}: +${diff.toFixed(1)}kg batido! (+15 XP)`;
  
  toast.classList.remove('hidden');
  playSound('quest');
  
  // Slide up/fade out after 3.8s
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3800);
}

// Persist a new PR for an exercise to both state.personalRecords and freaky_quest_user.workoutHistory
function persistPR(exName, newWeight) {
  state.personalRecords[exName] = newWeight;
  if (!userProfile.workoutHistory) userProfile.workoutHistory = {};
  userProfile.workoutHistory[exName] = newWeight;

  // Patch freaky_quest_user in localStorage without overwriting other keys
  try {
    const raw = localStorage.getItem('freaky_quest_user');
    const userObj = raw ? JSON.parse(raw) : {};
    if (!userObj.workoutHistory) userObj.workoutHistory = {};
    userObj.workoutHistory[exName] = newWeight;
    localStorage.setItem('freaky_quest_user', JSON.stringify(userObj));
  } catch (_e) {}
}

// Check and handle a potential PR for an exercise given an input weight.
// Returns true if a new record was set.
// prBadgeEl: optional DOM element to animate the PR badge inside the exercise card.
function triggerPRSparkles(badgeEl) {
  if (!badgeEl) return;
  const rect = badgeEl.getBoundingClientRect();
  const parent = document.body;
  const colors = ['#ffb703', '#ff5e00', '#ffe494', '#ffffff'];
  
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.className = 'pr-sparkle';
    s.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    s.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    
    parent.appendChild(s);
    
    setTimeout(() => {
      s.remove();
    }, 850);
  }
}

function tryBreakPR(exName, inputWeight, prBadgeEl) {
  if (!inputWeight || inputWeight <= 0) return false;

  const prevBest = state.personalRecords[exName];
  const isNew = prevBest === undefined;
  const isBetter = !isNew && inputWeight > prevBest;

  if (!isNew && !isBetter) return false;

  // Award XP: +15 base, scaled by FOR attribute
  const forBonus = 15 + Math.round((state.attributes.for || 10) * 0.5);
  addXP(forBonus);
  unlockTrophy('overload_champion');

  if (isBetter) {
    // Show overload toast for weight increase
    showOverloadToast(exName, prevBest, inputWeight);
  }

  // Persist the new record
  persistPR(exName, inputWeight);

  // Animate the PR badge on the exercise card
  if (prBadgeEl) {
    prBadgeEl.innerText = isNew ? '⚡ PRIMEIRO REGISTRO!' : 'RECORD QUEBRADO! ⚔️';
    prBadgeEl.style.display = 'flex';
    prBadgeEl.classList.remove('pr-badge-animate');
    // Force reflow to re-trigger animation
    void prBadgeEl.offsetWidth;
    prBadgeEl.classList.add('pr-badge-animate');

    triggerPRSparkles(prBadgeEl);
  }

  return true;
}

// Helper to check for joint pain / injury warnings based on user profile selections.
// Reads state.injury which is always kept as an array (synced from userProfile.jointPain).
function checkExerciseInjuryWarning(exName, exMuscle) {
  // Normalise state.injury to a clean array regardless of legacy string format
  let injuries;
  if (!state.injury) {
    injuries = [];
  } else if (Array.isArray(state.injury)) {
    injuries = state.injury;
  } else {
    injuries = [state.injury];
  }

  // Filter out falsy entries and 'Nenhum' — no warnings when healthy
  injuries = injuries.filter(i => i && i.toUpperCase() !== 'NENHUM');
  if (injuries.length === 0) return null;

  const nameUpper = exName.toUpperCase();
  const muscleUpper = exMuscle.toUpperCase();

  for (const injItem of injuries) {
    const inj = injItem.toUpperCase();

    if (inj === 'JOELHO') {
      if (
        muscleUpper === 'PERNAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('LEG PRESS') ||
        nameUpper.includes('LUNGE') ||
        nameUpper.includes('AFUNDO') ||
        nameUpper.includes('PASSADA') ||
        nameUpper.includes('FLEXORA') ||
        nameUpper.includes('EXTENSORA') ||
        nameUpper.includes('PISTOL')
      ) {
        return '⚠️ Atenção: Carga nos joelhos. Reduza o peso ou evite dores.';
      }
    } else if (inj === 'QUADRIL') {
      if (
        muscleUpper === 'PERNAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('TERRA') ||
        nameUpper.includes('DEADLIFT') ||
        nameUpper.includes('LEG PRESS') ||
        nameUpper.includes('LUNGE') ||
        nameUpper.includes('PISTOL') ||
        nameUpper.includes('GOOD MORNING')
      ) {
        return '⚠️ Atenção: Flexão profunda do quadril. Vá com cautela.';
      }
    } else if (inj === 'COSTAS' || inj === 'COLUNA') {
      if (
        muscleUpper === 'COSTAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('TERRA') ||
        nameUpper.includes('DEADLIFT') ||
        nameUpper.includes('REMADA') ||
        nameUpper.includes('GOOD MORNING') ||
        nameUpper.includes('DESENVOLVIMENTO') ||
        nameUpper.includes('OHP') ||
        nameUpper.includes('MILITAR')
      ) {
        return '⚠️ Atenção: Carga axial na coluna. Cuidado com a lombar!';
      }
    } else if (inj === 'PULSO') {
      if (
        muscleUpper === 'BRAÇOS' ||
        muscleUpper === 'OMBROS' ||
        muscleUpper === 'PEITO' ||
        nameUpper.includes('ROSCA') ||
        nameUpper.includes('SUPINO') ||
        nameUpper.includes('TESTA') ||
        nameUpper.includes('TRÍCEPS') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('HANDSTAND')
      ) {
        return '⚠️ Atenção: Esforço nos punhos. Mantenha estabilizado.';
      }
    } else if (inj === 'OMBRO') {
      if (
        muscleUpper === 'OMBROS' ||
        muscleUpper === 'PEITO' ||
        nameUpper.includes('SUPINO') ||
        nameUpper.includes('DESENVOLVIMENTO') ||
        nameUpper.includes('OHP') ||
        nameUpper.includes('ELEVAÇÃO') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('PIKE') ||
        nameUpper.includes('HANDSTAND')
      ) {
        return '⚠️ Atenção: Articulação do ombro sob carga. Estabilize bem.';
      }
    } else if (inj === 'COTOVELO') {
      if (
        muscleUpper === 'BRAÇOS' ||
        nameUpper.includes('ROSCA') ||
        nameUpper.includes('TESTA') ||
        nameUpper.includes('TRÍCEPS') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('PUXADA') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('PUSHUP')
      ) {
        return '⚠️ Atenção: Esforço nos cotovelos. Evite travar totalmente.';
      }
    }
  }

  return null;
}

// 15. RENDER CURRENT WORKOUT
function renderWorkoutRoutine() {
  purgeOldSetTrackerKeys();
  const template = getResolvedWorkoutTemplate();

  if (state.useCustomWorkout) {
    const titleEl = document.getElementById('workout-title');
    titleEl.innerHTML = `<input type="text" class="workout-title-editable" id="custom-title-input" value="${template.title}" placeholder="Digite o título do treino (ex: Segunda: Peito de Titã 🦅)">`;
    const inputEl = titleEl.querySelector('#custom-title-input');
    inputEl.addEventListener('input', (e) => {
      const val = e.target.value;
      state.customWorkouts[state.activeWorkoutDiv].title = val;
      saveState();
    });

    document.getElementById('workout-category-badge').innerText = 'Estilo Próprio 😈';
    document.getElementById('workout-description').innerText = `Total: ${template.exercises.length} exercícios criados por você.`;
  } else {
    document.getElementById('workout-title').innerText = `${template.title}`;
    document.getElementById('workout-category-badge').innerText = `Estilo ${MENTORS_LIST_FULL().find(m => m.id === state.activeMentor)?.name || 'Rock Lee'}`;
    document.getElementById('workout-description').innerText = template.desc;
  }

  const container = document.getElementById('exercises-list');
  container.innerHTML = '';

  if (template.exercises.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
        Sua ficha está vazia! Clique em <strong>"Adicionar Exercício"</strong> acima para montar seu treino customizado.
      </div>
    `;
    return;
  }

  template.exercises.forEach((ex, exIdx) => {
    const card = document.createElement('div');
    card.className = 'exercise-card glass-panel exercise-dynamic-card';

    // ── PR Meta row: shows current record, rival badge, and live PR badge ──
    const prevRecord = state.personalRecords[ex.name];
    
    // Check for Rivalry pinned targets
    let rivalHtml = '';
    const rival = userProfile.rivals && userProfile.rivals[ex.name];
    if (rival) {
      rivalHtml = `<span class="rival-ghost-badge">🎯 Rival: ${rival.name} (${rival.weight} kg)</span>`;
      if (prevRecord === undefined || prevRecord < rival.weight) {
        card.classList.add('rival-ahead');
      }
    }

    const prMetaRow = document.createElement('div');
    prMetaRow.className = 'exercise-pr-meta-row';
    prMetaRow.innerHTML = `
      <div class="exercise-title-area">
        <div style="display:flex; align-items:center; gap:8px;">
          <h4>${ex.name}</h4>
          ${rivalHtml}
        </div>
        <span class="exercise-muscle-tag">Grupo: ${ex.muscle}</span>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
        <span class="badge" style="background: var(--color-primary-glow); font-size: 0.65rem;">Meta: ${ex.sets}x ${ex.targetReps} reps</span>
        ${prevRecord !== undefined
          ? `<span class="exercise-record-label">🏆 Record: ${prevRecord} kg</span>`
          : `<span class="exercise-record-label" style="color:var(--text-muted);">Sem record</span>`
        }
      </div>
    `;
    card.appendChild(prMetaRow);

    // ── PR Badge (hidden until broken) ──
    const prBadge = document.createElement('div');
    prBadge.className = 'exercise-pr-badge';
    prBadge.style.display = 'none';
    prBadge.innerText = 'RECORD QUEBRADO! ⚔️';
    card.appendChild(prBadge);

    // Warn about joint injury if applicable
    const warningText = checkExerciseInjuryWarning(ex.name, ex.muscle);
    if (warningText) {
      const warnBadge = document.createElement('div');
      warnBadge.className = 'exercise-warning-badge';
      warnBadge.innerText = warningText;
      card.appendChild(warnBadge);
    }

    // If Custom mode, show a small Delete button
    if (state.useCustomWorkout) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-exercise';
      delBtn.innerHTML = '✕';
      delBtn.title = 'Remover Exercício';
      delBtn.addEventListener('click', () => {
        if (confirm(`Remover "${ex.name}" da sua ficha personalizada?`)) {
          playSound('click');
          state.customWorkouts[state.activeWorkoutDiv].exercises.splice(exIdx, 1);
          saveState();
          updateUI();
        }
      });
      card.appendChild(delBtn);
    }

    // ── Overall Exercise Weight Input ──
    const maxLoadRow = document.createElement('div');
    maxLoadRow.className = 'exercise-max-load-row';
    maxLoadRow.innerHTML = `
      <label>Carga Máxima de Hoje:</label>
      <input type="number" class="set-input max-weight-input" value="${(ex.weight !== undefined) ? ex.weight : (state.personalRecords[ex.name] || ex.weight || 0)}" placeholder="kg">
      <span class="unit-label">kg</span>
    `;
    card.appendChild(maxLoadRow);

    const weightInput = maxLoadRow.querySelector('.max-weight-input');
    weightInput.addEventListener('input', () => {
      const w = parseFloat(weightInput.value) || 0;
      ex.weight = w;
      // Live PR preview
      const curRecord = state.personalRecords[ex.name];
      if (w > 0 && (curRecord === undefined || w > curRecord)) {
        prBadge.innerText = curRecord === undefined ? '⚡ PRIMEIRO REGISTRO!' : 'RECORD QUEBRADO! ⚔️';
        prBadge.style.display = 'flex';
        prBadge.style.opacity = '0.55';
      } else {
        prBadge.style.display = 'none';
      }
      saveState();
    });

    weightInput.addEventListener('change', () => {
      const w = parseFloat(weightInput.value) || 0;
      if (w > 0) {
        tryBreakPR(ex.name, w, prBadge);
      }
    });

    // ── Dynamic Series Input ──
    const setsCountRow = document.createElement('div');
    setsCountRow.className = 'exercise-sets-count-row';
    setsCountRow.innerHTML = `
      <label>Quantidade de Séries:</label>
      <input type="number" class="set-input sets-count-input" value="${ex.sets}" min="1" max="10">
    `;
    card.appendChild(setsCountRow);

    const setsInput = setsCountRow.querySelector('.sets-count-input');
    setsInput.addEventListener('change', (e) => {
      const newSets = Math.max(1, Math.min(10, parseInt(e.target.value) || 4));
      ex.sets = newSets;
      saveState();
      renderWorkoutRoutine();
    });

    // ── Horizontal Set Reps Input Row ──
    const repsRow = document.createElement('div');
    repsRow.className = 'exercise-reps-inline-row';

    for (let s = 1; s <= ex.sets; s++) {
      const setKey = buildSetKey(exIdx, s);
      const setEntry = normalizeSetEntry(state.activeSetsTracker[setKey]);
      const isDone = !!(setEntry && setEntry.completed);

      const setCol = document.createElement('div');
      setCol.className = `rep-col ${isDone ? 'completed' : ''}`;
      setCol.style.display = 'flex';
      setCol.style.flexDirection = 'column';
      setCol.style.alignItems = 'center';
      setCol.style.gap = '3px';

      const label = document.createElement('span');
      label.className = 'rep-label';
      label.innerText = `S${s}`;
      label.style.cursor = 'pointer';
      label.style.fontSize = '0.65rem';
      label.style.fontWeight = 'bold';
      label.style.color = isDone ? 'var(--color-primary)' : 'var(--text-muted)';

      const repInput = document.createElement('input');
      repInput.type = 'text';
      repInput.className = 'rep-input';
      repInput.value = setEntry && setEntry.reps ? setEntry.reps : (ex.targetReps.includes('-') ? ex.targetReps.split('-')[0] : parseInt(ex.targetReps) || 10);

      const toggleFunc = (forceState) => {
        const nextState = (forceState !== undefined) ? forceState : !isDone;
        const inputWeight = parseFloat(weightInput.value) || ex.weight || 0;
        const inputReps = parseInt(repInput.value, 10) || parseTargetReps(ex.targetReps);

        if (nextState) {
          state.activeSetsTracker[setKey] = { completed: true, weight: inputWeight, reps: inputReps };
          const baseRest = 90;
          const restTime = Math.max(45, baseRest - state.attributes.agi);
          startRestTimer(restTime);
          if (inputWeight > 0) {
            tryBreakPR(ex.name, inputWeight, prBadge);
          }
        } else {
          delete state.activeSetsTracker[setKey];
        }
        saveState();

        setCol.classList.toggle('completed', nextState);
        label.style.color = nextState ? 'var(--color-primary)' : 'var(--text-muted)';
        repInput.style.border = nextState ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)';
        playSound('click');
      };

      setCol.addEventListener('click', (e) => {
        if (e.target !== repInput) {
          toggleFunc();
        }
      });
      repInput.addEventListener('change', () => {
        toggleFunc(true);
      });

      setCol.appendChild(label);
      setCol.appendChild(repInput);
      repsRow.appendChild(setCol);
    }

    card.appendChild(repsRow);
    container.appendChild(card);
  });
}

// 16. MENTORS SELECT SYSTEM
function MENTORS_LIST_FULL() {
  // Add category tag to mentors so we can group them
  const officialWithCat = OFFICIAL_MENTORS.map(m => {
    let category = "Outros";
    if (m.id === 'bebezinho' || m.id === 'ramondino' || m.id === 'arnold' || m.id === 'nickwalker') {
      category = "Fisiculturistas";
    } else if (m.id === 'rocklee') {
      category = "Naruto";
    } else if (m.id === 'brolyz' || m.id === 'goku') {
      category = "Dragon Ball";
    } else if (m.id === 'saitama') {
      category = "One Punch Man";
    }
    return { ...m, category };
  });

  const customWithCat = state.customMentors.map(m => {
    return { ...m, category: "Personalizados" };
  });

  return [...officialWithCat, ...customWithCat];
}

function renderMentorsList() {
  const container = document.getElementById('mentors-list-container');
  container.innerHTML = '';

  const fullList = MENTORS_LIST_FULL();

  // Group mentors by category
  const categories = {};
  fullList.forEach(m => {
    if (!categories[m.category]) {
      categories[m.category] = [];
    }
    categories[m.category].push(m);
  });

  // Helper to determine rank title
  function getMentorRankTitle(lvl) {
    if (lvl >= 50) return "Transcendido Supremo 🌌";
    if (lvl >= 25) return "Lendário Invencível 🏆";
    if (lvl >= 15) return "Fiel Discípulo ⚡";
    if (lvl >= 5) return "Iniciado Avançado 🟢";
    return "Aprendiz Iniciante 🍼";
  }

  // Render group by group
  for (const catName in categories) {
    const sectionHeader = document.createElement('h3');
    sectionHeader.className = 'mentor-category-title';
    sectionHeader.style.marginTop = '15px';
    sectionHeader.style.marginBottom = '8px';
    sectionHeader.style.fontSize = '0.95rem';
    sectionHeader.style.color = 'var(--color-primary)';
    sectionHeader.style.borderBottom = '1px solid var(--border-glass-glow)';
    sectionHeader.style.paddingBottom = '4px';
    sectionHeader.innerText = catName;
    container.appendChild(sectionHeader);

    categories[catName].forEach(m => {
      const isActive = state.activeMentor === m.id;
      const mAff = (state.mentorAffinities && state.mentorAffinities[m.id]) || { level: 1, xp: 0, prestige: 0 };
      const mLvl = mAff.level;
      const mXp = mAff.xp;
      const mPrestige = mAff.prestige || 0;
      const mXpNeeded = 100 + (mLvl * 25);
      const xpPercent = Math.min(100, (mXp / mXpNeeded) * 100);
      const rankTitle = getMentorRankTitle(mLvl);

      // Determine frame class
      let frameClass = '';
      if (mLvl >= 45) frameClass = 'frame-gold-legendary';
      else if (mLvl >= 20) frameClass = 'frame-silver-neon';
      else if (mLvl >= 2) frameClass = 'frame-bronze';

      // Prestige star suffix
      const prestigeSuffix = mPrestige > 0 ? ` ⭐ Prestige ${'I'.repeat(mPrestige)}` : '';

      const card = document.createElement('div');
      card.className = `mentor-card glass-panel ${isActive ? 'active-mentor' : ''} ${frameClass}`;

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'mentor-img-wrapper';
      imgWrapper.innerHTML = `<img src="${getMentorAvatarSrc(m)}" alt="${m.name}">`;
      card.appendChild(imgWrapper);

      const details = document.createElement('div');
      details.className = 'mentor-details';
      const hasVoice = '';
      
      // Build milestone tracking bar HTML
      const milestones = [
        { lvl: 2, label: 'B2' },
        { lvl: 5, label: 'D5' },
        { lvl: 10, label: 'T1' },
        { lvl: 15, label: 'P1' },
        { lvl: 20, label: 'S20' },
        { lvl: 35, label: 'P2' },
        { lvl: 45, label: 'G45' }
      ];
      
      let milestonesHtml = `
        <div class="milestone-preview-wrapper" style="margin-top: 8px; margin-bottom: 8px;">
          <span style="font-size: 0.6rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Estrada de Recompensas (Milestones - Clique para ver):</span>
          <div style="display: flex; gap: 4px; align-items: center;">
      `;
      milestones.forEach(ms => {
        const met = mLvl >= ms.lvl;
        const stateClass = met ? 'unlocked' : 'locked';
        milestonesHtml += `
          <div class="milestone-dot ${stateClass}" onclick="previewMentorMilestone('${m.id}', ${ms.lvl})" title="Nível ${ms.lvl}: clique para pré-visualizar a recompensa">
            ${ms.label}
          </div>
        `;
      });
      milestonesHtml += `</div></div>`;

      // Build Level 50 Ascension Quest UI if at level 50
      let ascensionHtml = '';
      if (mLvl >= 50) {
        let prTargetName = '';
        let requiredWeight = 0;
        if (m.id === 'brolyz') {
          prTargetName = "Desenvolvimento Livre";
          requiredWeight = 35;
        } else if (m.id === 'rocklee') {
          prTargetName = "Agachamento Livre";
          requiredWeight = 45;
        } else if (m.id === 'bebezinho') {
          prTargetName = "Supino Reto";
          requiredWeight = 40;
        }

        if (prTargetName) {
          const currentPR = state.personalRecords[prTargetName] || 0;
          const meetsPR = currentPR >= requiredWeight;
          
          ascensionHtml = `
            <div class="ascension-quest-box" style="margin-top: 10px; padding: 10px; border-radius: 8px; text-align: center; border: 2px solid ${meetsPR ? 'var(--color-accent)' : '#e63946'}; background: ${meetsPR ? 'rgba(0, 242, 254, 0.05)' : 'rgba(230, 57, 70, 0.05)'}; box-shadow: 0 0 10px ${meetsPR ? 'var(--color-accent-glow)' : 'rgba(230, 57, 70, 0.2)'};">
              <h5 style="color: ${meetsPR ? 'var(--color-accent)' : '#e63946'}; font-weight: bold; font-size: 0.75rem;">Missão de Ascensão</h5>
              <p style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px;">
                Requer PR em <strong>${prTargetName}</strong>: ${currentPR} / ${requiredWeight} kg
              </p>
          `;
          
          if (meetsPR) {
            ascensionHtml += `
              <button class="btn btn-sm btn-accent btn-block transcender-btn ripple" onclick="transcendMentor('${m.id}')" style="margin-top: 6px; font-weight: 800; border: none; background: linear-gradient(90deg, #ffc107, #ff9f1c); color: #000; box-shadow: 0 0 10px #ffc107;">
                TRANSCENDER 🌌
              </button>
            `;
          } else {
            ascensionHtml += `
              <button class="btn btn-sm btn-outline btn-block" disabled style="margin-top: 6px; border-color: #e63946; color: #e63946; background: rgba(230,57,70,0.1); cursor: not-allowed; font-weight: bold;">
                TRANSCENDER BLOQUEADO 🔒
              </button>
            `;
          }
          ascensionHtml += `</div>`;
        }
      }

      details.innerHTML = `
        <div class="mentor-name-row">
          <h4 style="display: flex; align-items: center; gap: 4px;">${m.name} ${isActive ? '👑' : ''} ${hasVoice}</h4>
          <span class="badge" style="background: hsla(${m.hue || 140}, 80%, 50%, 0.15); color: ${m.colorHex || '#ffc107'}; font-size: 0.65rem; font-weight: 700;">Nível ${mLvl}${prestigeSuffix}</span>
        </div>
        <p class="mentor-rank-title">⭐ Rank: <strong style="color: var(--color-accent);">${rankTitle}</strong></p>
        <p class="mentor-desc" style="font-style: italic; margin-top: 4px;">${m.quote}</p>
        <p class="mentor-buff">💪 Bônus: ${m.buff}</p>
        
        <!-- Mentor XP progression bar -->
        <div class="mentor-xp-wrapper" style="margin-top: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.65rem; opacity: 0.8; margin-bottom: 2px;">
            <span>Progresso: ${mXp}/${mXpNeeded} XP</span>
            <span>${Math.round(xpPercent)}%</span>
          </div>
          <div class="xp-bar-container" style="height: 6px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
            <div style="width: ${xpPercent}%; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); transition: width 0.3s ease;"></div>
          </div>
        </div>
        
        ${milestonesHtml}
        ${ascensionHtml}
      `;

      const actBtn = document.createElement('button');
      if (isActive) {
        actBtn.className = 'btn btn-sm btn-primary mentor-action-btn';
        actBtn.innerText = 'ATIVO';
        actBtn.disabled = true;
      } else {
        actBtn.className = 'btn btn-sm btn-accent mentor-action-btn ripple';
        actBtn.innerText = 'ESCOLHER BASE';
        actBtn.addEventListener('click', () => {
          playSound('levelup');
          state.activeMentor = m.id;
          
          if (m.id === 'saitama') unlockTrophy('saitama_blessing');

          saveState();
          updateUI();
          triggerNeuralFlash(m);
        });
      }
      details.appendChild(actBtn);

      card.appendChild(details);
      container.appendChild(card);
    });
  }
}

window.previewMentorMilestone = function(mentorId, lvl) {
  playSound('click');
  const fullList = MENTORS_LIST_FULL();
  const mentor = fullList.find(m => m.id === mentorId);
  const mentorName = mentor ? mentor.name : mentorId;
  
  let reward = MENTOR_REWARDS[mentorId]?.find(r => r.lvl === lvl);
  if (!reward) {
    if (lvl === 2) {
      reward = {
        name: 'Iniciação do Mentor 🌟',
        desc: `Moldura de Bronze e bônus iniciais ativos com o mentor ${mentorName}!`,
        icon: '🌟'
      };
    } else if (lvl === 35) {
      reward = {
        name: 'Prestígio Avançado 🎖️',
        desc: `Desbloqueia novos patamares de conexões e ampliação do poder passivo com ${mentorName}!`,
        icon: '🎖️'
      };
    } else if (lvl === 45) {
      reward = {
        name: 'Ascensão Próxima 🌌',
        desc: `Moldura Ouro Lendária animada e preparação para o ritual de Transcendência com ${mentorName}!`,
        icon: '🌌'
      };
    } else {
      reward = {
        name: 'Milestone Desconhecido 🎁',
        desc: `Alcançar o nível ${lvl} com ${mentorName} para obter bônus exclusivos.`,
        icon: '🎁'
      };
    }
  }
  
  showItemAcquiredModal(reward.icon, reward.name, reward.desc);
};

window.playTributeQuote = function(quoteId) {
  if (quoteId === 'wakewake') {
    try {
      const audio = new Audio('wake wake.mp3');
      audio.volume = 0.6;
      audio.play().catch(err => {
        console.warn("Audio autoplay blocked or failed:", err);
        playSound('levelup');
      });
    } catch(e) {
      console.warn("Failed playing wake wake.mp3:", e);
      playSound('levelup');
    }
  } else {
    playSound(quoteId);
  }
};

window.showTributeMilestoneHelp = function(milestoneId) {
  playSound('click');
  const milestones = {
    inicio: {
      icon: '🌟',
      name: 'O INÍCIO DE TUDO (2003)',
      desc: 'Nascido em 2003, Gabriel Ganley "Bebezinho" ingressou jovem no fisiculturismo e no levantamento de peso. Seu carisma sem tamanho cativou milhares de seguidores rapidamente nas redes sociais.'
    },
    pokemon: {
      icon: '🎮',
      name: 'CAMPEÃO DE POKÉMON TCG',
      desc: 'Bebezinho era um competidor nato. Além do levantamento de peso, ele dominou o Pokémon Card Game (TCG) competitivo, sendo campeão de diversos torneios de elite no Brasil e representando orgulhosamente a nação no campeonato mundial.'
    },
    legpress: {
      icon: '🏋️‍♂️',
      name: 'LEG PRESS DE 500KG',
      desc: 'O marco que quebrou a internet: Bebezinho chocou a comunidade fitness mundial ao carregar o aparelho de Leg Press com meia tonelada (500 kg) e executar repetições sólidas com técnica implacável.'
    },
    despedida: {
      icon: '🕊️',
      name: 'DESPEDIDA PRECOCE (2026)',
      desc: 'Em 23 de maio de 2026, Gabriel nos deixou muito cedo. Ele permaneceu constante até o último instante, e sua partida gerou homenagens profundas de todas as maiores lendas do esporte no Brasil.'
    }
  };
  
  const m = milestones[milestoneId] || { icon: '🕊️', name: 'Tributo ao Herói', desc: 'Sua lembrança vive em cada treino.' };
  showItemAcquiredModal(m.icon, m.name, m.desc);
};

window.triggerEternalFlameSpark = function() {
  playSound('potion');
  
  const container = document.querySelector('.eternal-flame-container');
  if (container) {
    container.style.transform = 'scale(1.25)';
    container.style.boxShadow = '0 0 15px rgba(255, 183, 3, 0.7)';
    setTimeout(() => {
      container.style.transform = '';
      container.style.boxShadow = '';
    }, 300);
  }
  
  const appContainer = document.querySelector('.app-container');
  if (!appContainer) return;
  
  const sparks = [];
  for (let i = 0; i < 15; i++) {
    const sp = document.createElement('div');
    sp.className = 'bebezinho-sparkle';
    sp.style.position = 'absolute';
    sp.style.left = `${20 + Math.random() * 60}%`;
    sp.style.top = `${40 + Math.random() * 20}%`;
    sp.style.width = '6px';
    sp.style.height = '6px';
    sp.style.background = Math.random() > 0.5 ? '#ffe066' : '#9b5de5';
    sp.style.borderRadius = '50%';
    sp.style.boxShadow = '0 0 8px currentColor';
    sp.style.pointerEvents = 'none';
    sp.style.zIndex = '1000';
    sp.style.transition = 'all 1.2s cubic-bezier(0.1, 0.8, 0.2, 1)';
    
    appContainer.appendChild(sp);
    sparks.push(sp);
    
    setTimeout(() => {
      const destX = parseFloat(sp.style.left) + (Math.random() - 0.5) * 40;
      const destY = parseFloat(sp.style.top) - (30 + Math.random() * 40);
      sp.style.left = `${destX}%`;
      sp.style.top = `${destY}%`;
      sp.style.opacity = '0';
      sp.style.transform = 'scale(0.2)';
    }, 50);
  }
  
  setTimeout(() => {
    sparks.forEach(s => s.remove());
  }, 1300);
};

// 17. TROPHIES SLOTS RENDER
function renderTrophies() {
  const container = document.getElementById('trophies-list');
  container.innerHTML = '';

  TROPHIES.forEach(t => {
    const isUnlocked = state.unlockedTrophies.includes(t.id);
    
    const slot = document.createElement('div');
    slot.className = `trophy-slot ${isUnlocked ? 'unlocked' : ''}`;
    slot.innerHTML = isUnlocked ? t.icon : '❓';
    
    if (isUnlocked) {
      slot.addEventListener('click', () => {
        playSound('click');
        showItemAcquiredModal(t.icon, t.name, t.desc);
      });
    } else {
      slot.title = `Bloqueado - ${t.desc}`;
    }
    container.appendChild(slot);
  });
}

function unlockTrophy(trophyId) {
  if (!state.unlockedTrophies) {
    state.unlockedTrophies = [];
  }
  if (!state.unlockedTrophies.includes(trophyId)) {
    state.unlockedTrophies.push(trophyId);
    saveState();
    renderTrophies();
    
    const trophy = TROPHIES.find(t => t.id === trophyId);
    if (trophy) {
      playSound('levelup');
      showItemAcquiredModal(trophy.icon, `CONQUISTA DESBLOQUEADA!`, `${trophy.name}: ${trophy.desc}`);
    }
  }
}

function renderEvolutionChart() {
  const svg = document.getElementById('evolution-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const wHist = state.weightHistory || [];
  const sHist = state.strengthHistory || [];

  if (wHist.length === 0) wHist.push(parseFloat(state.charWeight) || 80);
  if (sHist.length === 0) sHist.push(50 + (state.attributes.for || 10) * 1.5);

  const finalW = [...wHist];
  const finalS = [...sHist];

  if (finalW.length === 1) finalW.unshift(finalW[0] - 1);
  if (finalS.length === 1) finalS.unshift(finalS[0] - 5);

  const width = 400;
  const height = 150;
  const padding = 20;

  const minW = Math.min(...finalW) - 1;
  const maxW = Math.max(...finalW) + 1;
  const diffW = (maxW - minW) || 1;

  const minS = Math.min(...finalS) - 5;
  const maxS = Math.max(...finalS) + 5;
  const diffS = (maxS - minS) || 1;

  const pointsCount = finalW.length;

  for (let i = 0; i <= 3; i++) {
    const yVal = padding + ((height - 2 * padding) / 3) * i;
    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', padding.toString());
    gridLine.setAttribute('y1', yVal.toString());
    gridLine.setAttribute('x2', (width - padding).toString());
    gridLine.setAttribute('y2', yVal.toString());
    gridLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
    gridLine.setAttribute('stroke-width', '1');
    svg.appendChild(gridLine);
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  const strengthPoints = [];
  const weightPoints = [];

  for (let idx = 0; idx < pointsCount; idx++) {
    const x = padding + ((width - 2 * padding) / (pointsCount - 1)) * idx;
    const yS = height - padding - ((finalS[idx] - minS) / diffS) * (height - 2 * padding);
    strengthPoints.push({ x, y: yS, val: finalS[idx] });

    const yW = height - padding - ((finalW[idx] - minW) / diffW) * (height - 2 * padding);
    weightPoints.push({ x, y: yW, val: finalW[idx] });
  }

  function drawLine(points, color, glowId, isDashed) {
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2.5');
    if (isDashed) {
      path.setAttribute('stroke-dasharray', '4,4');
    }
    path.setAttribute('filter', `url(#${glowId})`);
    svg.appendChild(path);
  }

  drawLine(strengthPoints, '#ff5e00', 'glow-orange', false);
  drawLine(weightPoints, '#00f2fe', 'glow-cyan', true);

  function drawDots(points, color, typeLabel, unit) {
    points.forEach((p, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x.toString());
      circle.setAttribute('cy', p.y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', color);
      circle.setAttribute('class', 'chart-dot chart-node');
      
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${typeLabel}: ${Math.round(p.val * 10) / 10} ${unit}`;
      circle.appendChild(title);

      circle.addEventListener('click', () => {
        playSound('click');
        const desc = `Métrica de evolução histórica registrada:
        • Categoria: ${typeLabel}
        • Valor alcançado: ${Math.round(p.val * 10) / 10} ${unit}
        • Registro: Armazenado com sucesso na Forja do Destino.`;
        showItemAcquiredModal('📈', 'REGISTRO DE EVOLUÇÃO', desc);
      });

      svg.appendChild(circle);

      if (idx === pointsCount - 1) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (p.x - 45).toString());
        text.setAttribute('y', (p.y - 8).toString());
        text.setAttribute('fill', color);
        text.setAttribute('font-size', '8px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${Math.round(p.val * 10) / 10} ${unit}`;
        svg.appendChild(text);
      }
    });
  }

  drawDots(strengthPoints, '#ff9f1c', 'Força Est.', 'XP');
  drawDots(weightPoints, '#00f2fe', 'Peso', 'kg');
}

// ==========================================
// 18. NUTRITION & FOOD SYSTEMS
// ==========================================
function populateFoodSelector() {
  const select = document.getElementById('diet-select-food');
  select.innerHTML = '';
  
  state.foodsDb.forEach(f => {
    const option = document.createElement('option');
    option.value = f.id;
    // Show short name for official foods, add macros for custom foods
    if (f.isCustom) {
      option.innerText = `${f.name} (${f.prot}g P, ${f.kcal} kcal)`;
    } else {
      option.innerText = f.name;
    }
    select.appendChild(option);
  });
}

function renderMealLogs() {
  const container = document.getElementById('diet-history-list');
  container.innerHTML = '';

  if (state.mealLogs.length === 0) {
    container.innerHTML = `
      <div style="padding:16px; text-align:center; font-size:0.75rem; color:var(--text-secondary);">
        Nenhum alimento registrado hoje. Abasteça o shape!
      </div>
    `;
    return;
  }

  state.mealLogs.forEach((m, idx) => {
    const card = document.createElement('div');
    card.className = 'diet-history-item';
    
    card.innerHTML = `
      <div class="diet-item-info">
        <h5>${m.name}</h5>
        <p>${m.weight}g consumidos</p>
      </div>
      <div class="diet-item-right">
        <div class="diet-item-macros">
          <span class="prot">+${m.prot.toFixed(1)}g P</span>
          <span class="kcal">+${Math.round(m.kcal)} kcal</span>
        </div>
        <button class="diet-item-delete" title="Deletar Refeição">✕</button>
      </div>
    `;
    
    // Wire delete button
    card.querySelector('.diet-item-delete').addEventListener('click', () => {
      playSound('click');
      state.mealLogs.splice(idx, 1);
      saveState();
      updateUI();
    });

    container.appendChild(card);
  });
}

// ==========================================
// 19. MODALS UTILITIES
// ==========================================
function showLevelUpModal() {
  const modal = document.getElementById('level-up-modal');
  document.getElementById('modal-level-val').innerText = state.level;
  document.getElementById('modal-subclass-val').innerText = getSubclassRank(state.charClass, state.level);
  modal.classList.remove('hidden');
}

function showItemAcquiredModal(icon, name, desc) {
  const modal = document.getElementById('item-acquired-modal');
  document.getElementById('modal-item-icon').innerText = icon;
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
      desc: 'Tempo de reação e coordenação neuromuscular. Acelera as animações de descanso e aumenta a velocidade metabólica na queima de calorias.'
    },
    vig: {
      icon: '❤️',
      name: 'VIGOR (VIG)',
      desc: 'Seu fôlego cardíaco e velocidade de recuperação. Cada ponto reduz permanentemente em 0.2 segundos o descanso recomendado nos treinos.'
    },
    foc: {
      icon: '🎯',
      name: 'FOCO (FOC)',
      desc: 'Sua clareza mental e disciplina no ginásio. Cada ponto adiciona um bônus multiplicador de +1% de XP em todas as Quests Diárias finalizadas.'
    }
  };
  
  const item = details[attrKey] || { icon: '❓', name: 'Atributo Desconhecido', desc: 'Atributo não cadastrado.' };
  showItemAcquiredModal(item.icon, item.name, item.desc);
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
// 20. TUTORIAL SYSTEM
// ==========================================
const TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo, Recruta! ⚔️',
    icon: '🎯',
    text: 'Este é o FreakyQuest — o primeiro RPG de academia. Aqui você transforma suor em XP e deixa o frango para trás de vez!'
  },
  {
    title: 'Complete Quests Diárias 📋',
    icon: '✅',
    text: 'Todo dia aparecem Quests: beber água, bater proteínas, completar treino. Cada quest dá XP. FOC (Foco) aumenta o XP recebido de cada quest!'
  },
  {
    title: 'Atributos Mudam Tudo 📊',
    icon: '⬆️',
    text: 'Ao subir de nível você recebe 5 pontos. FOR aumenta XP de treino, RES aumenta XP base, AGI reduz descanso, VIG aumenta XP de hidratação, FOC multiplica XP de quests!'
  },
  {
    title: 'Desbloqueie Auras e Itens 🔥',
    icon: '🏆',
    text: 'Atingindo marcos de nível você desbloqueia cosméticos: Faixa do Lee (Nv5), Aura SSJ (Nv20), Cinturão de Ouro (Nv30), AURA LENDÁRIA DO BROLY (Nv40) e mais!'
  },
  {
    title: 'Mentores Lendários te Esperam 🐉',
    icon: '🌟',
    text: 'Com progressão, mentores como Goku (Nv20), Arnold (Nv30) e Broly Z (Nv40) ficam disponíveis — cada um com buff exclusivo e visual único. Vai ser Freaky!'
  }
];

let tutorialStep = 0;

function startTutorial() {
  tutorialStep = 0;
  renderTutorialStep(tutorialStep);
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function renderTutorialStep(idx) {
  const step = TUTORIAL_STEPS[idx];
  document.getElementById('tutorial-step-title').innerText = step.title;
  document.getElementById('tutorial-step-illustration').innerText = step.icon;
  document.getElementById('tutorial-step-text').innerText = step.text;
  // Dots
  document.querySelectorAll('#tutorial-overlay .dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
  // Button label
  const btnNext = document.getElementById('btn-tutorial-next');
  btnNext.innerText = (idx === TUTORIAL_STEPS.length - 1) ? 'VAMOS TREINAR! 💪' : 'AVANÇAR →';
}

function closeTutorial() {
  state.tutorialCompleted = true;
  saveState();
  document.getElementById('tutorial-overlay').classList.add('hidden');
}

// ==========================================
// 21. EVENTS TRIGGERS AND FORM INITS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  
  const hasSave = loadState();

  // Wire tutorial buttons (always, regardless of save state)
  document.getElementById('btn-tutorial-next').addEventListener('click', () => {
    playSound('click');
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      tutorialStep++;
      renderTutorialStep(tutorialStep);
    } else {
      closeTutorial();
    }
  });
  document.getElementById('btn-tutorial-skip').addEventListener('click', () => {
    playSound('click');
    closeTutorial();
  });

  if (hasSave && state.charName) {
    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    updateUI();
    // Show tutorial if returning user hasn't seen it yet
    if (!state.tutorialCompleted) {
      setTimeout(() => startTutorial(), 900);
    }
  } else {
    // Show intro loader and load logo presentation animation
    const loaderFill = document.getElementById('intro-loader-fill');
    loaderFill.classList.add('animate');
    
    // Cycle rapid tech terminal text prompts directly below it
    const statusTexts = [
      "[ SINAL SINÁPTICO ESTÁVEL... ]",
      "[ CONECTANDO NEURO-RECEPTORES... ]",
      "[ RECRUTA DETECTADO... ]",
      "[ ANALISANDO NÍVEL DE SHAPE... ]",
      "[ LIMPANDO STATUS DE FRANGO... ]",
      "[ INJETANDO ENERGIA MUTANTE... 100% ]"
    ];
    const statusEl = document.getElementById('intro-loader-status');
    if (statusEl) {
      let cycleIdx = 0;
      statusEl.innerText = statusTexts[0];
      const cycleInterval = setInterval(() => {
        cycleIdx++;
        if (cycleIdx < statusTexts.length) {
          statusEl.innerText = statusTexts[cycleIdx];
        } else {
          clearInterval(cycleInterval);
        }
      }, 350);
    }
    
    setTimeout(() => {
      const btnStart = document.getElementById('btn-start-neural');
      if (btnStart) btnStart.classList.remove('hidden');
    }, 2200);
  }

  // INTRO CONNECT NEURAL BUTTON CLICK
  const btnStart = document.getElementById('btn-start-neural');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      // Play heavy activate sound effect (quest sound)
      playSound('quest');
      
      // Trigger full-screen white neon flash / screen glitch distortion layer for 300ms
      const flashOverlay = document.getElementById('glitch-flash-overlay');
      if (flashOverlay) {
        flashOverlay.classList.add('flash-active');
        setTimeout(() => {
          flashOverlay.classList.remove('flash-active');
          document.getElementById('onboarding-intro').classList.add('hidden');
          document.getElementById('onboarding-wizard').classList.remove('hidden');
          updateWizardStep();
        }, 300);
      } else {
        document.getElementById('onboarding-intro').classList.add('hidden');
        document.getElementById('onboarding-wizard').classList.remove('hidden');
        updateWizardStep();
      }
    });
  }

  // WIZARD CONFIG AND STEP DEFINITION
  const steps = ['1', '2', '3', '4', '5', '6', '7', '8', '9a', '9b', '9c', '10', '11'];
  let currentStepIdx = 0;

  // Option selection handlers
  const optionContainers = [
    { step: '2', selector: '[data-step="2"] .option-select-card', field: 'sex' },
    { step: '3', selector: '[data-step="3"] .option-select-card', field: 'mainObjective' },
    { step: '4', selector: '[data-step="4"] .option-select-card', field: 'motivation' },
    { step: '5', selector: '[data-step="5"] .option-select-card', field: 'focusArea' },
    { step: '6', selector: '[data-step="6"] .option-select-card', field: 'class' },
    { step: '7', selector: '[data-step="7"] .option-select-card', field: 'experienceLevel' },
    { step: '8', selector: '[data-step="8"] .option-select-card', field: 'activityLevel' }
  ];

  // Name listener
  document.getElementById('wiz-name').addEventListener('input', (e) => {
    userProfile.name = e.target.value.trim();
  });

  // RPG Class Initial Attributes Map
  const CLASS_BASE_STATS = {
    bodybuilder: { FOR: 12, RES: 10, AGI: 9, VIG: 11, FOC: 10 },
    powerlifter: { FOR: 15, RES: 9, AGI: 7, VIG: 12, FOC: 9 },
    calistenia: { FOR: 10, RES: 11, AGI: 13, VIG: 9, FOC: 9 },
    maratonista: { FOR: 8, RES: 15, AGI: 10, VIG: 11, FOC: 8 }
  };

  // Default starting attributes for bodybuilder (since bodybuilder card is active by default in HTML)
  let wizAttrPool = 8;
  const wizAttrValues = { FOR: 12, RES: 10, AGI: 9, VIG: 11, FOC: 10 };
  userProfile.class = 'bodybuilder';
  userProfile.attributes = { ...wizAttrValues };

  function updateWizAttrDisplay() {
    const poolEl = document.getElementById('wiz-attr-pool-val');
    if (poolEl) poolEl.innerText = wizAttrPool;
    
    Object.keys(wizAttrValues).forEach(attr => {
      const valEl = document.getElementById(`wiz-val-${attr}`);
      if (valEl) valEl.innerText = wizAttrValues[attr];
    });
  }

  function updateClassPreview(className) {
    const previewEl = document.getElementById('class-preview-stats');
    if (!previewEl) return;
    
    const stats = {
      bodybuilder: { title: "Foco: Hipertrofia & Pump", desc: "Equilibrado para ganho de massa muscular com bom volume e pump insano.", attributes: "✊ FOR: 12  ·  🫁 RES: 10  ·  ⚡ AGI: 9  ·  ❤️ VIG: 11  ·  🎯 FOC: 10" },
      powerlifter: { title: "Foco: Força Bruta", desc: "Especialista em erguer cargas extremas nos três levantamentos competitivos (Supino, Agachamento, Terra).", attributes: "✊ FOR: 15  ·  🫁 RES: 9  ·  ⚡ AGI: 7  ·  ❤️ VIG: 12  ·  🎯 FOC: 9" },
      calistenia: { title: "Foco: Controle Corporal", desc: "Domínio total do próprio peso contra a gravidade em barras, paralelas e posições estáticas.", attributes: "✊ FOR: 10  ·  🫁 RES: 11  ·  ⚡ AGI: 13  ·  ❤️ VIG: 9  ·  🎯 FOC: 9" },
      maratonista: { title: "Foco: Endurance & Fôlego", desc: "Resistência cardiovascular infinita para longas distâncias, corrida e treinos de alta duração.", attributes: "✊ FOR: 8  ·  🫁 RES: 15  ·  ⚡ AGI: 10  ·  ❤️ VIG: 11  ·  🎯 FOC: 8" }
    };
    
    const current = stats[className];
    if (!current) return;
    
    previewEl.innerHTML = `
      <strong style="color: var(--color-primary); font-size: 0.82rem; font-family: var(--font-display);">${current.title}</strong>
      <p style="color: var(--text-secondary); margin: 3px 0; line-height: 1.3;">${current.desc}</p>
      <span style="font-weight: 800; color: var(--color-accent); font-family: var(--font-display); margin-top: 2px;">Atributos Iniciais: ${current.attributes}</span>
    `;
  }

  // Initialize class preview content
  updateClassPreview('bodybuilder');

  // Set up option click listeners with auto-advance for fluid UX
  optionContainers.forEach(opt => {
    const cards = document.querySelectorAll(opt.selector);
    cards.forEach(card => {
      card.addEventListener('click', () => {
        // Trigger neon border flash animation
        card.classList.add('neon-card-flash');
        setTimeout(() => card.classList.remove('neon-card-flash'), 400);

        playSound('click');
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const val = card.getAttribute('data-value');
        userProfile[opt.field] = val;

        // Custom action for class step: update attributes
        if (opt.field === 'class') {
          const bases = CLASS_BASE_STATS[val];
          Object.keys(bases).forEach(attr => {
            wizAttrValues[attr] = bases[attr];
            userProfile.attributes = userProfile.attributes || {};
            userProfile.attributes[attr] = bases[attr];
          });
          wizAttrPool = 8;
          updateWizAttrDisplay();
          updateClassPreview(val);
        }
        
        // Auto advance except for attributes page (which is step 7 now)
        if (opt.step !== '7' || val === 'rato' || val === 'novico' || val === 'oldschool') {
          setTimeout(() => {
            wizNext();
          }, 250);
        }
      });
    });
  });

  // Atributos Roller Click Handlers
  document.querySelectorAll('.btn-attr-roll-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const attr = btn.getAttribute('data-roll-attr');
      if (wizAttrPool > 0) {
        wizAttrPool--;
        wizAttrValues[attr]++;
        playSound('click');
        updateWizAttrDisplay();
        
        // Sync to userProfile
        userProfile.attributes = userProfile.attributes || {};
        userProfile.attributes[attr] = wizAttrValues[attr];
      }
    });
  });

  document.querySelectorAll('.btn-attr-roll-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const attr = btn.getAttribute('data-roll-attr');
      const selectedClass = userProfile.class || 'bodybuilder';
      const baseLimit = CLASS_BASE_STATS[selectedClass][attr];
      
      if (wizAttrValues[attr] > baseLimit) {
        wizAttrPool++;
        wizAttrValues[attr]--;
        playSound('click');
        updateWizAttrDisplay();
        
        // Sync to userProfile
        userProfile.attributes = userProfile.attributes || {};
        userProfile.attributes[attr] = wizAttrValues[attr];
      }
    });
  });

  updateWizAttrDisplay();

  // Multiple injury selection (Step 10) click listeners (NO auto-advance)
  const injuryCards = document.querySelectorAll('[data-step="10"] .option-select-card');
  injuryCards.forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      const val = card.getAttribute('data-value');
      
      if (!Array.isArray(userProfile.jointPain)) {
        userProfile.jointPain = [];
      }

      if (val === 'Nenhum') {
        userProfile.jointPain = ['Nenhum'];
      } else {
        userProfile.jointPain = userProfile.jointPain.filter(x => x !== 'Nenhum');
        const idx = userProfile.jointPain.indexOf(val);
        if (idx > -1) {
          userProfile.jointPain.splice(idx, 1);
        } else {
          userProfile.jointPain.push(val);
        }
        if (userProfile.jointPain.length === 0) {
          userProfile.jointPain.push('Nenhum');
        }
      }

      // Update active state visuals
      injuryCards.forEach(c => {
        const cVal = c.getAttribute('data-value');
        if (userProfile.jointPain.includes(cVal)) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    });
  });

  // Height Controls
  const heightSlider = document.getElementById('slider-height');
  const heightDisplay = document.getElementById('display-height');
  function updateHeightVal(val) {
    heightSlider.value = val;
    heightDisplay.innerText = val;
    userProfile.height = val;
  }
  heightSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    heightDisplay.innerText = val;
    userProfile.height = val;
  });
  document.getElementById('btn-dec-height').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(120, parseInt(heightSlider.value) - 1);
    updateHeightVal(val);
  });
  document.getElementById('btn-inc-height').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(220, parseInt(heightSlider.value) + 1);
    updateHeightVal(val);
  });

  // Weight Controls
  const weightSlider = document.getElementById('slider-weight');
  const weightDisplay = document.getElementById('display-weight');
  function updateWeightVal(val) {
    weightSlider.value = val;
    const computedVal = parseFloat((val / 10).toFixed(1));
    weightDisplay.innerText = computedVal;
    userProfile.currentWeight = computedVal;
  }
  weightSlider.addEventListener('input', (e) => {
    const val = parseFloat((e.target.value / 10).toFixed(1));
    weightDisplay.innerText = val;
    userProfile.currentWeight = val;
  });
  document.getElementById('btn-dec-weight').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(400, parseInt(weightSlider.value) - 5);
    updateWeightVal(val);
  });
  document.getElementById('btn-inc-weight').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(1800, parseInt(weightSlider.value) + 5);
    updateWeightVal(val);
  });

  // Target Weight Controls
  const tweightSlider = document.getElementById('slider-tweight');
  const tweightDisplay = document.getElementById('display-tweight');
  function updateTWeightVal(val) {
    tweightSlider.value = val;
    const computedVal = parseFloat((val / 10).toFixed(1));
    tweightDisplay.innerText = computedVal;
    userProfile.targetWeight = computedVal;
  }
  tweightSlider.addEventListener('input', (e) => {
    const val = parseFloat((e.target.value / 10).toFixed(1));
    tweightDisplay.innerText = val;
    userProfile.targetWeight = val;
  });
  document.getElementById('btn-dec-tweight').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(400, parseInt(tweightSlider.value) - 5);
    updateTWeightVal(val);
  });
  document.getElementById('btn-inc-tweight').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(1800, parseInt(tweightSlider.value) + 5);
    updateTWeightVal(val);
  });

  // Days Weekly Target Controls
  const daysDisplay = document.getElementById('display-days');
  let weeklyDaysVal = 4;
  userProfile.weeklyDaysGoal = weeklyDaysVal;
  document.getElementById('btn-dec-days').addEventListener('click', () => {
    playSound('click');
    weeklyDaysVal = Math.max(1, weeklyDaysVal - 1);
    daysDisplay.innerText = weeklyDaysVal;
    userProfile.weeklyDaysGoal = weeklyDaysVal;
  });
  document.getElementById('btn-inc-days').addEventListener('click', () => {
    playSound('click');
    weeklyDaysVal = Math.min(7, weeklyDaysVal + 1);
    daysDisplay.innerText = weeklyDaysVal;
    userProfile.weeklyDaysGoal = weeklyDaysVal;
  });

  // Notification time container hide/show
  const notifCheck = document.getElementById('wiz-notif-enable');
  const notifTimeContainer = document.getElementById('wiz-notif-time-container');
  notifCheck.addEventListener('change', () => {
    playSound('click');
    userProfile.notificationsEnabled = notifCheck.checked;
    if (notifCheck.checked) {
      notifTimeContainer.style.display = 'flex';
    } else {
      notifTimeContainer.style.display = 'none';
    }
  });

  const notifTimeInput = document.getElementById('wiz-notif-time');
  if (notifTimeInput) {
    notifTimeInput.addEventListener('input', (e) => {
      userProfile.notificationTime = e.target.value;
    });
  }

  // Navigation Logic
  function wizNext() {
    if (steps[currentStepIdx] === '1') {
      const nameVal = document.getElementById('wiz-name').value.trim();
      if (!nameVal) {
        const toast = document.getElementById('overload-notification');
        const message = document.getElementById('overload-msg');
        if (toast && message) {
          message.innerText = "Calma lá paizão! Você acha que eu tenho bola de cristal para adivinhar seu nick? 🔮";
          toast.classList.remove('hidden');
          setTimeout(() => {
            toast.classList.add('hidden');
          }, 5000);
        }
        return;
      }
    }

    if (currentStepIdx < steps.length - 1) {
      currentStepIdx++;
      updateWizardStep();
    } else {
      concluirShape();
    }
  }

  function wizBack() {
    if (currentStepIdx > 0) {
      currentStepIdx--;
      updateWizardStep();
    }
  }

  document.getElementById('wiz-btn-next').addEventListener('click', () => {
    playSound('click');
    wizNext();
  });
  document.getElementById('wiz-btn-back').addEventListener('click', () => {
    playSound('click');
    wizBack();
  });

  function renderWizSummary() {
    const summaryCard = document.getElementById('wiz-summary-card');
    if (!summaryCard) return;

    const name = userProfile.name || 'Recruta Sem Nome';
    const cls = userProfile.class || 'bodybuilder';
    const focus = userProfile.focusArea || 'FullBody';
    const motivation = userProfile.motivation || 'saude';

    let adjective = "Determinado";
    if (motivation === 'aura') adjective = "Exalador de Aura";
    else if (motivation === 'estresse') adjective = "Indestrutível";
    else if (motivation === 'filosofico') adjective = "Sábio";
    else if (motivation === 'moral') adjective = "Fiel";
    else if (motivation === 'peso') adjective = "Definido";

    let suffix = "do Ginásio";
    if (focus === 'Peito') suffix = "do Supino";
    else if (focus === 'Costas') suffix = "das Asas Gigantes";
    else if (focus === 'Ombros') suffix = "dos Ombros de Aço";
    else if (focus === 'Braços') suffix = "dos Bíceps Mutantes";
    else if (focus === 'Pernas') suffix = "do Agachamento Monstro";

    const classNames = {
      bodybuilder: 'Bodybuilder',
      powerlifter: 'Powerlifter',
      calistenia: 'Guerreiro Calistênico',
      maratonista: 'Velocista Maratonista'
    };

    const finalTitle = `${adjective} ${classNames[cls]} ${suffix}`;
    const weight = userProfile.currentWeight || 75;
    const height = userProfile.height || 170;
    const targetW = userProfile.targetWeight || 75;

    summaryCard.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <h3 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: var(--color-primary);">🎴 Carta do Caçador</h3>
          <span style="font-size: 0.65rem; color: var(--color-accent); font-weight: bold; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">Lvl 1</span>
        </div>
        <div style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 900; color: #fff; margin-bottom: 2px;">
          ${name}
        </div>
        <div style="font-size: 0.68rem; font-style: italic; color: #ffb703; margin-top: -6px; margin-bottom: 4px;">
          "${finalTitle}"
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.68rem; color: var(--text-secondary);">
          <div>📏 Altura: <strong>${height} cm</strong></div>
          <div>⚖️ Peso Inicial: <strong>${weight} kg</strong></div>
          <div>🎯 Meta: <strong>${targetW} kg</strong></div>
          <div>🏋️‍♂️ Frequência: <strong>${weeklyDaysVal} treinos/semana</strong></div>
        </div>
        <div style="margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px;">
          <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Atributos Iniciais:</span>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; color: var(--color-primary); background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px;">
            <span>FOR: ${wizAttrValues.FOR}</span>
            <span>RES: ${wizAttrValues.RES}</span>
            <span>AGI: ${wizAttrValues.AGI}</span>
            <span>VIG: ${wizAttrValues.VIG}</span>
            <span>FOC: ${wizAttrValues.FOC}</span>
          </div>
        </div>
      </div>
    `;
  }

  function updateWizardStep() {
    const stepId = steps[currentStepIdx];
    const stepsDivs = document.querySelectorAll('.onboarding-step');
    
    stepsDivs.forEach(div => {
      if (div.getAttribute('data-step') === stepId) {
        div.classList.add('active');
      } else {
        div.classList.remove('active');
      }
    });

    // Update progress bar
    const progressPercent = (currentStepIdx / (steps.length - 1)) * 100;
    document.getElementById('onboarding-progress-fill').style.width = `${progressPercent}%`;

    // Toggle Back button visibility
    const btnBack = document.getElementById('wiz-btn-back');
    if (currentStepIdx === 0) {
      btnBack.style.visibility = 'hidden';
    } else {
      btnBack.style.visibility = 'visible';
    }

    // Toggle Forward button text
    const btnNext = document.getElementById('wiz-btn-next');
    if (currentStepIdx === steps.length - 1) {
      btnNext.innerText = 'CONCLUIR SHAPE 😈';
    } else {
      btnNext.innerText = 'AVANÇAR';
    }

    // Show/Hide summary card at final step
    if (stepId === '11') {
      renderWizSummary();
      const summaryCard = document.getElementById('wiz-summary-card');
      if (summaryCard) summaryCard.classList.remove('hidden');
    } else {
      const summaryCard = document.getElementById('wiz-summary-card');
      if (summaryCard) summaryCard.classList.add('hidden');
    }
  }

  function concluirShape() {
    const nameVal = document.getElementById('wiz-name').value.trim();
    if (!nameVal) {
      const toast = document.getElementById('overload-notification');
      const message = document.getElementById('overload-msg');
      if (toast && message) {
        message.innerText = "Calma lá paizão! Você acha que eu tenho bola de cristal para adivinhar seu nick? 🔮";
        toast.classList.remove('hidden');
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 5000);
      }
      return;
    }

    playSound('levelup');

    userProfile.name = nameVal;
    
    const activeGender = document.querySelector('[data-step="2"] .option-select-card.active');
    userProfile.sex = activeGender ? activeGender.getAttribute('data-value') : 'masculino';

    const activeGoal = document.querySelector('[data-step="3"] .option-select-card.active');
    userProfile.mainObjective = activeGoal ? activeGoal.getAttribute('data-value') : 'engordar';

    const activeMotivation = document.querySelector('[data-step="4"] .option-select-card.active');
    userProfile.motivation = activeMotivation ? activeMotivation.getAttribute('data-value') : 'saude';

    const activeFocus = document.querySelector('[data-step="5"] .option-select-card.active');
    userProfile.focusArea = activeFocus ? activeFocus.getAttribute('data-value') : 'FullBody';

    const activeClass = document.querySelector('[data-step="6"] .option-select-card.active');
    userProfile.class = activeClass ? activeClass.getAttribute('data-value') : 'bodybuilder';

    const activeExp = document.querySelector('[data-step="7"] .option-select-card.active');
    userProfile.experienceLevel = activeExp ? activeExp.getAttribute('data-value') : 'rato';

    const activeFreq = document.querySelector('[data-step="8"] .option-select-card.active');
    userProfile.activityLevel = activeFreq ? activeFreq.getAttribute('data-value') : 'pouco';

    userProfile.height = parseInt(document.getElementById('display-height').innerText) || 170;
    userProfile.currentWeight = parseFloat(document.getElementById('display-weight').innerText) || 70;
    userProfile.targetWeight = parseFloat(document.getElementById('display-tweight').innerText) || 70;

    if (!userProfile.jointPain || userProfile.jointPain.length === 0) {
      userProfile.jointPain = ['Nenhum'];
    }

    userProfile.weeklyDaysGoal = weeklyDaysVal;
    userProfile.notificationsEnabled = notifCheck.checked;
    userProfile.notificationTime = document.getElementById('wiz-notif-time').value || '18:00';

    userProfile.attributes = {
      FOR: wizAttrValues.FOR,
      RES: wizAttrValues.RES,
      AGI: wizAttrValues.AGI,
      VIG: wizAttrValues.VIG,
      FOC: wizAttrValues.FOC
    };

    localStorage.setItem('freaky_quest_user', JSON.stringify(userProfile));

    // Synchronize to the core state engine
    state.charName = userProfile.name;
    state.charClass = userProfile.class;
    state.charWeight = userProfile.currentWeight;
    state.charHeight = userProfile.height;
    state.charGoal = userProfile.mainObjective;
    state.charFreq = userProfile.activityLevel;
    state.charExp = userProfile.experienceLevel;
    state.charGender = userProfile.sex;
    state.motivation = userProfile.motivation;
    state.focusMuscle = userProfile.focusArea;
    state.injury = userProfile.jointPain;
    state.profilePic = userProfile.profilePic || '';
    state.weeklyTrainGoal = userProfile.weeklyDaysGoal;
    state.notificationEnabled = userProfile.notificationsEnabled;
    state.notificationTime = userProfile.notificationTime;

    state.level = 1;
    state.xp = 0;
    state.xpNeeded = 100;
    state.workoutsCompleted = 0;
    state.waterIntake = 0;
    state.waterTargetManual = false;
    state.unlockedTrophies = [];
    state.activeMentor = 'rocklee';
    state.mealLogs = [];
    state.personalRecords = {};

    state.attributes = {
      for: userProfile.attributes.FOR,
      res: userProfile.attributes.RES,
      agi: userProfile.attributes.AGI,
      vig: userProfile.attributes.VIG,
      foc: userProfile.attributes.FOC
    };

    recalculateMacrosTargets();
    updateWaterTargetFromWeight();
    generateDailyQuests();

    if (state.notificationEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }

    saveState();

    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    updateUI();
    setTimeout(() => startTutorial(), 1000);
  }

  // Onboarding Class Cards choice clickers
  const classCards = document.querySelectorAll('.class-card');
  classCards.forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      classCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // SPA navigation switcher
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      playSound('click');
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(i => i.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // Sound toggler button
  const soundBtn = document.getElementById('toggle-sound');
  const soundOnIcon = soundBtn.querySelector('.sound-on-icon');
  const soundOffIcon = soundBtn.querySelector('.sound-off-icon');

  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      playSound('click');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    }
    saveState();
  });

  // DOCK NUTRITION LINK TAB REDIRECT
  document.getElementById('go-to-diet-btn').addEventListener('click', () => {
    const dietNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="diet"]');
    if (dietNavBtn) dietNavBtn.click();
  });

  // WATER LITRE BUTTON CLICK
  const addWaterClick = () => {
    playSound('water');
    
    const target = state.waterTarget || 3;
    state.waterDrank = (state.waterDrank || 0) + 1;
    state.waterIntake = state.waterDrank;

    // Mentor affinity XP on daily actions: 1L water (+5 XP)
    addMentorXP(state.activeMentor, 5);

    // Check if exceeding goal for EXTRA XP!
    if (state.waterDrank > target) {
      // VIG (Vigor) multiplies extra water XP — +2% per point above 10
      const vigMulti = 1 + Math.max(0, (state.attributes.vig - 10) * 0.02);
      addXP(Math.round(10 * vigMulti)); // Base 10 XP, boosted by VIG
    } else {
      checkQuestRequirements();
    }
    
    updateDailyChallengeProgress('water', state.waterIntake);
    saveState();
    updateUI();
  };

  const btnAddWater = document.getElementById('add-water-btn');
  if (btnAddWater) {
    btnAddWater.addEventListener('click', addWaterClick);
  }
  const btnAddWaterAlt = document.getElementById('btn-add-water');
  if (btnAddWaterAlt) {
    btnAddWaterAlt.addEventListener('click', addWaterClick);
  }

  // WATER CUSTOM TARGET CHANGE INPUT
  document.getElementById('water-target-input').addEventListener('change', (e) => {
    const newTarget = parseInt(e.target.value) || 3;
    state.waterTarget = Math.max(1, Math.min(10, newTarget));
    state.waterTargetManual = true;
    
    // regenerate water quests descriptions
    const waterQuest = state.dailyQuests.find(q => q.id === 'quest_water');
    if (waterQuest) {
      waterQuest.desc = `Beber pelo menos ${state.waterTarget}L de água hoje`;
    }
    
    saveState();
    updateUI();
  });

  // DIET FORM LOG FOOD SUBMIT
  const dietForm = document.getElementById('diet-food-form');
  dietForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const foodId = document.getElementById('diet-select-food').value;
    const foodGrams = parseFloat(document.getElementById('diet-food-weight').value) || 100;
    
    const foodObj = state.foodsDb.find(f => f.id === foodId);
    
    if (foodObj) {
      // Math portions
      const ratio = foodGrams / 100;
      const meal = {
        id: Date.now(),
        name: foodObj.name,
        weight: foodGrams,
        kcal: foodObj.kcal * ratio,
        prot: foodObj.prot * ratio,
        fiber: foodObj.fiber * ratio
      };

      state.mealLogs.push(meal);
      playSound('quest');
      
      checkQuestRequirements();
      saveState();
      updateUI();
      
      // Reset portion to default 100g
      document.getElementById('diet-food-weight').value = 100;
    }
  });

  // WORKOUT SHEETS TOGGLES (Mentor vs Custom)
  document.getElementById('toggle-workout-std').addEventListener('click', () => {
    playSound('click');
    state.useCustomWorkout = false;
    saveState();
    updateUI();
  });
  
  document.getElementById('toggle-workout-cust').addEventListener('click', () => {
    playSound('click');
    state.useCustomWorkout = true;
    saveState();
    updateUI();
  });

  // WORKOUT DIVISIONS SELECTORS (A, B, C)
  const divButtons = document.querySelectorAll('.workout-div-btn');
  divButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      divButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeWorkoutDiv = btn.getAttribute('data-div');
      
      saveState();
      
      const exContainer = document.getElementById('exercises-list');
      if (exContainer) {
        exContainer.classList.remove('workout-slide-fade');
        void exContainer.offsetWidth; // trigger reflow
        exContainer.classList.add('workout-slide-fade');
      }
      
      renderWorkoutRoutine();
    });
  });

  // ADD CUSTOM EXERCISE SUBMISSION
  const addExForm = document.getElementById('add-exercise-form');
  addExForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('cust-ex-name').value.trim();
    const muscle = document.getElementById('cust-ex-muscle').value;
    const sets = parseInt(document.getElementById('cust-ex-sets').value) || 4;
    const reps = document.getElementById('cust-ex-reps').value.trim() || "8-12";
    const initialWeight = parseFloat(document.getElementById('cust-ex-weight').value) || 0;

    const newEx = {
      name: name,
      muscle: muscle,
      sets: sets,
      targetReps: reps,
      weight: initialWeight
    };

    // Push into active division custom workouts
    state.customWorkouts[state.activeWorkoutDiv].exercises.push(newEx);
    
    playSound('quest');
    saveState();
    
    // Close modal
    document.getElementById('add-exercise-modal').classList.add('hidden');
    addExForm.reset();
    document.getElementById('cust-ex-sets').value = 4;
    document.getElementById('cust-ex-weight').value = 10;
    document.getElementById('cust-ex-reps').value = "8-12";
    
    updateUI();
  });

  // ADD CUSTOM FOOD SUBMISSION
  const addFoodForm = document.getElementById('add-custom-food-form');
  addFoodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('cust-food-name').value.trim();
    const kcal = parseInt(document.getElementById('cust-food-kcal').value) || 150;
    const prot = parseFloat(document.getElementById('cust-food-prot').value) || 10;
    const fiber = parseFloat(document.getElementById('cust-food-fiber').value) || 2;

    const customId = `cust_food_${Date.now()}`;
    const newFood = {
      id: customId,
      name: name,
      kcal: kcal,
      prot: prot,
      fiber: fiber,
      isCustom: true
    };

    state.foodsDb.push(newFood);
    playSound('quest');
    saveState();

    // Close modal
    document.getElementById('add-custom-food-modal').classList.add('hidden');
    addFoodForm.reset();
    document.getElementById('cust-food-kcal').value = 150;
    document.getElementById('cust-food-prot').value = 10;
    document.getElementById('cust-food-fiber').value = 2;

    updateUI();
  });

  // COMPLETE WORKOUT ROUTINE ACTION
  document.getElementById('btn-finish-workout').addEventListener('click', () => {
    const completion = getWorkoutCompletionStats();

    if (completion.totalSets === 0) {
      alert('Adicione exercícios à ficha antes de finalizar o treino.');
      return;
    }

    if (completion.percent < 50) {
      const proceed = confirm(
        `Você completou apenas ${completion.completedSets}/${completion.totalSets} séries (${Math.round(completion.percent)}%).\n\nFinalizar mesmo assim? (XP reduzido)`
      );
      if (!proceed) return;
    }

    playSound('click');
    document.getElementById('rpe-modal').classList.remove('hidden');
  });

  // RPE MODAL OPTIONS WIRING
  const rpeOptions = document.querySelectorAll('.rpe-option-card');
  rpeOptions.forEach(card => {
    card.addEventListener('click', () => {
      const rpeType = card.getAttribute('data-rpe');
      const rpeXp = parseInt(card.getAttribute('data-xp')) || 10;

      // Close RPE Modal
      document.getElementById('rpe-modal').classList.add('hidden');

      // Mentor XP based on RPE submission rating selected
      let affinityXP = 15;
      if (rpeType === 'intenso') affinityXP = 40;
      else if (rpeType === 'freaky') affinityXP = 60;
      addMentorXP(state.activeMentor, affinityXP);

      // FX triggers for Freaky
      if (rpeType === 'freaky') {
        document.body.classList.add('screen-shake');
        playSound('brolyki');
        setTimeout(() => {
          document.body.classList.remove('screen-shake');
        }, 600);
      } else {
        playSound('levelup');
      }

      // Execute actual workout completion
      completeActiveWorkout(rpeXp);
    });
  });

  // WHEAT ARSENAL PICKER PANEL WIRING
  const btnOpenArsenal = document.getElementById('btn-open-arsenal');
  const arsenalPanel = document.getElementById('arsenal-panel');
  if (btnOpenArsenal && arsenalPanel) {
    btnOpenArsenal.addEventListener('click', () => {
      playSound('click');
      arsenalPanel.classList.toggle('hidden');
      arsenalPanel.classList.toggle('open');
    });
  }

  const arsenalItems = document.querySelectorAll('.arsenal-item');
  arsenalItems.forEach(item => {
    item.addEventListener('click', () => {
      playSound('click');
      const exName = item.getAttribute('data-name');
      const exMuscle = item.getAttribute('data-muscle');
      
      document.getElementById('cust-ex-name').value = exName;
      document.getElementById('cust-ex-muscle').value = exMuscle;
      
      if (arsenalPanel) {
        arsenalPanel.classList.add('hidden');
        arsenalPanel.classList.remove('open');
      }
    });
  });

  // DISTRIBUTE STATS POINTS
  const addAttrBtns = document.querySelectorAll('.btn-attr-add');
  addAttrBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.attrPoints > 0) {
        const attrKey = btn.getAttribute('data-attr');
        state.attributes[attrKey] += 1;
        state.attrPoints -= 1;
        
        playSound('point_allocation');
        spawnAttrFloatingText(attrKey);
        
        saveState();
        updateUI();
      }
    });
  });

  // MODAL SWITCH TRIGGER TOGGLES
  document.getElementById('btn-open-add-exercise-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-exercise-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-exercise-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-exercise-modal').classList.add('hidden');
  });

  document.getElementById('btn-open-custom-food-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-food-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-custom-food-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-food-modal').classList.add('hidden');
  });

  document.getElementById('btn-open-custom-mentor-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-mentor-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-custom-mentor-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-mentor-modal').classList.add('hidden');
  });

  // LEVEL UP MODAL OK BUTTON
  document.getElementById('btn-close-level-up').addEventListener('click', () => {
    playSound('click');
    document.getElementById('level-up-modal').classList.add('hidden');
    const statusNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="status"]');
    if (statusNavBtn) statusNavBtn.click();
  });

  // ITEM ACQUIRED OK BUTTON
  document.getElementById('btn-close-item-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('item-acquired-modal').classList.add('hidden');
  });

  // CLAIM DAILY FREAKY CHALLENGE REWARD
  const claimBtn = document.getElementById('btn-claim-challenge');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      claimDailyChallengeReward();
    });
  }

  // CLEAR DATA TRIGGER
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm("Você quer apagar todo o seu progresso? Isso limpará seus Ranks, Alimentos criados, Treinos customizados e Metas.")) {
      localStorage.removeItem('freakyquest_state_v2');
      localStorage.removeItem('freaky_quest_user');
      location.reload();
    }
  });

  // SETTINGS MODAL
  function openSettingsModal() {
    document.getElementById('settings-weight').value = state.charWeight;
    document.getElementById('settings-target-weight').value = state.targetWeight || state.charWeight;
    document.getElementById('settings-weekly-days').value = state.weeklyTrainGoal;
    document.getElementById('settings-notif-time').value = state.notificationTime || '18:00';
    document.getElementById('settings-notif-enable').checked = state.notificationEnabled !== false;

    const preview = document.getElementById('settings-profile-pic-preview');
    const removeBtn = document.getElementById('btn-remove-profile-pic');
    if (preview) {
      if (state.profilePic) {
        preview.src = state.profilePic;
        preview.style.display = 'block';
        if (removeBtn) removeBtn.classList.remove('hidden');
      } else {
        preview.src = '';
        preview.style.display = 'none';
        if (removeBtn) removeBtn.classList.add('hidden');
      }
    }
    const settingsInput = document.getElementById('settings-profile-pic');
    if (settingsInput) settingsInput.value = '';

    const injurySelect = document.getElementById('settings-injury');
    if (injurySelect) {
      injurySelect.value = Array.isArray(state.injury) ? (state.injury[0] || 'Nenhum') : (state.injury || 'Nenhum');
    }

    document.getElementById('settings-modal').classList.remove('hidden');
  }

  function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
  }

  const btnOpenSettings = document.getElementById('btn-open-settings');
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => {
    playSound('click');
    openSettingsModal();
  });

  const btnSettingsGear = document.getElementById('btn-settings-gear');
  if (btnSettingsGear) {
    btnSettingsGear.addEventListener('click', () => {
      playSound('click');
      openSettingsModal();
    });
  }

  const btnEditMeasuresShortcut = document.getElementById('btn-edit-measures-shortcut');
  if (btnEditMeasuresShortcut) {
    btnEditMeasuresShortcut.addEventListener('click', () => {
      playSound('click');
      openSettingsModal();
    });
  }

  // Mentor message bubble interactive quote swap and bounce effect
  const mentorBox = document.querySelector('.mentor-message-box');
  if (mentorBox) {
    mentorBox.addEventListener('click', () => {
      playSound('click');
      mentorBox.classList.remove('mentor-bounce');
      void mentorBox.offsetWidth; // trigger reflow
      mentorBox.classList.add('mentor-bounce');
      
      const mId = state.activeMentor || 'rocklee';
      const quotesList = MENTOR_DASHBOARD_QUOTES[mId] || [];
      if (quotesList.length > 0) {
        const randQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
        const uMotivationTip = MOTIVATION_FLAVOR[userProfile.motivation || state.motivation];
        document.getElementById('mentor-bubble-quote').innerText = uMotivationTip
          ? `${randQuote} (${uMotivationTip})`
          : randQuote;
      }
    });
  }

  const wizProfilePic = document.getElementById('wiz-profile-pic');
  if (wizProfilePic) {
    wizProfilePic.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          userProfile.profilePic = event.target.result;
          const previewEl = document.getElementById('wiz-avatar-preview');
          if (previewEl) {
            previewEl.src = event.target.result;
            previewEl.classList.remove('hidden');
          }
          const runeEl = document.getElementById('wiz-avatar-rune');
          if (runeEl) {
            runeEl.classList.remove('hidden');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const settingsProfilePic = document.getElementById('settings-profile-pic');
  if (settingsProfilePic) {
    settingsProfilePic.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          state.profilePic = event.target.result;
          userProfile.profilePic = event.target.result;
          const preview = document.getElementById('settings-profile-pic-preview');
          if (preview) {
            preview.src = event.target.result;
            preview.style.display = 'block';
          }
          const removeBtn = document.getElementById('btn-remove-profile-pic');
          if (removeBtn) removeBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const btnRemoveProfilePic = document.getElementById('btn-remove-profile-pic');
  if (btnRemoveProfilePic) {
    btnRemoveProfilePic.addEventListener('click', () => {
      playSound('click');
      state.profilePic = '';
      userProfile.profilePic = '';
      const preview = document.getElementById('settings-profile-pic-preview');
      if (preview) {
        preview.src = '';
        preview.style.display = 'none';
      }
      btnRemoveProfilePic.classList.add('hidden');
      const settingsInput = document.getElementById('settings-profile-pic');
      if (settingsInput) settingsInput.value = '';
    });
  }

  document.getElementById('btn-close-settings-modal').addEventListener('click', () => {
    playSound('click');
    closeSettingsModal();
  });

  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    playSound('quest');

    state.charWeight = parseFloat(document.getElementById('settings-weight').value) || state.charWeight;
    state.targetWeight = parseFloat(document.getElementById('settings-target-weight').value) || state.targetWeight;
    state.weeklyTrainGoal = parseInt(document.getElementById('settings-weekly-days').value, 10) || 4;
    state.notificationTime = document.getElementById('settings-notif-time').value || '18:00';
    state.notificationEnabled = document.getElementById('settings-notif-enable').checked;
    
    const injuryVal = document.getElementById('settings-injury').value || 'Nenhum';
    state.injury = [injuryVal];

    const savedUserStr = localStorage.getItem('freaky_quest_user');
    if (savedUserStr) {
      try {
        const userObj = JSON.parse(savedUserStr);
        userObj.profilePic = state.profilePic;
        userObj.targetWeight = state.targetWeight;
        userObj.weeklyDaysGoal = state.weeklyTrainGoal;
        userObj.notificationsEnabled = state.notificationEnabled;
        userObj.notificationTime = state.notificationTime;
        userObj.currentWeight = state.charWeight;
        userObj.jointPain = state.injury;
        localStorage.setItem('freaky_quest_user', JSON.stringify(userObj));
        userProfile = userObj;
      } catch (err) {
        console.error("Failed to update freaky_quest_user on settings submit", err);
      }
    }

    if (!state.waterTargetManual) updateWaterTargetFromWeight();
    recalculateMacrosTargets();
    saveState();
    updateUI();
    closeSettingsModal();
  });

  const btnSkipRest = document.getElementById('btn-skip-rest');
  if (btnSkipRest) {
    btnSkipRest.addEventListener('click', () => {
      playSound('click');
      stopRestTimer();
    });
  }

  // QUICK DIET INVENTORY LOGS WIRING
  function spawnDietFloatingText(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parent = document.body;
    
    const span = document.createElement('span');
    span.className = 'diet-floating-text';
    span.innerText = text;
    span.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    span.style.top = `${rect.top + window.scrollY}px`;
    
    parent.appendChild(span);
    setTimeout(() => {
      span.remove();
    }, 850);
  }

  window.logQuickMeal = function(name, kcal, prot, carbs, fiber, elementId) {
    if (name.includes("Elixir")) {
      playSound('potion');
    } else {
      playSound('crunch');
    }
    
    if (elementId) {
      let ft = `+${kcal} Kcal! 🍗`;
      if (prot > 5) {
        ft = `+${prot}g Prot! ⚡`;
      } else if (fiber > 2) {
        ft = `+${fiber}g Fibras! 🥗`;
      }
      spawnDietFloatingText(elementId, ft);
    }
    
    if (!state.dailyMacros) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
    state.dailyMacros.kcal += kcal;
    state.dailyMacros.prot += prot;
    state.dailyMacros.fiber += fiber;
    state.dailyMacros.carbs += carbs;

    state.mealLogs.push({
      id: Date.now(),
      name: name,
      weight: 100,
      kcal: kcal,
      prot: prot,
      carbs: carbs,
      fiber: fiber
    });

    checkQuestRequirements();
    saveState();
    updateUI();
  };

  const btnMarmita = document.getElementById('btn-quick-marmita');
  if (btnMarmita) {
    btnMarmita.addEventListener('click', () => {
      window.logQuickMeal("Marmita Monstro 🍗", 450, 35, 50, 4, 'btn-quick-marmita');
    });
  }
  const btnWhey = document.getElementById('btn-quick-whey');
  if (btnWhey) {
    btnWhey.addEventListener('click', () => {
      window.logQuickMeal("Elixir de Whey ⚡", 140, 26, 3, 0, 'btn-quick-whey');
    });
  }
  const btnFibra = document.getElementById('btn-quick-fibra');
  if (btnFibra) {
    btnFibra.addEventListener('click', () => {
      window.logQuickMeal("Ração de Fibra 🥗", 80, 2, 15, 8, 'btn-quick-fibra');
    });
  }

  // TRAINING NOTIFICATION CHECKER AND TIMER
  function triggerTrainingNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⚔️ FREAKYQUEST: Hora do Treino!', {
          body: `E aí ${state.charName}! Hora de ir buscar sua dose diária de ferro e bater o shape! 💪`,
          icon: 'logo.jpg'
        });
      } catch (e) {
        console.warn('Native notification failed', e);
      }
    }

    // In-game simulated alert/banner
    const toast = document.getElementById('overload-notification');
    const message = document.getElementById('overload-msg');
    if (message && toast) {
      message.innerText = `⚔️ ALERTA: Hora do shape, ${state.charName}! 💪`;
      toast.classList.remove('hidden');
      playSound('quest');
      
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 5000);
    }
  }

  // Poll every 15 seconds to see if it's time to train
  setInterval(() => {
    if (!state.notificationEnabled || !state.notificationTime || !state.charName) return;
    
    const now = new Date();
    const currentHourMin = now.toTimeString().substring(0, 5); // Format: "18:00"
    const todayStr = now.toDateString(); // Format: "Sat May 23 2026"
    
    if (currentHourMin === state.notificationTime && state.lastNotificationDate !== todayStr) {
      state.lastNotificationDate = todayStr;
      saveState();
      triggerTrainingNotification();
    }
  }, 15000);

});

function completeActiveWorkout(rpeBonusXp) {
  const completion = getWorkoutCompletionStats();
  state.workoutsCompleted += 1;

  // Check weekly date changes and reset if new week
  checkWeeklyReset();

  // Track weekly count
  state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;
  state.lastWorkoutDate = new Date().toISOString();

  // Resistência (RES) increases base workout XP
  let xpGained = 50 + state.attributes.res + rpeBonusXp;
  if (completion.percent < 50) xpGained = Math.round(xpGained * 0.5);
  else if (completion.percent < 100) xpGained = Math.round(xpGained * 0.85);

  // Apply dynamic visual badge bonus (+10% Treino XP) if anabolic is active
  if (state.anabolicActive) {
    xpGained = Math.round(xpGained * 1.10);
  }

  let extraXP = false;

  // Check if training target is exceeded for EXTRA XP!
  if (state.workoutsThisWeek > state.weeklyTrainGoal) {
    xpGained += 30;
    extraXP = true;
  }
  
  addXP(xpGained);
  
  if (state.workoutsCompleted === 1) unlockTrophy('primeiro_passo');

  const classQuest = state.dailyQuests.find(q => q.id === 'quest_class');
  if (classQuest && !classQuest.completed && completion.percent >= 50) {
    classQuest.completed = true;
    const focBonus = 1 + (state.attributes.foc * 0.01);
    addXP(Math.round(classQuest.xpReward * focBonus));
    playSound('quest');
  }

  // Save current weight and strength to history (volume real do treino)
  if (!state.weightHistory) state.weightHistory = [];
  if (!state.strengthHistory) state.strengthHistory = [];

  state.weightHistory.push(parseFloat(state.charWeight) || 80);
  const sessionVolume = calculateSessionVolume();
  const prMax = Object.values(state.personalRecords || {}).reduce((max, val) => Math.max(max, val || 0), 0);
  state.strengthHistory.push(sessionVolume > 0 ? sessionVolume : prMax || 50);

  // Limit history length to 8 points
  if (state.weightHistory.length > 8) state.weightHistory.shift();
  if (state.strengthHistory.length > 8) state.strengthHistory.shift();

  // Trigger daily challenge workout progress
  if (completion.percent >= 50) {
    updateDailyChallengeProgress('workout', 1);
  }

  saveState();
  updateUI();

  // Show toast for extra workout bonus
  if (extraXP) {
    setTimeout(() => {
      showExtraWorkoutToast(state.workoutsThisWeek, state.weeklyTrainGoal);
    }, 1200);
  }

  // Scroll to dashboard
  const dashboardNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="dashboard"]');
  if (dashboardNavBtn) dashboardNavBtn.click();
}
