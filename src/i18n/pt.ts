const pt = {
  // Home
  home_title_1: 'ONE WRONG',
  home_title_2: 'TAP',
  home_high_score: 'RECORDE',
  home_your_medals: 'SUAS MEDALHAS',
  home_play: 'JOGAR',
  home_leaderboard: 'RANKING',
  home_challenges: '⚡ DESAFIOS',
  home_profile: 'PERFIL',
  home_champion: 'CAMPEÃO',
  home_top10: 'TOP 10',

  // Settings
  settings_title: 'CONFIGURAÇÕES',
  settings_sound: 'SOM',
  settings_sound_desc: 'Música e efeitos',
  settings_vibration: 'VIBRAÇÃO',
  settings_vibration_desc: 'Feedback tátil',
  settings_theme: 'TEMA',
  settings_language: 'IDIOMA',
  settings_active: '✓ ATIVO',

  // Game
  game_score: 'PONTOS',
  game_shield: '🛡️ ESCUDO',

  // Game Over
  gameover_title: 'FIM DE JOGO',
  gameover_your_score: 'SUA PONTUAÇÃO',
  gameover_high_score: 'RECORDE',
  gameover_new_high: '★ NOVO RECORDE ★',
  gameover_saving_as: 'SALVANDO COMO',
  gameover_new_medal: 'NOVA MEDALHA DESBLOQUEADA',
  gameover_monthly_champion: '👑 CAMPEÃO MENSAL 👑',
  gameover_choose_nick: 'ESCOLHA SEU APELIDO',
  gameover_nick_error_chars: 'A-Z, 0-9, _ APENAS',
  gameover_nick_error_taken: 'APELIDO JÁ EM USO',
  gameover_nick_error_generic: 'ERRO, TENTE NOVAMENTE',
  gameover_nick_error_length: '3-12 caracteres, A-Z, 0-9, _ apenas',
  gameover_save: 'SALVAR NO RANKING GLOBAL',
  gameover_saving: 'SALVANDO...',
  gameover_saved: '✓ PONTUAÇÃO SALVA!',
  gameover_continue: '▶ CONTINUAR (ASSISTIR AD)',
  gameover_watching: 'ASSISTINDO AD...',
  gameover_play_again: 'JOGAR NOVAMENTE',
  gameover_home: 'INÍCIO',

  // Leaderboard
  lb_title: 'RANKING GLOBAL',
  lb_monthly: 'MENSAL',
  lb_alltime: 'GERAL',
  lb_halloffame: 'HALL DA FAMA',
  lb_defend_crown: '👑 DEFENDA SUA COROA 👑',
  lb_no_seasons: 'NENHUMA TEMPORADA CONCLUÍDA AINDA',
  lb_first_season: 'PRIMEIRA TEMPORADA ENCERRA NO FINAL DO MÊS',
  lb_no_scores: 'NENHUMA PONTUAÇÃO AINDA',
  lb_play_first: 'JOGUE PARA SER O #1!',
  lb_no_results: 'SEM RESULTADOS',
  lb_your_rank: 'SEU RANKING',

  // Profile
  profile_title: 'PERFIL',
  profile_player: 'JOGADOR',
  profile_no_name: 'SEM NOME',
  profile_local_high: 'RECORDE LOCAL',
  profile_best_monthly: 'MELHOR MENSAL',
  profile_best_alltime: 'MELHOR GERAL',
  profile_medals: 'MEDALHAS',
  profile_champion: 'CAMPEÃO',
  profile_top10: 'TOP 10',
  profile_link_google: '🔗 VINCULAR CONTA GOOGLE',
  profile_linking: 'VINCULANDO...',
  profile_linked: '✓ CONTA GOOGLE VINCULADA',

  // Tutorial
  tut_tap_green: 'TOQUE NO VERDE',
  tut_tap_green_sub: 'Toque no círculo verde brilhante',
  tut_avoid_red: 'EVITE O VERMELHO',
  tut_avoid_red_sub: 'Toque verde — nunca vermelho!',
  tut_be_fast: 'SEJA RÁPIDO',
  tut_be_fast_sub: 'Observe o timer — mais um toque!',
  tut_wrong: '✕ ERRADO — TOQUE NO VERDE!',
  tut_skip: 'PULAR TUTORIAL',

  // Quick death hint
  hint_tap_green: 'Toque apenas nos círculos verdes!',

  // Challenges
  ch_title: 'DESAFIOS',
  ch_complete: 'DESAFIO COMPLETO!',
  ch_score: 'PONTUAÇÃO',
  ch_back: 'VOLTAR AOS DESAFIOS',
  ch_completed: '✓ CONCLUÍDO',
  ch_beat_n_in_sec: 'Bata {n} em {sec}s',
  ch_beat_n_in_sec_desc: 'Faça {n} pontos em {sec} segundos',
  ch_speed_tap: 'Toque rápido ({sec}s)',
  ch_speed_tap_desc: 'Maior pontuação em {sec} segundos',
  ch_perfect_n: 'Perfeição: {n} acertos',
  ch_perfect_n_desc: 'Faça {n} pontos sem erros',

  // Celebrations
  cel_entered: 'VOCÊ ENTROU NO',
  cel_top10: 'TOP 10',
  cel_you_are: 'VOCÊ É O',
  cel_world1: 'NÚMERO 1 DO MUNDO',

  // Intro
  intro_subtitle: 'Toque rápido. Suba no ranking.',
  intro_start: 'TOQUE PARA INICIAR',

  // Difficulty
  diff_title: 'DIFICULDADE',
  diff_easy: 'FÁCIL',
  diff_normal: 'NORMAL',
  diff_hard: 'DIFÍCIL',
  diff_insane: 'INSANO',

  // Splash
  splash_studio: 'Interactive Studios',
} as const;

export default pt;
export type TranslationKey = keyof typeof pt;
