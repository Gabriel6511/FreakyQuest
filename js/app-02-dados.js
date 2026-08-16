/* Bases de dados: sub-classes, mentores, recompensas, equipamentos, treinos, trofeus
 *
 * Parte 2/14 do antigo app.js (linhas 755-2107 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
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
// ─────────────────────────────────────────────────────────────
// GUIA PARA ADICIONAR NOVO MENTOR (ex: mentor #9, #20, #50...):
//   1. Copie um objeto abaixo e ajuste todos os campos
//   2. Adicione o tema CSS em styles.css (body.theme-<id>)
//   3. Adicione as 5 falas fiéis em MENTOR_VOICE_LINES (usadas no balão do
//      Painel e nas notificações de treino/recorde/level up)
//   4. Adicione uma entrada em MENTOR_REWARD_CONFIGS (ver linha ~405)
//      — NÃO escreva o array de recompensas à mão. O gerador
//      generateMentorRewards() monta as 23 etapas automaticamente
//      a partir desse config, garantindo que todo mentor novo nasça
//      com a MESMA profundidade de progressão que os outros.
//   5. Coloque a imagem na pasta do projeto (nome = avatar field)
//   6. filterCSS: filtro para imagem — 'anime' | 'real' | 'minimal'
//   7. universe: agrupa na aba de mentores (ex: 'Dragon Ball', 'Naruto', 'Fisiculturistas')
//      Para um universo novo (ex: 'Attack on Titan'), basta usar o nome aqui
//      e adicioná-lo em UNIVERSE_ORDER / UNIVERSE_META (ver função MENTORS_LIST_FULL)
// ─────────────────────────────────────────────────────────────
const OFFICIAL_MENTORS = [
  // ══════════════ DRAGON BALL ══════════════
  {
    id: 'goku',
    name: 'Son Goku',
    universe: 'Dragon Ball',
    category: 'anime',
    archetype: 'effort',       // effort | genetics | wisdom | beast | legend
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-goku',
    avatar: 'goku.webp',
    filterCSS: 'contrast(1.5) saturate(2.0) brightness(0.88)',
    quote: '"Oi, eu sou o Goku! Treinar na gravidade 100x vai te deixar insano. Vamos superar nossos limites hoje?"',
    buff: '+15% Força & +5% Foco',
    colorHex: '#f77f00',
    particleType: 'ki',
    isCustom: false
  },
  {
    id: 'brolyz',
    name: 'Broly (Saga Z)',
    universe: 'Dragon Ball',
    category: 'anime',
    archetype: 'beast',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-brolyz',
    avatar: 'brolyz.webp',
    filterCSS: 'contrast(1.6) saturate(1.8) brightness(0.85) hue-rotate(5deg)',
    quote: '"O meu poder é máximo! Kakarotooooo!"',
    buff: '+25% Força & +10% Resistência (Poder Supremo)',
    colorHex: '#adff2f',
    particleType: 'ki',
    isCustom: false
  },
  // ══════════════ NARUTO ══════════════
  {
    id: 'rocklee',
    name: 'Rock Lee',
    universe: 'Naruto',
    category: 'anime',
    archetype: 'effort',
    primaryStat: 'agi',
    levelReq: 1,
    theme: 'theme-rocklee',
    avatar: 'rocklee.webp',
    filterCSS: 'contrast(1.4) saturate(1.9) brightness(0.9)',
    quote: '"O trabalho duro vence o talento natural quando o talento natural não trabalha duro!"',
    buff: '+10% Agilidade & +10% Vigor',
    colorHex: '#38b000',
    particleType: 'leaves',
    isCustom: false
  },
  // ══════════════ ONE PUNCH MAN ══════════════
  {
    id: 'saitama',
    name: 'Saitama',
    universe: 'One Punch Man',
    category: 'anime',
    archetype: 'legend',
    primaryStat: 'res',
    levelReq: 1,
    theme: 'theme-saitama',
    avatar: 'saitama.webp',
    filterCSS: 'contrast(1.45) saturate(1.7) brightness(0.92)',
    quote: '"100 flexões, 100 agachamentos, 100 abdominais e 10 km de corrida todos os dias! Isso é tudo."',
    buff: '+30% Resistência & +30% Agilidade',
    colorHex: '#e63946',
    particleType: 'stars',
    isCustom: false
  },
  // ══════════════ FISICULTURISTAS ══════════════
  {
    id: 'bebezinho',
    name: 'Gabriel Ganley "Bebezinho"',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'legend',
    primaryStat: 'foc',
    levelReq: 1,
    theme: 'theme-bebezinho',
    avatar: 'bebezinho_tribute.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.2) brightness(0.95)',
    quote: '"Wake wake! Abre o olho big! Freaky Season! All Day Neguin!"',
    buff: '+15% Força & +15% Foco (Tributo Especial)',
    colorHex: '#9b5de5',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'ramondino',
    name: 'Ramon Dino',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'genetics',
    primaryStat: 'vig',
    levelReq: 1,
    theme: 'theme-ramondino',
    avatar: 'ramondino.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.2) brightness(0.95)',
    quote: '"Não tem segredo, irmão. É bater o peso certinho, treinar braço pesado e comer limpo! Acorda pro treino!"',
    buff: '+12% Vigor & +8% Força',
    colorHex: '#0077b6',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'arnold',
    name: 'Arnold S.',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'legend',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-arnold',
    avatar: 'arnold.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.25) brightness(0.92)',
    quote: '"Se você quer crescer, tem que passar pela dor. Sinta o pump e venha comigo se quiser ficar gigantesco!"',
    buff: '+20% Força e Hipertrofia Estética',
    colorHex: '#d4af37',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'nickwalker',
    name: 'Nick Walker "The Mutant"',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'genetics',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-nickwalker',
    avatar: 'nickwalker.webp',
    filterCSS: 'contrast(1.3) saturate(0.7) sepia(0.25) brightness(0.92)',
    quote: '"Foque em progredir a carga, treine com intensidade bizarra de verdade e seja um Mutante no ginásio!"',
    buff: '+25% Força & +10% Vigor (Hipertrofia Extrema)',
    colorHex: '#ff5e00',
    particleType: 'embers',
    isCustom: false
  },
  // ══════════════ COREANINHOS ══════════════
  {
    id: 'jin',
    name: 'Jin "Worldwide Handsome"',
    universe: 'Coreaninhos',
    category: 'real',
    archetype: 'genetics',
    primaryStat: 'vig',
    levelReq: 1,
    theme: 'theme-jin',
    avatar: 'jin.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.25) brightness(0.95)',
    quote: '"Bora treinar, gente linda! Aqui quem manda é o mais bonito do mundo — e olha que ele também é o mais disciplinado!"',
    buff: '+15% Vigor & +10% Força',
    colorHex: '#ff8fa3',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'namjoon',
    name: 'RM "Namjoon"',
    universe: 'Coreaninhos',
    category: 'real',
    archetype: 'wisdom',
    primaryStat: 'foc',
    levelReq: 1,
    theme: 'theme-namjoon',
    avatar: 'namjoon.webp',
    filterCSS: 'contrast(1.28) saturate(0.7) sepia(0.25) brightness(0.92)',
    quote: '"Treinar o corpo é treinar a mente. Cada série de hoje é um passo pra versão melhor de você amanhã."',
    buff: '+15% Foco & +10% Vigor',
    colorHex: '#5b5f97',
    particleType: 'embers',
    isCustom: false
  },
  // ══════════════ JUJUTSU KAISEN ══════════════
  {
    id: 'sukuna',
    name: 'Ryomen Sukuna',
    universe: 'Jujutsu Kaisen',
    category: 'anime',
    archetype: 'beast',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-sukuna',
    avatar: 'sukuna.webp',
    // Arte oficial (trono de caveiras) ja vem com contraste/saturacao fortes —
    // foge do preset "Anime" padrao pra nao estourar os tons rosa/vermelho.
    filterCSS: 'contrast(1.15) saturate(1.15) brightness(1.0)',
    quote: '"Você acaricia o ferro com medo de machucar as mãos. Ponha peso nessa barra ou aceite ser um inseto."',
    buff: '+30% Força & +15% Agilidade (Domínio Expandido)',
    colorHex: '#c1121f',
    particleType: 'curse',
    isCustom: false
  },
  {
    id: 'todo',
    name: 'Aoi Todo',
    universe: 'Jujutsu Kaisen',
    category: 'anime',
    archetype: 'effort',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-todo',
    avatar: 'todo.webp',
    // A cena original ja vem com dominante rosa/amarela muito forte, entao o
    // preset "Anime" padrao (saturate 1.85) estourava tudo em magenta neon.
    // Aqui o caminho e o inverso: DESSATURAR e subir contraste pra recuperar
    // o rosto. Calibrado lado a lado contra 3 alternativas.
    filterCSS: 'contrast(1.35) saturate(0.7) brightness(0.92)',
    quote: '"Eu não odeio quem é fraco. Odeio quem é fraco e não faz nada pra mudar isso. Ah, e qual é o seu tipo? De treino, eu digo."',
    buff: '+20% Força & +15% Resistência (Controle Absoluto)',
    colorHex: '#7209b7',
    particleType: 'impact',
    isCustom: false
  },
  // ══════════════ SPY X FAMILY ══════════════
  {
    id: 'anya',
    name: 'Anya Forger',
    universe: 'Spy x Family',
    category: 'anime',
    archetype: 'genetics',
    primaryStat: 'foc',
    levelReq: 1,
    theme: 'theme-anya',
    avatar: 'anya.webp',
    // Calibrado lado a lado contra a arte real: o preset "Anime" padrao
    // escurecia demais o rosto dela contra o fundo escuro da academia.
    filterCSS: 'contrast(1.25) saturate(1.45) brightness(0.98)',
    quote: '"Anya sabe... Anya sabe que você pode treinar mais! Waku waku!!"',
    buff: '+15% Foco & +10% Agilidade (Telepatia)',
    colorHex: '#ff6fb0',
    particleType: 'sparkle',
    isCustom: false
  }
];

// ─────────────────────────────────────────────────────────────
// TOM DE VOZ DO APP — 3 modos escolhidos pelo usuário em Ajustes.
//
//   faithful → cada mentor fala com referências do próprio universo
//   brutal   → tom único de superioridade/deboche (Sukuna, Vegeta, Escanor)
//   buddy    → tom único acolhedor, sem cobrança de culpa
//
// Regra de escrita do "faithful": se der pra trocar o nome do mentor e a
// frase continuar fazendo sentido, ela está genérica demais — reescreva
// com um gancho que só existe naquele anime/carreira.
//
// Regra de escrita do "brutal": o insulto bate no ESFORÇO e na DESCULPA,
// nunca no corpo ou na aparência do usuário. "Preguiçoso" motiva a voltar;
// comentário sobre corpo faz desinstalar — e iniciante é justamente quem
// mais precisa aparecer no dia seguinte.
//
// Situações: reminder | workoutDone | newRecord | levelUp | comeback
// Placeholders: {exercise} {kg} {level} {days} {name}
// ─────────────────────────────────────────────────────────────
const MESSAGE_TONES = {
  faithful: { id: 'faithful', label: 'Fiel ao Personagem',
    desc: 'Cada mentor fala do jeito dele, com referências do próprio universo.' },
  brutal:   { id: 'brutal',   label: 'Ego Brutal',
    desc: 'Tom de superioridade e deboche. Nenhum elogio de graça.' },
  buddy:    { id: 'buddy',    label: 'Parceiro de Treino',
    desc: 'Tom amigável. Comemora junto e não cobra culpa quando você falha.' }
};

const MENTOR_VOICE_LINES = {
  goku: {
    reminder: 'Ei! Já tá na hora! Eu treinei a 100x a gravidade hoje — vem, quero ver do que você é capaz!',
    workoutDone: 'Uhul, isso foi divertido! Mas eu sei que você ainda tem mais. Amanhã a gente aumenta a gravidade!',
    newRecord: 'Uau, {exercise} com {kg}kg! Tá ficando forte de verdade — isso me deixa animado!',
    levelUp: 'Nível {level}! Sabe o que isso significa? Que agora eu posso treinar sério com você!',
    comeback: 'Você sumiu {days} dias! Tudo bem, o Mestre Kame também dava folga. Mas agora bora, tô ansioso!'
  },
  brolyz: {
    reminder: 'O ferro te chama. E eu... eu sou o diabo que veio te buscar.',
    workoutDone: 'Terminou? HAHAHA! Isso não foi treino. Isso foi aquecimento.',
    newRecord: '{kg}kg no {exercise}. ESMAGUE. Esmague até não sobrar nada. KAKAROT!',
    levelUp: 'Nível {level}. Seu poder cresce... mas ainda é uma fagulha diante do Lendário.',
    comeback: '{days} dias fugindo. Todos fogem. Volte pro ferro antes que eu perca a paciência.'
  },
  rocklee: {
    reminder: 'Você não tem talento? Ótimo — eu não sei usar nem ninjutsu. Só sei treinar. Levanta!',
    workoutDone: 'Terminou? Então tira as caneleiras de peso. Agora sente o quanto você ficou mais rápido!',
    newRecord: '{kg}kg no {exercise}! Isso é o Portão da Abertura cedendo. Faltam sete!',
    levelUp: 'Nível {level}! Guy-sensei estaria orgulhoso! Mas não relaxe, ou são 500 voltas na academia!',
    comeback: 'Faltou {days} dias? Então são 200 flexões de penitência. Eu faria 500. Começa agora!'
  },
  saitama: {
    reminder: 'Ah, hora do treino. 100 flexões, 100 abdominais, 100 agachamentos, 10km. Todo dia. Sem desculpa.',
    workoutDone: 'Ok. Terminou. Amanhã de novo. E depois de amanhã. É só isso mesmo.',
    newRecord: '{kg}kg no {exercise}? Legal. Continua fazendo todo dia por 3 anos e a gente conversa.',
    levelUp: 'Nível {level}. Eu fiquei careca no processo. Você foi avisado.',
    comeback: '{days} dias parado. O problema não é ter faltado — é que a rotina só funciona se for TODO dia.'
  },
  bebezinho: {
    reminder: 'WAKE WAKE! Abre o olho, big! Hoje é ALL DAY, bora pro ferro!',
    workoutDone: 'É ISSO, NEGUIN! Fechou o treino! Freaky Season não para nunca!',
    newRecord: '{kg}kg no {exercise}! Tá ficando FREAKY, big! Aí sim!',
    levelUp: 'Nível {level}! Cresceu, neguin! All day, todo dia — é assim que vira monstro!',
    comeback: 'Sumiu {days} dias, big? Relaxa. Wake wake e bora — o importante é voltar!'
  },
  ramondino: {
    reminder: 'Acorda pro treino, irmão! Não tem segredo: é aparecer todo dia.',
    workoutDone: 'Fechou, irmão! Treino batido é treino batido. Agora come limpo pra render.',
    newRecord: '{kg}kg no {exercise}! Ó o peso subindo certinho, irmão. É assim que constrói.',
    levelUp: 'Nível {level}! Eu saí do Acre pro Olympia batendo peso certinho todo dia. Continua!',
    comeback: '{days} dias fora, irmão? Acontece. Bora voltar hoje mesmo, não deixa pra amanhã.'
  },
  arnold: {
    reminder: 'Chegou a hora. Eu treinava 5 horas por dia no Gold’s Gym. Você consegue dar uma. Vamos!',
    workoutDone: 'Sentiu o pump? Não existe sensação melhor. Eu voltarei amanhã — e você também.',
    newRecord: '{kg}kg no {exercise}! É disso que eu falo. A última repetição é a única que conta.',
    levelUp: 'Nível {level}! Sete títulos de Mr. Olympia não vieram de sorte. Vieram de repetição.',
    comeback: '{days} dias fora? Eu disse que voltaria. Você voltou também. Agora pega o ferro.'
  },
  nickwalker: {
    reminder: 'Hora de treinar. Intensidade bizarra, ou nem apareça.',
    workoutDone: 'Treino fechado. Mas se você não tá tremendo, dava pra ter feito mais.',
    newRecord: '{kg}kg no {exercise}! Progressão de carga é o único caminho. Mutante!',
    levelUp: 'Nível {level}. Mutação em progresso. Não desacelera agora.',
    comeback: '{days} dias sumido. O mutante não descansa. Volta e recupera o tempo perdido.'
  },
  jin: {
    reminder: 'Bora treinar, gente linda! Se eu aguentei o exército, você aguenta uma hora de academia!',
    workoutDone: 'Terminou! E ainda continua bonito. Impressionante, né? Brincadeira... ou não!',
    newRecord: '{kg}kg no {exercise}! Agora é Worldwide Handsome E worldwide forte!',
    levelUp: 'Nível {level}! Como o mais velho aqui, eu autorizo oficialmente você a se orgulhar!',
    comeback: '{days} dias sem aparecer? Tudo bem, eu também já quis dormir até tarde. Bora recomeçar juntos!'
  },
  namjoon: {
    reminder: 'Hora do treino. Hoje não é sobre motivação — é sobre o compromisso que você assumiu ontem.',
    workoutDone: 'Treino concluído. Você não ficou só mais forte: ficou mais coerente com quem quer ser.',
    newRecord: '{kg}kg no {exercise}. Progresso é a prova física de que disciplina funciona.',
    levelUp: 'Nível {level}. Ame a si mesmo o suficiente pra continuar — não pra parar por aqui.',
    comeback: '{days} dias. Você não falhou, só pausou. Recomeçar também é uma forma de liderança.'
  },
  sukuna: {
    reminder: 'O ferro te espera. Não me faça descer até aí, verme.',
    workoutDone: 'Acabou. Não espere elogio por fazer o mínimo.',
    newRecord: '{kg}kg no {exercise}. Finalmente parou de acariciar o ferro.',
    levelUp: 'Nível {level}. Ficou menos patético. Orgulhe-se: você é forte. Para um inseto.',
    comeback: '{days} dias. Você fugiu como o verme que é. Ajoelhe-se e recomece.'
  },
  anya: {
    reminder: 'Anya sabe... Anya leu sua mente e viu que hoje é dia de treino! Waku waku!! Vai, ou pode começar a GUERRA!',
    workoutDone: 'Anya viu tudo escondida atrás do sofá — treino completo! Isso merece uma Estrela Stella! E amendoim 🥜',
    newRecord: '{kg}kg no {exercise}?! Anya wa tensai treinadora! Isso é papel de espiã nível S!',
    levelUp: 'Nível {level}! Chichi ficaria orgulhoso. Anya vai contar pro Bondman hoje à noite!',
    comeback: '{days} dias sumido... Anya quase chorou! Isso quase causou GUERRA. Volta, ou os Tonitrus Bolts vão cair!'
  },
  todo: {
    reminder: 'Controle. É disso que se trata: bater o ponto todo dia, sem desculpa. Bora, aplauda esse treino.',
    workoutDone: 'Aplaudo isso. De verdade — *bate palmas*. Agora me diz: qual é o seu tipo? De disciplina, eu digo.',
    newRecord: '{kg}kg no {exercise}?! ISSO! Não é estranho comemorar assim — meu melhor amigo faria igual.',
    levelUp: 'Nível {level}. Eu não odeio quem é fraco. Odeio quem é fraco e não tenta. Você tentou. Suba mais um degrau.',
    comeback: '{days} dias sumido, hein? Fraco é normal. Fraco que não volta pra tentar de novo, isso eu não perdoo.'
  }
};

const TONE_LINES = {
  brutal: {
    reminder: [
      'Chegou a hora. Ou você vai fingir de novo que "não deu tempo"? Patético. Levanta.',
      'O ferro está lá. Parado. Esperando alguém com coragem. Vai ser você hoje, ou continua sendo ninguém?',
      'Outro dia, outra chance de provar que você não é só conversa. Duvido.'
    ],
    workoutDone: [
      'Terminou. Não confunda cumprir obrigação com mérito. Ninguém aqui vai te aplaudir.',
      'Acabou. Fez o mínimo aceitável. Não se atreva a achar que foi impressionante.',
      'Pronto. Agora você está exatamente onde já deveria estar desde o começo. Nada demais.'
    ],
    newRecord: [
      '{kg}kg no {exercise}. Demorou tempo demais pra algo tão insignificante. Mas enfim parou de brincar.',
      '{kg}kg no {exercise}. Finalmente. Estava na hora de parar de acariciar o ferro.',
      '{exercise}: {kg}kg. Melhorou. Continua fraco, mas melhorou.'
    ],
    levelUp: [
      'Nível {level}. Você continua sendo lixo — só que um lixo levemente menos patético que ontem.',
      'Nível {level}. Não comemore. Isso só prova o quão baixo você começou.',
      'Nível {level}. Um degrau. Faltam mil. Anda.'
    ],
    comeback: [
      '{days} dias sumido. Você é exatamente o tipo que desiste. Provou que eu estava certo. Recomeça — se tiver coragem.',
      '{days} dias. Sua sequência morreu e ninguém sentiu falta. Senta e faz.',
      'Voltou depois de {days} dias. Que patético. Da próxima vez, aguenta.'
    ]
  },
  buddy: {
    reminder: [
      'Oi! Chegou a hora do seu treino 💪 Bora juntos — nem que hoje seja um treino leve.',
      'Passando pra lembrar do treino de hoje! Você consegue, um passo de cada vez 🙌',
      'Hora de se mexer! Lembra: treino feito é sempre melhor que treino perfeito ✨'
    ],
    workoutDone: [
      'Treino concluído! Orgulho de você por ter aparecido hoje 🙌',
      'Isso aí! Mais um treino na conta. Seu eu do futuro agradece 💛',
      'Fechou o treino! Aproveita pra alongar e beber água. Você merece ✨'
    ],
    newRecord: [
      'Olha isso! {kg}kg no {exercise}. Você tá evoluindo de verdade 🎉',
      'Novo recorde no {exercise}: {kg}kg! Tá vendo? O esforço aparece 💪',
      '{kg}kg no {exercise}! Semana passada isso parecia difícil. Olha você agora 🌟'
    ],
    levelUp: [
      'Nível {level}! Cada treino te trouxe até aqui. Bora pro próximo 💛',
      'Subiu pro nível {level}! Isso é constância, não sorte 🎉',
      'Nível {level} desbloqueado! Tô muito feliz por você ✨'
    ],
    comeback: [
      'Que bom te ver de volta! Faltar acontece — o que importa é que você voltou. Recomeçamos juntos 🌱',
      'Oi de novo! {days} dias não apagam o que você já construiu. Bora retomar com calma 💛',
      'Voltou! Sem culpa, tá? Hoje a gente recomeça e está tudo certo 🌱'
    ]
  }
};

// Falas ambiente pra quando o usuário toca no mentor no Painel só pra ver
// uma frase nova (sem evento específico por trás — level up, recorde etc.
// já são cobertos pelas situações acima). Só existe pros tons brutal/buddy;
// o tom "fiel" reaproveita reminder/workoutDone de MENTOR_VOICE_LINES, que
// já são fiéis ao personagem e não têm placeholder, em getMentorIdleQuote().
TONE_LINES.brutal.idle = [
  'Parado lendo. O ferro não levanta sozinho.',
  'Cada segundo olhando pra tela é um segundo que você não tá progredindo.',
  'Ainda tá aqui? Vai treinar.'
];
TONE_LINES.buddy.idle = [
  'Oi! Como você tá hoje? Lembra de beber água 💛',
  'Só passando pra desejar um ótimo treino, sem pressão ✨',
  'Você já chegou até aqui — isso já conta muito 🌱'
];

// Fala aleatória pro balão do mentor no Painel (clique manual, sem evento
// específico). Fiel: reaproveita reminder/workoutDone de MENTOR_VOICE_LINES
// (já fiéis, sem placeholder). Outros tons: pool 'idle' dedicado acima.
function getMentorIdleQuote() {
  let tone = state.messageTone || 'faithful';
  if (state.appMode === 'simple' && tone === 'faithful') tone = 'buddy';

  if (tone === 'faithful') {
    const lines = MENTOR_VOICE_LINES[state.activeMentor];
    if (lines) {
      const pool = [lines.reminder, lines.workoutDone].filter(Boolean);
      if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  const pool = (TONE_LINES[tone] || TONE_LINES.buddy).idle || [];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
}

// Devolve a fala certa para a situação, já com os placeholders trocados.
// Cai no tom "buddy" se o mentor ativo não tiver linha própria (ex.: mentor
// personalizado criado pelo usuário).
function resolveVoiceLine(situation, vars) {
  vars = vars || {};
  let tone = state.messageTone || 'faithful';
  // Modo Simples não mostra mentor em lugar nenhum — "Fiel" não faz sentido lá.
  if (state.appMode === 'simple' && tone === 'faithful') tone = 'buddy';

  let line = '';
  if (tone === 'faithful') {
    line = (MENTOR_VOICE_LINES[state.activeMentor] || {})[situation] || '';
  }
  if (!line) {
    const pool = (TONE_LINES[tone] || TONE_LINES.buddy)[situation] || [];
    if (pool.length) line = pool[Math.floor(Math.random() * pool.length)];
  }
  if (!line) return '';
  return line.replace(/\{(\w+)\}/g, (full, key) => (vars[key] !== undefined ? vars[key] : full));
}

// 2b. MENTOR REWARDS — Sistema de progressão de Nível 1 ao 30
// ─────────────────────────────────────────────────────────────
// TIER SYSTEM:
//   Nv 1-5   → APRENDIZ  (hook rápido, recompensas visuais básicas)
//   Nv 6-10  → DISCÍPULO (funcionalidades, áudio, protocolo de dieta)
//   Nv 11-15 → GUERREIRO (buffs de atributo, missão exclusiva)
//   Nv 16-20 → VETERANO  (transformações visuais avançadas)
//   Nv 21-25 → ELITE     (raros, title + aura especial)
//   Nv 26-30 → LENDA     (masterização, conteúdo eterno)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SISTEMA DE TEMPLATE DE RECOMPENSAS — escala para infinitos mentores
// ─────────────────────────────────────────────────────────────
// Os mentores de hoje são uma "beta". O plano é adicionar MUITOS mais,
// filtrados por anime/universo. Para que todo mentor novo nasça com a
// MESMA estrutura de progressão (23 marcos, do nível 2 ao 30), em vez
// de escrever na mão um array de 20+ linhas por mentor, preenchemos
// um pequeno objeto de "config" e o gerador monta o resto.
//
// COMO ADICIONAR UM MENTOR #9 (ou #50):
//   1. Adicione o mentor em OFFICIAL_MENTORS (id, name, universe, etc.)
//   2. Adicione uma entrada em MENTOR_REWARD_CONFIGS com o mesmo id,
//      preenchendo só as 8 partes realmente exclusivas dele:
//      colorLabel, particleLabel, primaryStat, secondaryStat,
//      tier1 (item nv5), tier2 (efeito nv10), mission (nv13),
//      tier4 (efeito nv20), leaderboardTitle (nv22), finalTitle (nv25),
//      easterDesc (nv29). Tudo o resto (nv 2,3,4,7,8,9,12,14,15,17,
//      18,19,23,27,28,30) é gerado automaticamente com o nome e a cor
//      do mentor — ninguém fica com progressão mais curta que outro.
//   3. generateMentorRewards() roda para todos e popula MENTOR_REWARDS.
// ─────────────────────────────────────────────────────────────
const ATTR_LABELS = { for: 'Força', res: 'Resistência', agi: 'Agilidade', vig: 'Vigor', foc: 'Foco' };
const ATTR_CODES  = { for: 'FOR',   res: 'RES',          agi: 'AGI',      vig: 'VIG',   foc: 'FOC'  };

function generateMentorRewards(cfg) {
  const sc = cfg.shortcode;
  const p = cfg.primaryStat, s = cfg.secondaryStat;
  const pL = ATTR_LABELS[p], sL = ATTR_LABELS[s];
  const pC = ATTR_CODES[p], sC = ATTR_CODES[s];
  const name = cfg.name;
  const t5 = cfg.tier5Sound || {
    type: 'sound', value: `${sc}elite`, icon: '🎵',
    name: `Trilha de Elite de ${name}`,
    desc: `Trilha sonora ambiente exclusiva durante treinos com ${name} ativo.`
  };

  return [
    // ── APRENDIZ (nv 1-5) ──
    { lvl: 2, id: `m_${sc}_2`, type: 'css_class', value: `has-men-${sc}2`, icon: '🎨',
      name: `Tema ${cfg.colorLabel} Ativado`,
      desc: `O visual ${cfg.colorLabel.toLowerCase()} de ${name} domina o tema do app!` },
    { lvl: 3, id: `m_${sc}_3`, type: 'xpbonus', value: 'xp+3', icon: '⚡',
      name: '+3% XP nos treinos',
      desc: `A energia de ${name} aumenta o XP de todos os seus treinos.` },
    { lvl: 4, id: `m_${sc}_4`, type: 'css_class', value: `has-men-${sc}4`, icon: '✨',
      name: 'Borda animada no card',
      desc: `Borda ${cfg.colorLabel.toLowerCase()} néon animada aparece no card de ${name} na lista de mentores.` },
    { lvl: 5, id: `m_${sc}_5`, type: cfg.tier1.type, value: cfg.tier1.value, icon: cfg.tier1.icon,
      name: `⭐ DISCÍPULO — ${cfg.tier1.name}`,
      desc: `Milestone! ${cfg.tier1.desc}` },

    // ── DISCÍPULO (nv 6-10) ──
    { lvl: 7, id: `m_${sc}_7`, type: 'xpbonus', value: 'xp+5', icon: '⚡',
      name: '+5% XP global',
      desc: `+5% XP em todos os treinos com ${name} ativo.` },
    { lvl: 8, id: `m_${sc}_8`, type: 'content', value: `diet_${sc}`, icon: '🥗',
      name: `Protocolo Nutricional de ${name}`,
      desc: `Plano de dieta específico de ${name} desbloqueado.` },
    { lvl: 9, id: `m_${sc}_9`, type: 'css_class', value: `has-men-${sc}9`, icon: '🌟',
      name: `Partículas de ${cfg.particleLabel}`,
      desc: `${cfg.particleLabel} flutuam no background do app quando ${name} estiver ativo.` },
    { lvl: 10, id: `m_${sc}_10`, type: cfg.tier2.type, value: cfg.tier2.value, icon: cfg.tier2.icon,
      name: `⭐ GUERREIRO — ${cfg.tier2.name}`,
      desc: `Milestone! ${cfg.tier2.desc}` },

    // ── GUERREIRO (nv 11-15) ──
    { lvl: 12, id: `m_${sc}_12`, type: 'buff', value: `${p}+3`, icon: '💪',
      name: `+3 ${pC} Permanente`,
      desc: `+3 pontos permanentes de ${pL} concedidos por ${name}.` },
    { lvl: 13, id: `m_${sc}_13`, type: 'mission', value: `mission_${sc}`, icon: '🎯',
      name: `Desafio Semanal: ${cfg.mission.name}`,
      desc: cfg.mission.desc },
    { lvl: 14, id: `m_${sc}_14`, type: 'css_class', value: `has-men-${sc}14`, icon: '💥',
      name: `Screen-shake personalizado de ${name}`,
      desc: `Ao finalizar treino, o screen-shake ganha o estilo de ${name}.` },
    { lvl: 15, id: `m_${sc}_15`, type: 'buff', value: `${p}+5`, icon: '💪',
      name: `⭐ VETERANO — +5 ${pC} + Fundo Especial`,
      desc: `Milestone! +5 ${pL} acumulado e fundo animado especial de ${name}.` },

    // ── VETERANO (nv 16-20) ──
    { lvl: 17, id: `m_${sc}_17`, type: 'buff', value: `${p}+5|${s}+3`, icon: '🌀',
      name: `+5 ${pC} + +3 ${sC} Permanentes`,
      desc: `${pL} e ${sL} evoluindo ao mesmo tempo, concedidos por ${name}.` },
    { lvl: 18, id: `m_${sc}_18`, type: 'content', value: `diet_${sc}_adv`, icon: '🥗',
      name: `Protocolo Avançado de ${name}`,
      desc: `Guia avançado de recuperação e nutrição no estilo de ${name}.` },
    { lvl: 19, id: `m_${sc}_19`, type: 'css_class', value: `has-men-${sc}19`, icon: '🎬',
      name: 'Animação cinemática ao treinar',
      desc: `Nova cutscene animada ao concluir treino com ${name} ativo.` },
    { lvl: 20, id: `m_${sc}_20`, type: cfg.tier4.type, value: cfg.tier4.value, icon: cfg.tier4.icon,
      name: `⭐ ELITE — ${cfg.tier4.name}`,
      desc: `Milestone! ${cfg.tier4.desc}` },

    // ── ELITE (nv 21-25) ──
    { lvl: 22, id: `m_${sc}_22`, type: 'css_class', value: `has-men-${sc}22`, icon: '🏆',
      name: 'Título no Leaderboard Global',
      desc: `Posição especial no ranking global: "${cfg.leaderboardTitle}". Poucos chegam aqui.` },
    { lvl: 23, id: `m_${sc}_23`, type: t5.type, value: t5.value, icon: t5.icon,
      name: t5.name,
      desc: t5.desc },
    { lvl: 25, id: `m_${sc}_25`, type: 'css_class', value: `has-men-${sc}25`, icon: '👑',
      name: `⭐ LENDA — "${cfg.finalTitle}"`,
      desc: `Milestone Lendário! Aura máxima de ${name}. Título ${cfg.finalTitle} desbloqueado para sempre.` },

    // ── LENDA (nv 26-30) ──
    { lvl: 27, id: `m_${sc}_27`, type: 'content', value: `quotes_${sc}_pers`, icon: '💬',
      name: 'Frases que referenciam seu progresso',
      desc: `${name} passa a citar seu histórico de treinos nas frases do dashboard!` },
    { lvl: 28, id: `m_${sc}_28`, type: 'css_class', value: `has-men-${sc}28`, icon: '🌅',
      name: `${name} na splash screen`,
      desc: `${name} aparece na tela de abertura do app como guardião do seu progresso.` },
    { lvl: 29, id: `m_${sc}_29`, type: 'easter', value: `easter_${sc}`, icon: '🥚',
      name: `Easter Egg Secreto de ${name}`,
      desc: cfg.easterDesc },
    { lvl: 30, id: `m_${sc}_30`, type: 'css_class', value: `has-men-${sc}30`, icon: '👑',
      name: `⭐ ETERNO — ${cfg.shortName} MASTERIZADO`,
      desc: `ETERNO! ${name} masterizado. UI com tema especial e Hall da Fama desbloqueado.` },
  ];
}

// ─────────────────────────────────────────────────────────────
// CONFIGS POR MENTOR — só as partes exclusivas de cada um.
// Todo o resto da progressão é gerado por generateMentorRewards().
// PARA ADICIONAR UM MENTOR NOVO: copie um bloco e troque os valores.
// ─────────────────────────────────────────────────────────────
const MENTOR_REWARD_CONFIGS = {
  rocklee: {
    shortcode: 'lee', shortName: 'Lee', name: 'Rock Lee', colorLabel: 'Verde', particleLabel: 'Folhas de Konoha',
    primaryStat: 'agi', secondaryStat: 'vig',
    tier1: { type: 'css_class', value: 'has-item-faixa', icon: '🟢', name: 'Faixa do Rock Lee',
      desc: 'Borda verde néon equipada no avatar. A faixa do trabalho duro foi conquistada!' },
    tier2: { type: 'sound', value: 'ninja', icon: '🥷', name: 'Som Ninja ao treinar',
      desc: 'Som ninja exclusivo ao finalizar treino. A aura neon pulsa no card.' },
    mission: { name: '1000 Repetições', desc: 'Missão especial recorrente: 1000 repetições de qualquer exercício na semana. XP massivo!' },
    tier4: { type: 'css_class', value: 'has-men-lee20', icon: '🔴', name: 'Faixa Vermelha + Badge Dourado',
      desc: 'Faixa vermelha de elite equipada. Badge dourado no perfil.' },
    tier5Sound: { type: 'sound', value: 'ninjaelite', icon: '🎵', name: 'Trilha Shinobi de Elite',
      desc: 'Trilha sonora ambiente exclusiva durante treinos com o Rock Lee ativo.' },
    leaderboardTitle: 'Elite Shinobi', finalTitle: 'SHINOBI SUPREMO',
    easterDesc: 'Um segredo escondido do Rock Lee foi revelado... Algo muito especial te espera!'
  },
  goku: {
    shortcode: 'gok', shortName: 'Goku', name: 'Son Goku', colorLabel: 'Laranja SSJ', particleLabel: 'Ki dourado',
    primaryStat: 'for', secondaryStat: 'foc',
    tier1: { type: 'css_class', value: 'has-item-aura', icon: '⚡', name: 'Aura SSJ Dourada',
      desc: 'Aura Super Saiyajin dourada ao redor do seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'kicharge', icon: '🔋', name: 'Som de Ki Charge',
      desc: 'Som de carregamento de Ki ao subir de nível. Aura neon pulsante no card.' },
    mission: { name: 'Treino Gravidade 100x', desc: 'Missão recorrente: Complete um treino com 100% das séries. XP massivo de Saiyajin!' },
    tier4: { type: 'css_class', value: 'has-men-gok20', icon: '✨', name: 'Aura SSJ Suprema + Badge',
      desc: 'Aura dourada suprema pulsando em máxima potência. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Saiyajin', finalTitle: 'PODER SAIYAJIN',
    easterDesc: 'Uma fruta do poder Saiyajin foi encontrada escondida no seu inventário. Goku ficaria orgulhoso!'
  },
  brolyz: {
    shortcode: 'bro', shortName: 'Broly', name: 'Broly (Saga Z)', colorLabel: 'Verde Lendário', particleLabel: 'Energia verde colossal',
    primaryStat: 'for', secondaryStat: 'res',
    tier1: { type: 'css_class', value: 'has-item-aurabroly', icon: '🐉', name: 'Aura Lendária Verde',
      desc: 'Aura verde néon lendária de Broly ao redor do avatar de perfil!' },
    tier2: { type: 'sound', value: 'brolyki', icon: '💥', name: 'Explosão de Ki Lendária',
      desc: 'Explosão de Ki do Broly ao finalizar treino. Neon máximo no card.' },
    mission: { name: 'Poder Supremo', desc: 'Missão semanal: supere seu PR em pelo menos 3 exercícios. XP de Saiyajin Lendário!' },
    tier4: { type: 'css_class', value: 'has-men-bro20', icon: '🌿', name: 'Partículas Lendárias + Badge',
      desc: 'Partículas verdes lendárias em tudo e badge de elite no perfil.' },
    leaderboardTitle: 'Elite Lendário', finalTitle: 'LENDÁRIO INVENCÍVEL',
    easterDesc: 'Um fragmento de Ki ancestral de Broly pulsa em segredo no seu perfil. O poder lendário desperta!'
  },
  saitama: {
    shortcode: 'sai', shortName: 'Saitama', name: 'Saitama', colorLabel: 'Vermelho', particleLabel: 'Ondas de impacto',
    primaryStat: 'res', secondaryStat: 'agi',
    tier1: { type: 'css_class', value: 'has-item-capa', icon: '🦸', name: 'Capa do Saitama',
      desc: 'A capa branca lendária flutua atrás do avatar de perfil!' },
    tier2: { type: 'sound', value: 'ok', icon: '😐', name: '"OK" do Saitama',
      desc: 'O famoso OK do Saitama ao completar quests. Neon vermelho máximo.' },
    mission: { name: 'Rotina do Saitama', desc: '100 flexões + 100 agachamentos + 10km de corrida. Missão semanal épica!' },
    tier4: { type: 'css_class', value: 'has-men-sai20', icon: '⬜', name: 'Layout Cinza + Badge',
      desc: 'Layout minimalista cinza especial e badge dourado no perfil.' },
    leaderboardTitle: 'Elite Classe S', finalTitle: 'UM SOCO APENAS',
    easterDesc: 'Um cupom secreto de desconto na loja de heróis foi encontrado. Saitama aprovaria a economia!'
  },
  bebezinho: {
    shortcode: 'beb', shortName: 'Bebezinho', name: 'Gabriel Ganley "Bebezinho"', colorLabel: 'Roxo Tributo', particleLabel: 'Faíscas douradas',
    primaryStat: 'foc', secondaryStat: 'for',
    tier1: { type: 'sound', value: 'wakewake', icon: '🕊️', name: 'Som "Wake Wake!"',
      desc: 'Som especial do Bebezinho ao completar treino. Tributo sonoro!' },
    tier2: { type: 'css_class', value: 'has-men-beb10', icon: '✨', name: 'Partículas Tributo',
      desc: 'Faíscas douradas visíveis em todo o app. Homenagem máxima.' },
    mission: { name: 'All Day Challenge', desc: 'Missão semanal: 7 dias seguidos batendo a meta de água e proteína. XP tributo!' },
    tier4: { type: 'css_class', value: 'has-men-beb20', icon: '💜', name: 'Tema Lendário Tributo',
      desc: 'Header roxo/dourado máximo em homenagem ao Bebezinho. Badge tributo.' },
    leaderboardTitle: 'Elite Wake Wake', finalTitle: 'WAKE WAKE MASTER',
    easterDesc: 'Uma frase inédita do Bebezinho foi resgatada dos bastidores. Wake wake, para sempre!'
  },
  ramondino: {
    shortcode: 'ram', shortName: 'Ramon', name: 'Ramon Dino', colorLabel: 'Azul Oceano', particleLabel: 'Ondas oceânicas',
    primaryStat: 'vig', secondaryStat: 'for',
    tier1: { type: 'css_class', value: 'has-item-borda-azul', icon: '💙', name: 'Borda Azul Neon',
      desc: 'Borda azul/cyan néon ao redor do avatar. Estilo Ramon Dino!' },
    tier2: { type: 'sound', value: 'acorda', icon: '🇧🇷', name: '"Acorda pro Treino!"',
      desc: 'Som motivacional do Ramon ao iniciar treino. Neon azul máximo!' },
    mission: { name: 'Treino Braço Pesado', desc: 'Missão semanal do Ramon: 3 treinos de braço com carga máxima. XP explosivo!' },
    tier4: { type: 'css_class', value: 'has-men-ram20', icon: '🌊', name: 'Gradiente Oceano Máximo',
      desc: 'Gradiente azul oceano em toda a UI. Representação brasileira de elite!' },
    leaderboardTitle: 'Elite Acreano', finalTitle: 'CAMPEÃO BR',
    easterDesc: 'Uma receita secreta de frango com batata-doce do Ramon foi desbloqueada no seu caderno!'
  },
  arnold: {
    shortcode: 'arn', shortName: 'Arnold', name: 'Arnold S.', colorLabel: 'Dourado', particleLabel: 'Brilho dourado cinematográfico',
    primaryStat: 'for', secondaryStat: 'vig',
    tier1: { type: 'css_class', value: 'has-men-arn5', icon: '🏆', name: 'Badge Mr. Olympia',
      desc: 'Badge dourado de Mr. Olympia aparece ao lado do seu nome no perfil!' },
    tier2: { type: 'css_class', value: 'has-item-cinturo', icon: '🥇', name: 'Cinturão de Ouro',
      desc: 'O cinturão de ouro do Arnold equipado nos cards do status. Lenda!' },
    mission: { name: 'Pump Machine', desc: 'Missão semanal do Arnold: 5 exercícios de peito e braço com pump máximo!' },
    tier4: { type: 'sound', value: 'illbeback', icon: '🎬', name: 'Som Épico Arnold + Badge',
      desc: 'Som épico do Arnold ao finalizar treino e badge dourado no perfil.' },
    leaderboardTitle: 'Elite Golden Era', finalTitle: 'O GOVERNADOR',
    easterDesc: 'Uma foto rara da Golden Era de Arnold foi encontrada no arquivo secreto do app!'
  },
  nickwalker: {
    shortcode: 'nic', shortName: 'Nick Walker', name: 'Nick Walker "The Mutant"', colorLabel: 'Laranja Mutante', particleLabel: 'Chamas laranjas mutantes',
    primaryStat: 'for', secondaryStat: 'res',
    tier1: { type: 'css_class', value: 'has-men-nic5', icon: '🍊', name: 'Borda Laranja Mutante',
      desc: 'Borda laranja néon ao redor do avatar no estilo Nick Walker!' },
    tier2: { type: 'sound', value: 'freaky', icon: '🗣️', name: 'Som Mutante Bizarro',
      desc: 'Som de mutação ao finalizar treinos. Neon laranja máximo!' },
    mission: { name: 'Intensidade Bizarra', desc: 'Missão semanal: 3 treinos com 100% das séries em RPE "FREAKY". XP absurdo!' },
    tier4: { type: 'css_class', value: 'has-men-nic20', icon: '✨', name: 'Glow Mutante Extremo',
      desc: 'Visual com glow laranja pulsante em toda a UI. Badge de elite.' },
    leaderboardTitle: 'Elite Mutante', finalTitle: 'MUTANTE SUPREMO',
    easterDesc: 'Um vídeo raro de bastidores do treino mutante de Nick Walker foi desbloqueado!'
  },
  jin: {
    shortcode: 'jin', shortName: 'Jin', name: 'Jin "Worldwide Handsome"', colorLabel: 'Rosa Elegante', particleLabel: 'Brilho charmoso',
    primaryStat: 'vig', secondaryStat: 'for',
    tier1: { type: 'css_class', value: 'has-item-jin', icon: '💪', name: 'Sorriso Worldwide Handsome',
      desc: 'Um brilho charmoso e confiante contorna seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'worldwidehandsome', icon: '🎤', name: 'Risada Icônica',
      desc: 'A risada icônica do Jin ao completar quests. Brilho rosa no card.' },
    mission: { name: 'Disciplina de Sargento', desc: 'Missão semanal: complete todos os treinos da semana sem faltar um dia. Disciplina de quem passou pelo serviço militar!' },
    tier4: { type: 'css_class', value: 'has-men-jin20', icon: '✨', name: 'Aura Worldwide + Badge',
      desc: 'Brilho rosa elegante pulsando em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Worldwide', finalTitle: 'MUNDIALMENTE BONITO',
    easterDesc: 'Uma piada de pescaria do Jin foi resgatada dos bastidores — ele diria que essa foi a maior conquista de todas!'
  },
  namjoon: {
    shortcode: 'nam', shortName: 'RM', name: 'RM "Namjoon"', colorLabel: 'Índigo Reflexivo', particleLabel: 'Brilho contemplativo',
    primaryStat: 'foc', secondaryStat: 'vig',
    tier1: { type: 'css_class', value: 'has-item-namjoon', icon: '📖', name: 'Aura do Líder',
      desc: 'Uma aura índigo serena e ponderada envolve seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'selflove', icon: '🎤', name: 'Discurso Motivacional',
      desc: 'Uma frase de reflexão do RM ao completar quests. Brilho índigo no card.' },
    mission: { name: 'Corpo e Mente', desc: 'Missão semanal: registre uma reflexão e bata sua meta de água por 5 dias seguidos — equilíbrio entre corpo e mente.' },
    tier4: { type: 'css_class', value: 'has-men-nam20', icon: '✨', name: 'Aura do Líder Suprema + Badge',
      desc: 'Brilho índigo máximo pulsando em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Líder', finalTitle: 'LÍDER ETERNO',
    easterDesc: 'Uma citação inédita e filosófica do RM foi resgatada dos bastidores — puro autoconhecimento.'
  },
  sukuna: {
    shortcode: 'suk', shortName: 'Sukuna', name: 'Ryomen Sukuna', colorLabel: 'Vermelho Amaldiçoado', particleLabel: 'Energia amaldiçoada',
    primaryStat: 'for', secondaryStat: 'agi',
    tier1: { type: 'css_class', value: 'has-men-suk5', icon: '💀', name: 'Marca Amaldiçoada',
      desc: 'Uma marca vermelha amaldiçoada surge ao redor do seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'domainexpansion', icon: '🔥', name: 'Eco do Domínio',
      desc: 'Um eco sombrio ao finalizar treino intenso. Aura vermelha máxima no card.' },
    mission: { name: 'Esmague o Limite', desc: 'Missão semanal: supere sua carga máxima em pelo menos 2 exercícios. Sem dó, sem carinho.' },
    tier4: { type: 'css_class', value: 'has-men-suk20', icon: '👹', name: 'Domínio Expandido + Badge',
      desc: 'Aura de Rei das Maldições em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Rei das Maldições', finalTitle: 'DOMÍNIO ABSOLUTO',
    easterDesc: 'Um dedo amaldiçoado foi encontrado escondido no seu inventário... melhor nem perguntar como.'
  },
  todo: {
    shortcode: 'tdo', shortName: 'Todo', name: 'Aoi Todo', colorLabel: 'Violeta Boogie Woogie', particleLabel: 'Ondas de distorção espacial',
    primaryStat: 'for', secondaryStat: 'res',
    tier1: { type: 'css_class', value: 'has-men-tdo5', icon: '👏', name: 'Sincronia Ativada',
      desc: 'Um brilho violeta pulsa ao redor do seu avatar — controle total sobre o próprio treino!' },
    tier2: { type: 'sound', value: 'boogiewoogie', icon: '🔮', name: 'Eco do Boogie Woogie',
      desc: 'Um estalo de palmas ecoa ao completar treino intenso. Aura violeta máxima no card.' },
    mission: { name: 'Qual é o Seu Tipo', desc: 'Missão semanal: treine 5 dias seguidos sem quebrar a sincronia — controle é tudo.' },
    tier4: { type: 'css_class', value: 'has-men-tdo20', icon: '🥊', name: 'Controle Absoluto + Badge',
      desc: 'Aura de combatente supremo em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Kyoto', finalTitle: 'CONTROLE ABSOLUTO',
    easterDesc: 'Um pôster meio amassado da Takada Reika foi encontrado escondido no seu inventário... melhor não comentar, ele leva a sério.'
  },
  anya: {
    shortcode: 'any', shortName: 'Anya', name: 'Anya Forger', colorLabel: 'Rosa Waku Waku', particleLabel: 'Faíscas telepáticas',
    primaryStat: 'foc', secondaryStat: 'agi',
    tier1: { type: 'css_class', value: 'has-men-any5', icon: '🧠', name: 'Telepatia Desperta',
      desc: 'Um brilho rosa contorna seu nome — a Anya está de olho nos seus pensamentos!' },
    tier2: { type: 'sound', value: 'wakuwaku', icon: '🥜', name: '"Waku Waku!" ao Completar',
      desc: 'O grito de animação da Anya toca ao completar quests. Ela AMA ver você vencer!' },
    mission: { name: 'Operação Strix', desc: 'Missão semanal: treine 5 dias sem faltar — segundo a Anya, isso evita a Terceira Guerra Mundial!' },
    tier4: { type: 'css_class', value: 'has-men-any20', icon: '🕵️', name: 'Disfarce de Espiã + Badge',
      desc: 'Tema de espionagem ativado em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Operação Strix', finalTitle: 'ANYA WA TENSAI',
    easterDesc: 'Um pacote secreto de amendoins foi encontrado escondido no seu inventário... Anya jura que não foi ela quem comeu metade.'
  },
};

// MENTOR_REWARDS é construído automaticamente a partir dos configs acima.
// Mentores novos só precisam de uma entrada em MENTOR_REWARD_CONFIGS —
// nenhuma linha extra de array precisa ser escrita à mão.
const MENTOR_REWARDS = {};
Object.keys(MENTOR_REWARD_CONFIGS).forEach(mentorId => {
  MENTOR_REWARDS[mentorId] = generateMentorRewards(MENTOR_REWARD_CONFIGS[mentorId]);
});

// 2c. EQUIPMENT DATABASE & HELPERS
const EQUIPMENT_DATABASE = [
  {
    id: 'item_faixa',
    name: 'Faixa do Rock Lee',
    slot: 'head',
    icon: 'faixa_lee_icon.webp',
    desc: 'Sua agilidade foi notada. Ganha uma borda verde neon no seu avatar.',
    stats: { agi: 5 },
    unlockDesc: 'Desbloqueia no Nível Geral 5 ou Mentor Rock Lee Nível 5.',
    equivalentIds: ['item_faixa', 'has-item-faixa']
  },
  {
    id: 'item_bracelete',
    name: 'Braceletes de Aço',
    slot: 'arms',
    icon: 'braceletes_aco_icon.webp',
    desc: 'Braceletes de metal pesados equipados ao lado do seu nome.',
    stats: { res: 5 },
    unlockDesc: 'Desbloqueia no Nível Geral 10.',
    equivalentIds: ['item_bracelete', 'has-item-bracelete']
  },
  {
    id: 'item_aura',
    name: 'Aura de Super Saiyajin',
    slot: 'aura',
    icon: 'aura_goku_icon.webp',
    desc: 'Uma aura de chamas douradas brilha ao redor do seu avatar.',
    stats: { for: 8, foc: 4 },
    unlockDesc: 'Desbloqueia no Nível Geral 20 ou Mentor Goku Nível 5.',
    equivalentIds: ['item_aura', 'has-item-aura']
  },
  {
    id: 'item_cinturão',
    name: 'Cinturão de Ouro',
    slot: 'waist',
    icon: 'cinturao_ouro_icon.webp',
    desc: 'O Cinturão de Ouro de Arnold. Confere uma borda dourada nos seus cards.',
    stats: { for: 10 },
    equivalentIds: ['item_cinturão', 'has-item-cinturo', 'has-item-cinturão'],
    unlockDesc: 'Desbloqueia no Nível Geral 30 ou Mentor Arnold Nível 10.'
  },
  {
    id: 'item_aurabroly',
    name: 'Aura Lendária de Broly Z',
    slot: 'aura',
    icon: 'aura_broly_icon.webp',
    desc: 'Uma aura colossal de chamas verde néon brilha no seu avatar.',
    stats: { for: 12, res: 6 },
    unlockDesc: 'Desbloqueia no Nível Geral 40 ou Mentor Broly Nível 5.',
    equivalentIds: ['item_aurabroly', 'has-item-aurabroly']
  },
  {
    id: 'item_capa',
    name: 'Capa do Saitama',
    slot: 'aura',
    icon: 'capa_saitama_icon.webp',
    desc: 'A capa branca lendária flutua atrás do seu avatar.',
    stats: { res: 15, agi: 10 },
    unlockDesc: 'Desbloqueia no Nível Geral 50 ou Mentor Saitama Nível 5.',
    equivalentIds: ['item_capa', 'has-item-capa']
  },
  {
    id: 'item_jin',
    name: 'Sorriso Worldwide Handsome',
    slot: 'aura',
    icon: 'sorriso_jin_icon.webp',
    desc: 'Um brilho charmoso e confiante contorna seu avatar de perfil.',
    stats: { vig: 5 },
    unlockDesc: 'Desbloqueia no Mentor Jin Nível 5.',
    equivalentIds: ['item_jin', 'has-item-jin']
  },
  {
    id: 'item_namjoon',
    name: 'Aura do Líder',
    slot: 'aura',
    icon: 'coroa_lider_icon.webp',
    desc: 'Uma aura índigo serena e ponderada envolve seu avatar de perfil.',
    stats: { foc: 5 },
    unlockDesc: 'Desbloqueia no Mentor RM Nível 5.',
    equivalentIds: ['item_namjoon', 'has-item-namjoon']
  },

  // ─────────────────────────────────────────────────────────────
  // LEVA 2026-08-12 — 30 itens novos, 3 por mentor (4 na Anya).
  //
  // Os níveis usados (4/9/19/30) NÃO são arbitrários: são os níveis em que
  // generateMentorRewards() emite uma recompensa do tipo `css_class`, que é
  // o único tipo que checkMentorRewards() empurra pra state.unlockedItems.
  // Por isso cada item traz o `has-men-<shortcode><nível>` correspondente em
  // equivalentIds — é ele que destrava o item, não o texto de unlockDesc.
  // Ver docs/MENTOR_CRITERIA.md seção 7.
  // ─────────────────────────────────────────────────────────────

  // ══ GOKU ══
  { id: 'item_kame', name: 'Símbolo da Tartaruga', slot: 'badge', icon: 'simbolo_kame_icon.webp',
    desc: 'O kanji 亀 da Escola Tartaruga marcado no seu perfil. Treino do Mestre Kame validado.',
    stats: { foc: 8, for: 4 }, unlockDesc: 'Desbloqueia no Mentor Goku Nível 19.',
    equivalentIds: ['item_kame', 'has-men-gok19'] },
  { id: 'item_kaioken', name: 'Punhos do Kaioken', slot: 'hands', icon: 'punhos_kaioken_icon.webp',
    desc: 'Seus punhos queimam em chamas vermelhas. Kaioken multiplica tudo — inclusive o risco.',
    stats: { for: 12, foc: 6 }, unlockDesc: 'Desbloqueia no Mentor Goku Nível 30.',
    equivalentIds: ['item_kaioken', 'has-men-gok30'] },

  // ══ BROLY ══
  { id: 'item_paragus', name: 'Coroa de Paragus', slot: 'badge', icon: 'coroa_paragus_icon.webp',
    desc: 'A tiara de controle que segurava o Lendário. Você decide se ela te contém ou te liberta.',
    stats: { for: 8, res: 4 }, unlockDesc: 'Desbloqueia no Mentor Broly Nível 19.',
    equivalentIds: ['item_paragus', 'has-men-bro19'] },
  { id: 'item_punhosbroly', name: 'Punhos do Lendário', slot: 'hands', icon: 'punhos_broly_icon.webp',
    desc: 'Punhos colossais envoltos em energia verde. Não existe peso, só coisas a serem esmagadas.',
    stats: { for: 12, res: 6 }, unlockDesc: 'Desbloqueia no Mentor Broly Nível 30.',
    equivalentIds: ['item_punhosbroly', 'has-men-bro30'] },

  // ══ ROCK LEE ══
  { id: 'item_caneleiras', name: 'Caneleiras de Peso', slot: 'legs', icon: 'caneleiras_lee_icon.webp',
    desc: 'As caneleiras que o Lee treina o tempo todo. Quando você tirar, vai se assustar com a própria velocidade.',
    stats: { agi: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor Rock Lee Nível 19.',
    equivalentIds: ['item_caneleiras', 'has-men-lee19'] },
  { id: 'item_oitavoportao', name: 'Oitavo Portão', slot: 'aura', icon: 'oitavo_portao_icon.webp',
    desc: 'O último dos Oito Portões Internos. Poder absoluto ao custo do próprio corpo.',
    stats: { agi: 12, vig: 6 }, unlockDesc: 'Desbloqueia no Mentor Rock Lee Nível 30.',
    equivalentIds: ['item_oitavoportao', 'has-men-lee30'] },

  // ══ SAITAMA ══
  { id: 'item_luvassaitama', name: 'Luvas Vermelhas do Herói', slot: 'hands', icon: 'luvas_saitama_icon.webp',
    desc: 'As luvas vermelhas do Careca Capa. Simples, como tudo que funciona.',
    stats: { res: 8, agi: 4 }, unlockDesc: 'Desbloqueia no Mentor Saitama Nível 19.',
    equivalentIds: ['item_luvassaitama', 'has-men-sai19'] },
  { id: 'item_registroheroi', name: 'Registro de Herói', slot: 'badge', icon: 'registro_heroi_icon.webp',
    desc: 'Sua licença oficial da Associação de Heróis. O ranking não importa — a rotina importa.',
    stats: { res: 12, agi: 6 }, unlockDesc: 'Desbloqueia no Mentor Saitama Nível 30.',
    equivalentIds: ['item_registroheroi', 'has-men-sai30'] },

  // ══ BEBEZINHO ══
  { id: 'item_seloallday', name: 'Selo All Day', slot: 'badge', icon: 'selo_allday_icon.webp',
    desc: 'O selo da filosofia All Day. Wake wake, big — todo dia, sem exceção.',
    stats: { foc: 5 }, unlockDesc: 'Desbloqueia no Mentor Bebezinho Nível 9.',
    equivalentIds: ['item_seloallday', 'has-men-beb9'] },
  { id: 'item_legpress500', name: 'Leg Press 500kg', slot: 'legs', icon: 'legpress_500_icon.webp',
    desc: 'O feito que rodou o mundo. 500kg no leg press, tributo eterno ao Bebezinho.',
    stats: { for: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor Bebezinho Nível 19.',
    equivalentIds: ['item_legpress500', 'has-men-beb19'] },
  { id: 'item_aurafreaky', name: 'Aura Freaky Season', slot: 'aura', icon: 'aura_freaky_icon.webp',
    desc: 'Aura roxa e dourada em chamas. Freaky Season não tem data pra acabar.',
    stats: { foc: 12, for: 6 }, unlockDesc: 'Desbloqueia no Mentor Bebezinho Nível 30.',
    equivalentIds: ['item_aurafreaky', 'has-men-beb30'] },

  // ══ RAMON DINO ══
  { id: 'item_cintaclassic', name: 'Cinta Classic Physique', slot: 'waist', icon: 'cinta_classic_icon.webp',
    desc: 'A cinta fina de posing do Classic Physique. Cintura fina, dorsal larga.',
    stats: { vig: 5 }, unlockDesc: 'Desbloqueia no Mentor Ramon Dino Nível 9.',
    equivalentIds: ['item_cintaclassic', 'has-men-ram9'] },
  { id: 'item_seloolympia', name: 'Selo Olympia Classic', slot: 'badge', icon: 'selo_olympia_icon.webp',
    desc: 'A medalha do palco mais alto do mundo. Do Acre pro Olympia, batendo peso certinho.',
    stats: { vig: 8, for: 4 }, unlockDesc: 'Desbloqueia no Mentor Ramon Dino Nível 19.',
    equivalentIds: ['item_seloolympia', 'has-men-ram19'] },
  { id: 'item_auradino', name: 'Aura Verde-Amarela', slot: 'aura', icon: 'aura_dino_icon.webp',
    desc: 'Verde e amarelo pulsando ao seu redor. Representação brasileira de elite.',
    stats: { vig: 12, for: 6 }, unlockDesc: 'Desbloqueia no Mentor Ramon Dino Nível 30.',
    equivalentIds: ['item_auradino', 'has-men-ram30'] },

  // ══ ARNOLD ══
  { id: 'item_luvasarnold', name: 'Luvas da Golden Era', slot: 'hands', icon: 'luvas_arnold_icon.webp',
    desc: 'Luvas de couro sem dedo, direto do Gold\'s Gym de Venice Beach. Puro pump.',
    stats: { for: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor Arnold Nível 19.',
    equivalentIds: ['item_luvasarnold', 'has-men-arn19'] },
  { id: 'item_sandow', name: 'Troféu Sandow', slot: 'badge', icon: 'trofeu_sandow_icon.webp',
    desc: 'A estatueta do Mr. Olympia. Arnold levantou sete. Você está no caminho.',
    stats: { for: 12, vig: 6 }, unlockDesc: 'Desbloqueia no Mentor Arnold Nível 30.',
    equivalentIds: ['item_sandow', 'has-men-arn30'] },

  // ══ NICK WALKER ══
  { id: 'item_straps', name: 'Straps do Mutante', slot: 'arms', icon: 'straps_mutante_icon.webp',
    desc: 'Straps de levantamento. Quando a pegada falha antes do músculo, o problema é a pegada.',
    stats: { for: 5 }, unlockDesc: 'Desbloqueia no Mentor Nick Walker Nível 9.',
    equivalentIds: ['item_straps', 'has-men-nic9'] },
  { id: 'item_cinturaoclassic', name: 'Cinturão Arnold Classic', slot: 'waist', icon: 'cinturao_classic_icon.webp',
    desc: 'O cinturão de campeão do Arnold Classic 2021. Intensidade bizarra premiada.',
    stats: { for: 8, res: 4 }, unlockDesc: 'Desbloqueia no Mentor Nick Walker Nível 19.',
    equivalentIds: ['item_cinturaoclassic', 'has-men-nic19'] },
  { id: 'item_auramutante', name: 'Aura Mutante', slot: 'aura', icon: 'aura_mutante_icon.webp',
    desc: 'Chamas laranja irregulares te envolvem. A mutação está completa.',
    stats: { for: 12, res: 6 }, unlockDesc: 'Desbloqueia no Mentor Nick Walker Nível 30.',
    equivalentIds: ['item_auramutante', 'has-men-nic30'] },

  // ══ JIN ══
  { id: 'item_medalhajin', name: 'Medalha do Serviço Militar', slot: 'badge', icon: 'medalha_jin_icon.webp',
    desc: 'Disciplina comprovada em campo. Se aguentou o exército, aguenta o treino de hoje.',
    stats: { vig: 8, for: 4 }, unlockDesc: 'Desbloqueia no Mentor Jin Nível 19.',
    equivalentIds: ['item_medalhajin', 'has-men-jin19'] },
  { id: 'item_luvasjin', name: 'Luvas Rosa Elegantes', slot: 'hands', icon: 'luvas_jin_icon.webp',
    desc: 'Treinar pesado sem abrir mão do estilo. Worldwide Handsome até na série falha.',
    stats: { vig: 12, for: 6 }, unlockDesc: 'Desbloqueia no Mentor Jin Nível 30.',
    equivalentIds: ['item_luvasjin', 'has-men-jin30'] },

  // ══ RM (NAMJOON) ══
  { id: 'item_fonesrm', name: 'Fones de Estúdio', slot: 'head', icon: 'fones_rm_icon.webp',
    desc: 'O mundo lá fora silencia. Só existe você, o ferro e a próxima repetição.',
    stats: { foc: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor RM Nível 19.',
    equivalentIds: ['item_fonesrm', 'has-men-nam19'] },
  { id: 'item_selorm', name: 'Selo Speak Yourself', slot: 'badge', icon: 'selo_rm_icon.webp',
    desc: 'Treinar o corpo é treinar a mente. Ame a si mesmo o suficiente pra continuar.',
    stats: { foc: 12, vig: 6 }, unlockDesc: 'Desbloqueia no Mentor RM Nível 30.',
    equivalentIds: ['item_selorm', 'has-men-nam30'] },

  // ══ SUKUNA ══
  { id: 'item_dedosukuna', name: 'Dedo Amaldiçoado', slot: 'badge', icon: 'dedo_sukuna_icon.webp',
    desc: 'Um dos vinte dedos do Rei das Maldições. Guardá-lo já é um ato de coragem.',
    stats: { for: 5 }, unlockDesc: 'Desbloqueia no Mentor Sukuna Nível 9.',
    equivalentIds: ['item_dedosukuna', 'has-men-suk9'] },
  { id: 'item_quatrobracos', name: 'Quatro Braços do Rei', slot: 'arms', icon: 'quatro_bracos_icon.webp',
    desc: 'Quatro braços para dobrar o volume de treino. Nenhuma desculpa sobrevive a isso.',
    stats: { for: 8, agi: 4 }, unlockDesc: 'Desbloqueia no Mentor Sukuna Nível 19.',
    equivalentIds: ['item_quatrobracos', 'has-men-suk19'] },
  { id: 'item_santuario', name: 'Santuário Malevolente', slot: 'aura', icon: 'santuario_icon.webp',
    desc: 'Expansão de Domínio. Dentro dela, o único resultado possível é o corte.',
    stats: { for: 12, agi: 6 }, unlockDesc: 'Desbloqueia no Mentor Sukuna Nível 30.',
    equivalentIds: ['item_santuario', 'has-men-suk30'] },

  // ══ AOI TODO ══
  { id: 'item_boogiewoogie', name: 'Palmas do Boogie Woogie', slot: 'hands', icon: 'boogie_woogie_icon.webp',
    desc: 'A técnica que troca sua posição com quem você tocou, no instante em que ambos batem palmas juntos.',
    stats: { for: 5 }, unlockDesc: 'Desbloqueia no Mentor Aoi Todo Nível 9.',
    equivalentIds: ['item_boogiewoogie', 'has-men-tdo9'] },
  { id: 'item_emblemakyoto', name: 'Emblema de Kyoto Jujutsu High', slot: 'badge', icon: 'emblema_kyoto_icon.webp',
    desc: 'O emblema do 2º ano da Escola Técnica de Kyoto. Ele não representa a escola — a escola é que tem sorte de tê-lo.',
    stats: { for: 8, res: 4 }, unlockDesc: 'Desbloqueia no Mentor Aoi Todo Nível 19.',
    equivalentIds: ['item_emblemakyoto', 'has-men-tdo19'] },
  { id: 'item_postertakada', name: 'Pôster da Takada Reika', slot: 'arms', icon: 'poster_takada_icon.webp',
    desc: 'A idol favorita do Todo, guardada com carinho. Se você entender por que isso importa, vocês dois já são melhores amigos.',
    stats: { for: 12, res: 6 }, unlockDesc: 'Desbloqueia no Mentor Aoi Todo Nível 30.',
    equivalentIds: ['item_postertakada', 'has-men-tdo30'] },

  // ══ ANYA ══ (único mentor com 4 itens — o Minduim é bônus)
  { id: 'item_minduim', name: 'Minduim da Anya', slot: 'hands', icon: 'minduim_anya_icon.webp',
    desc: 'O amendoim favorito da Anya, guardado com carinho. Combustível oficial de quem treina waku waku.',
    stats: { vig: 3, foc: 2 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 4.',
    equivalentIds: ['item_minduim', 'has-men-any4'] },
  { id: 'item_stella', name: 'Estrela Stella', slot: 'badge', icon: 'estrela_stella_icon.webp',
    desc: 'A Estrela Stella da Eden Academy. A Anya passou o treino todo torcendo por essa.',
    stats: { foc: 5 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 9.',
    equivalentIds: ['item_stella', 'has-men-any9'] },
  { id: 'item_lacosanya', name: 'Laços Cor-de-Rosa', slot: 'head', icon: 'lacos_anya_icon.webp',
    desc: 'Os laços icônicos da Anya. Ninguém desconfia que são chifres de verdade.',
    stats: { foc: 8, agi: 4 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 19.',
    equivalentIds: ['item_lacosanya', 'has-men-any19'] },
  { id: 'item_bond', name: 'Bond ao seu Lado', slot: 'aura', icon: 'bond_anya_icon.webp',
    desc: 'Bond, o cão precognitivo da família Forger (batizado por causa do Bondman), aparece guardando seu treino. Ele já viu você terminando essa série.',
    stats: { foc: 12, agi: 6 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 30.',
    equivalentIds: ['item_bond', 'has-men-any30'] }
];

function getEffectiveAttributes() {
  const eff = {
    for: state.attributes.for || 10,
    res: state.attributes.res || 10,
    agi: state.attributes.agi || 10,
    vig: state.attributes.vig || 10,
    foc: state.attributes.foc || 10
  };
  
  if (state.equippedItems) {
    Object.values(state.equippedItems).forEach(itemId => {
      if (itemId) {
        const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
        if (item && item.stats) {
          for (const [stat, val] of Object.entries(item.stats)) {
            if (eff[stat] !== undefined) {
              eff[stat] += val;
            }
          }
        }
      }
    });
  }
  return eff;
}

function isItemUnlocked(item) {
  if (!state.unlockedItems) return false;
  return item.equivalentIds.some(id => state.unlockedItems.includes(id));
}

// Acha o item de EQUIPMENT_DATABASE que uma recompensa da progressão do
// mentor realmente desbloqueia (mesmo `value` presente em equivalentIds).
function findEquipmentItemForReward(reward) {
  if (!reward || reward.type !== 'css_class') return null;
  return EQUIPMENT_DATABASE.find(i => i.equivalentIds.includes(reward.value)) || null;
}

// Ícone + texto pra mostrar numa notificação/prévia de recompensa: troca os
// dois pelo do item real quando existe um, não só o ícone — senão a linha
// mistura o ícone certo com uma legenda genérica de outro milestone (ex.:
// ícone das Caneleiras do Lee do lado do texto "Animação cinemática ao
// treinar", que é sobre outra coisa).
//
// Só os níveis 5/10/20 (tier1/tier2/tier4 em generateMentorRewards) têm o
// nome escrito à mão pra já descrever o item vinculado — esses ficam como
// estão. Os "⭐ LENDA"/"⭐ ETERNO" de 25/30 são flavor de maestria genérico
// SEMPRE, mesmo quando o mesmo nível também libera um item de verdade
// (ex.: Bond da Anya no Nv30) — por isso não usar "nome começa com ⭐" como
// critério, e sim o nível exato.
function getRewardDisplayInfo(reward) {
  const item = findEquipmentItemForReward(reward);
  if (!item) return { icon: reward.icon, name: reward.name, desc: reward.desc };
  const isHandWrittenTierName = [5, 10, 20].includes(reward.lvl);
  return {
    icon: item.icon,
    name: isHandWrittenTierName ? reward.name : item.name,
    desc: isHandWrittenTierName ? reward.desc : item.desc
  };
}

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
  { id: 'sequencia_ferro', name: 'Sequência de Ferro', icon: '🔥', desc: 'Treinou 7 dias seguidos.' },
  { id: 'mes_disciplina', name: 'Um Mês de Disciplina', icon: '👑', desc: 'Treinou 30 dias seguidos.' },
  { id: 'hidratacao_consistente', name: 'Hidratação Consistente', icon: '💧', desc: 'Bateu a meta de água 5 dias seguidos.' },
  { id: 'superacao_pessoal', name: 'Superação Pessoal', icon: '📈', desc: 'Bateu seu primeiro recorde pessoal em um exercício.' },
  { id: 'colecionador_recordes', name: 'Colecionador de Recordes', icon: '💎', desc: 'Bateu recorde pessoal em 5 exercícios diferentes.' },
  { id: 'limite_superado', name: 'Limite Superado', icon: '⚡', desc: 'Subiu para o Nível 5!' },
  { id: 'freaky_tier', name: 'Atingiu Shape Lendário', icon: '👑', desc: 'Chegou ao Nível 25!' },
  { id: 'mind_shield', name: 'Mente Blindada', icon: '🎯', desc: 'Concluiu todas as quests diárias do dia.' },
  { id: 'gym_legend', name: 'Lenda do Ginásio', icon: '🔱', desc: 'Completou 25 treinos no total.' },
  { id: 'insignia_mutante', name: 'Insígnia Mutante', icon: '🔥', desc: 'Resgatou a recompensa do Desafio Diário.' },
  { id: 'vinculo_forte', name: 'Vínculo Forte', icon: '🌟', desc: 'Atingiu Nível 10 com algum mentor.' }
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
  height: 175,
  currentWeight: 75,
  targetWeight: 75,
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

