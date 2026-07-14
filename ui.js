const i18n = {
  en: {
    title: 'Scraper Control Panel',
    subtitle: 'Choose a sport, run the scan, review results, and manage competitions ignored by compare.',
    language: 'Language',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    homeLogo: 'Home',
    idle: 'Idle',
    homeSection: 'Scanner',
    homeGreeting: 'Hi, Content Team!',
    homeStartScan: 'Start scan',
    scannerReady: 'Ready',
    runComparison: 'Run comparison',
    contentTeam: 'Content Team',
    scanTab: 'Scanner',
    tasksTab: 'Tasks',
    operatorEmail: 'Operator email',
    myTasksOnly: 'My tasks only',
    refreshTasks: 'Refresh',
    asanaLoading: 'Loading tasks from Asana...',
    asanaNotConfigured: 'Asana is not configured yet. Add ASANA_ACCESS_TOKEN and ASANA_PROJECT_GID to .env, then restart the server. See .env.example.',
    asanaUnavailable: 'Could not load Asana tasks. Scanner stays available as fallback.',
    asanaNoTasks: 'No tasks due today in Daily Games Overview.',
    asanaNoTasksForDate: 'No tasks due on {date} in Daily Games Overview.',
    asanaEmptyEmail: 'No tasks found for this email today.',
    asanaViewDate: 'Tasks due on',
    asanaToday: 'Today',
    asanaScanFor: 'Scan for',
    asanaUsScanHint: 'Scans American football, baseball and basketball',
    scanTask: 'Scan',
    scanAllTasks: 'Scan {count} tasks',
    scanAlreadyRunning: 'A scan is already running. Wait for it to finish before starting another.',
    finishAsanaTask: 'Finish task',
    finishAsanaTaskNext: 'Finish task and scan next',
    finishingAsanaTask: 'Finishing…',
    asanaQueueProgress: 'Batch {current}/{total} · {task}',
    asanaQueueFinishHint: 'Finish the Asana task to start the next sport.',
    asanaQueueAdvanceFailed: 'Could not start the next queued scan. The batch was stopped.',
    taskPending: 'Pending',
    asanaUnassigned: 'Unassigned',
    asanaTaskCount: '{count} tasks',
    taskCompleted: 'Completed',
    taskUnmapped: 'Unmapped',
    openInAsana: 'Open in Asana',
    asanaDayHint: 'Tasks due today scan for tomorrow',
    asanaSportNotAllowed: 'This sport is not in your Asana tasks today.',
    termsTab: 'Terms Fix',
    usaSportsTab: 'USA Sports',
    usaSportsTitle: 'USA Sports',
    usaSportsHint: 'Compare NBA, NFL, MLB and other US leagues between 365Scores and Flashscore.',
    usaSportsServerRestart: 'USA Sports requires a server restart. Stop the running server (Ctrl+C in the terminal) and run npm run dev again.',
    usaAllServerRestart: 'The "All USA sports" option requires a server restart. Stop the running server (Ctrl+C in the terminal) and run npm run dev again.',
    latamTab: 'LATAM',
    latamTitle: 'LATAM',
    latamHint: 'Compare 365Scores and Flashscore for Latin America and Caribbean countries, one sport at a time.',
    latamServerRestart: 'LATAM mode requires a server restart. Stop the running server (Ctrl+C in the terminal) and run npm run dev again.',
    latamAllServerRestart: 'The "Football + Basketball" option requires a server restart. Stop the running server (Ctrl+C in the terminal) and run npm run dev again.',
    israelTeamTitle: 'Israel Team',
    israelTeamHint: 'Compare Israeli football and basketball competitions between 365Scores and Flashscore.',
    israelServerRestart: 'Israel Team mode requires a server restart. Stop the running server (Ctrl+C in the terminal) and run npm run dev again.',
    israelAllServerRestart: 'The "Football + Basketball" option requires a server restart. Stop the running server (Ctrl+C in the terminal) and run npm run dev again.',
    stepIsraelFilter: 'Filtering Israel competitions',
    compareTab: 'Comparison',
    historyTab: 'History',
    historyHint: 'Select a previous scan to view its comparison report.',
    historyListView: 'Scans',
    weeklyTab: 'Weekly',
    weeklyHint: 'Content Team only · last 7 days · time, status, missing on 365 and Flash (no name/terms).',
    weeklyLoading: 'Loading weekly analysis...',
    weeklyEmpty: 'No Content Team mismatches in this window.',
    weeklyRange: '{from} → {to} · {scans} scans · {total} issues',
    weeklyCountries: 'Top countries',
    weeklyLeagues: 'Top leagues',
    weeklyTotal: 'Total issues',
    weeklyMissing365: 'Missing on 365',
    weeklyMissingFlash: 'Missing on Flash',
    refreshWeekly: 'Refresh',
    allSports: 'All sports',
    noHistory: 'No scan history yet.',
    sportFilter: 'Sport filter',
    chooseSportForPdf: 'Choose a sport filter before downloading the All sports PDF.',
    termsTitle: 'Terms Fix',
    termsHint: 'Review discrepancies between 365Scores and Flashscore, focusing on what is missing on 365.',
    noTerms: 'No term fixes are needed.',
    ignoredSuggestionsTitle: 'Suggested ignored competitions',
    ignoredSuggestionsHint: 'These competitions have several games missing on 365Scores. Add them here if they should be ignored in future reports.',
    ignoredSuggestionReason: 'missing games on 365Scores',
    addIgnoredSuggestion: 'Add to ignored',
    ignoredSuggestionAdded: 'Ignored competition added.',
    leaveTermsTitle: 'Report not generated yet',
    leaveTermsMessage: 'This scan is still waiting for Terms Fix. If you leave now, the final report will not be generated or saved to History until you come back and generate it.',
    stayOnTerms: 'Stay on Terms Fix',
    leavePage: 'Leave page',
    stopScanTitle: 'Stop scraping?',
    stopScanMessage: 'A scan is still running. Are you sure you want to stop the scraping and delete the current scan cache?',
    keepScanning: 'Keep scraping',
    stopScan: 'Stop scraping',
    allCompetitions: 'All competitions',
    notListed: 'Not listed',
    termType: 'Type',
    termScope: 'Scope',
    term365: '365Scores term',
    termFlash: 'Flashscore term',
    termContext: 'Context',
    sameTerm: 'Same',
    differentTerm: 'Not same',
    ignoreTerm: 'Ignore',
    dontIgnoreTerm: "Don't ignore",
    ignoreCompetition: 'Ignore competition',
    unignoreCompetition: "Don't ignore competition",
    competitionIgnoredBadge: 'Ignored',
    competitionIgnoreMenu: 'Competition actions',
    competitionIgnoredFeedback: 'Competition ignored for future compares.',
    competitionUnignoredFeedback: 'Competition ignore removed.',
    undecidedTerm: 'Undecided',
    missing365TermType: 'Missing on 365',
    missingFlashTermType: 'Missing on Flash',
    absent365: '(absent)',
    absentFlash: '(absent)',
    missing365TermHint: 'On Flashscore but missing on 365 — ignore if 365 does not cover it',
    generateReport: 'Generate report',
    termsPending: 'Terms Fix needed',
    rulesTab: 'Ignored Competitions',
    sport: 'Sport',
    scraperSource: 'Scraper',
    sofascoreUnavailable: 'Sofascore is not connected yet. Please choose Flashscore for now.',
    date: 'Date',
    scanButton: 'Scan',
    dateHint: 'Choose the scan date you want to compare.',
    total365: '365 games',
    totalFlash: 'Flash games',
    matchedCount: 'Matched games',
    only365: 'Only 365',
    onlyFlash: 'Only Flash',
    allIssues: 'All issues',
    timeDiff: 'Time diff',
    statusDiff: 'Status diff',
    nameDiff: 'Name diff',
    breakdownTitle: 'Detailed Results Breakdown',
    breakdownHint: 'Inspect problematic and perfectly synchronized games.',
    problematicTab: 'Problematic Games',
    matchedTab: 'Matched Games',
    searchPlaceholder: 'Search team or competition...',
    noDetails: 'Run a scan to inspect game details.',
    noMatches: 'No games match this filter.',
    outputFiles: 'Output Files',
    reportTitle: 'Comparison Report',
    reportDetailScanner: 'Scanner',
    reportDetailDate: 'Date',
    reportDetailSport: 'Sport',
    downloadPdf: 'Download PDF',
    openLatestReport: 'Open latest report',
    closeReport: 'Close report',
    viewReport: 'View report',
    openReportBanner: 'Open report:',
    close: 'Close',
    addIgnored: 'Add ignored competition',
    source: 'Source',
    side365: 'Missing in Flashscore',
    sideFlash: 'Missing in 365Scores',
    scope: 'Country / Scope',
    scopePlaceholder: 'Brazil, ATP - Simples...',
    competition: 'Competition',
    competitionPlaceholder: 'Kings League, ITF...',
    add: 'Add',
    rulesHint: 'Rules are saved to',
    rulesHintTail: 'and used by',
    ignoredRules: 'Ignored rules',
    noRules: 'No rules.',
    edit: 'Edit',
    delete: 'Delete',
    country: 'Country',
    game: 'Game',
    comp: 'Competition',
    time: 'Time',
    time365: '365Scores time',
    timeFlash: 'Flashscore time',
    issue: 'Issue',
    status: 'Status',
    synced: 'Synced',
    loadingTitle: 'Scan in progress',
    loading365: 'Scraping 365Scores...',
    loadingFlash: 'Parsing Flashscore...',
    loadingCompare: 'Comparing data streams...',
    loadingFinal: 'Generating report...',
    reportGenTitle: 'Generating report',
    reportStepSave: 'Saving term decisions...',
    reportStepCompare: 'Re-running comparison...',
    reportStepXlsx: 'Writing Excel file...',
    reportStepFinish: 'Finalizing report...',
    stepStart: 'Starting scan',
    stepMemory: 'Updating competition memory',
    stepFinishingFlash: 'Finishing Flashscore...',
    stepLatamFilter: 'Filtering LATAM countries',
    starting: 'Starting...',
    scanning: 'Scanning',
    completed: 'Completed',
    failed: 'Failed',
    download365: 'Download JSON 365',
    downloadFlash: 'Download JSON Flash',
    downloadXlsx: 'Download Excel XLSX',
    noFiles: 'No downloadable files yet.',
    missingFlash: 'Missing on Flashscore',
    missing365: 'Missing on 365Scores',
    missing365Operational: 'Missing on 365Scores (365 covers league)',
    missing365Uncovered: 'Flash only (365 does not cover)',
    catalogCoveredBadge: '365 covers',
    catalogOutsideBadge: '365 does not cover',
    timeMismatch: 'Time mismatch',
    statusMismatch: 'Status mismatch',
    nameMismatch: 'Name mismatch',
    football: 'Football',
    basketball: 'Basketball',
    basketball_usa: 'Basketball',
    american_football_usa: 'American Football',
    baseball_usa: 'Baseball',
    hockey: 'Hockey',
    volleyball: 'Volleyball',
    tennis: 'Tennis',
    all: 'All sports',
    usa_all: 'All USA sports',
    latam_football: 'LATAM Football',
    latam_basketball: 'LATAM Basketball',
    latam_all: 'Football + Basketball',
    latam_hockey: 'LATAM Hockey',
    latam_volleyball: 'LATAM Volleyball',
    latam_tennis: 'LATAM Tennis',
    israel_football: 'Israel Football',
    israel_basketball: 'Israel Basketball',
    israel_all: 'Football + Basketball',
    invalidScanDate: 'Choose a valid scan date.',
  },
  pt: {
    title: 'Painel de Controle do Scraper',
    subtitle: 'Escolha um esporte, rode a varredura, revise os resultados e gerencie competições ignoradas na comparação.',
    language: 'Idioma',
    themeLight: 'Modo claro',
    themeDark: 'Modo escuro',
    homeLogo: 'Início',
    idle: 'Parado',
    homeSection: 'Scanner',
    homeGreeting: 'Olá, Equipe de Conteúdo!',
    homeStartScan: 'Iniciar varredura',
    scannerReady: 'Pronto',
    runComparison: 'Executar comparação',
    contentTeam: 'Content Team',
    scanTab: 'Scanner',
    tasksTab: 'Tarefas',
    operatorEmail: 'E-mail do operador',
    myTasksOnly: 'Só minhas tarefas',
    refreshTasks: 'Atualizar',
    asanaLoading: 'Carregando tarefas do Asana...',
    asanaNotConfigured: 'Asana ainda não configurado. Adicione ASANA_ACCESS_TOKEN e ASANA_PROJECT_GID no .env e reinicie o servidor. Veja .env.example.',
    asanaUnavailable: 'Não foi possível carregar tarefas do Asana. O scanner continua disponível como fallback.',
    asanaNoTasks: 'Nenhuma tarefa com vencimento hoje no Daily Games Overview.',
    asanaNoTasksForDate: 'Nenhuma tarefa com vencimento em {date} no Daily Games Overview.',
    asanaEmptyEmail: 'Nenhuma tarefa encontrada para este e-mail hoje.',
    asanaViewDate: 'Tarefas com vencimento em',
    asanaToday: 'Hoje',
    asanaScanFor: 'Scan para',
    asanaUsScanHint: 'Escaneia futebol americano, beisebol e basquete',
    scanTask: 'Escanear',
    scanAllTasks: 'Escanear {count} tarefas',
    scanAlreadyRunning: 'Já há um scan em andamento. Aguarde terminar antes de iniciar outro.',
    finishAsanaTask: 'Terminar tarefa',
    finishAsanaTaskNext: 'Terminar e escanear próximo',
    finishingAsanaTask: 'A terminar…',
    asanaQueueProgress: 'Lote {current}/{total} · {task}',
    asanaQueueFinishHint: 'Termine a tarefa no Asana para iniciar o próximo esporte.',
    asanaQueueAdvanceFailed: 'Não foi possível iniciar o próximo scan da fila. O lote foi interrompido.',
    taskPending: 'Pendente',
    asanaUnassigned: 'Sem responsável',
    asanaTaskCount: '{count} tarefas',
    taskCompleted: 'Concluída',
    taskUnmapped: 'Não mapeada',
    openInAsana: 'Abrir no Asana',
    asanaDayHint: 'Tarefa de hoje → scan de amanhã',
    asanaSportNotAllowed: 'Este esporte não está nas suas tarefas Asana de hoje.',
    termsTab: 'Correção de Termos',
    usaSportsTab: 'Esportes EUA',
    usaSportsTitle: 'Esportes EUA',
    usaSportsHint: 'Compare NBA, NFL, MLB e outras ligas americanas entre 365Scores e Flashscore.',
    usaSportsServerRestart: 'Esportes EUA precisa reiniciar o servidor. Pare o servidor em execução (Ctrl+C no terminal) e rode npm run dev novamente.',
    usaAllServerRestart: 'A opção "Todos os esportes EUA" precisa reiniciar o servidor. Pare o servidor em execução (Ctrl+C no terminal) e rode npm run dev novamente.',
    latamTab: 'LATAM',
    latamTitle: 'LATAM',
    latamHint: 'Compare 365Scores e Flashscore para países da América Latina e Caribe, um esporte por vez.',
    latamServerRestart: 'O modo LATAM precisa reiniciar o servidor. Pare o servidor em execução (Ctrl+C no terminal) e rode npm run dev novamente.',
    latamAllServerRestart: 'A opção "Futebol + Basquete" precisa reiniciar o servidor. Pare o servidor em execução (Ctrl+C no terminal) e rode npm run dev novamente.',
    israelTeamTitle: 'Israel Team',
    israelTeamHint: 'Compare competições israelenses de futebol e basquete entre 365Scores e Flashscore.',
    israelServerRestart: 'O modo Israel Team precisa reiniciar o servidor. Pare o servidor em execução (Ctrl+C no terminal) e rode npm run dev novamente.',
    israelAllServerRestart: 'A opção "Futebol + Basquete" precisa reiniciar o servidor. Pare o servidor em execução (Ctrl+C no terminal) e rode npm run dev novamente.',
    stepIsraelFilter: 'Filtrando competições de Israel',
    compareTab: 'Comparação',
    historyTab: 'Histórico',
    historyHint: 'Selecione uma varredura anterior para ver o relatório de comparação.',
    historyListView: 'Varreduras',
    weeklyTab: 'Semanal',
    weeklyHint: 'Somente Content Team · últimos 7 dias · horário, status, missing na 365 e Flash (sem nome/terms).',
    weeklyLoading: 'Carregando análise semanal...',
    weeklyEmpty: 'Nenhum mismatch do Content Team nesta janela.',
    weeklyRange: '{from} → {to} · {scans} scans · {total} issues',
    weeklyCountries: 'Países com mais issues',
    weeklyLeagues: 'Ligas com mais issues',
    weeklyTotal: 'Total de issues',
    weeklyMissing365: 'Ausente na 365',
    weeklyMissingFlash: 'Ausente no Flash',
    refreshWeekly: 'Atualizar',
    allSports: 'Todos os esportes',
    noHistory: 'Ainda não há histórico de varreduras.',
    sportFilter: 'Filtro por esporte',
    chooseSportForPdf: 'Escolha um filtro de esporte antes de baixar o PDF de todos os esportes.',
    termsTitle: 'Correção de Termos',
    termsHint: 'Revise discrepâncias entre 365Scores e Flashscore, com foco no que falta na 365.',
    noTerms: 'Nenhuma correção de termos é necessária.',
    ignoredSuggestionsTitle: 'Sugestões de competições ignoradas',
    ignoredSuggestionsHint: 'Estas competições têm vários jogos ausentes na 365Scores. Adicione aqui se devem ser ignoradas nos próximos relatórios.',
    ignoredSuggestionReason: 'jogos ausentes na 365Scores',
    addIgnoredSuggestion: 'Adicionar aos ignorados',
    ignoredSuggestionAdded: 'Competição ignorada adicionada.',
    leaveTermsTitle: 'Relatório ainda não gerado',
    leaveTermsMessage: 'Esta varredura ainda está aguardando a Correção de Termos. Se você sair agora, o relatório final não será gerado nem salvo no Histórico até você voltar e gerá-lo.',
    stayOnTerms: 'Continuar na Correção',
    leavePage: 'Sair da página',
    stopScanTitle: 'Parar a varredura?',
    stopScanMessage: 'Uma varredura ainda está rodando. Tem certeza que deseja parar o scraping e apagar o cache da varredura atual?',
    keepScanning: 'Continuar varredura',
    stopScan: 'Parar scraping',
    allCompetitions: 'Todas as competições',
    notListed: 'Não listado',
    termType: 'Tipo',
    termScope: 'Escopo',
    term365: 'Termo 365Scores',
    termFlash: 'Termo Flashscore',
    termContext: 'Contexto',
    sameTerm: 'É igual',
    differentTerm: 'Não é igual',
    ignoreTerm: 'Ignorar',
    dontIgnoreTerm: 'Não ignorar',
    ignoreCompetition: 'Ignorar competição',
    unignoreCompetition: 'Não ignorar competição',
    competitionIgnoredBadge: 'Ignorada',
    competitionIgnoreMenu: 'Ações da competição',
    competitionIgnoredFeedback: 'Competição ignorada nas próximas comparações.',
    competitionUnignoredFeedback: 'Ignorar removido da competição.',
    undecidedTerm: 'Pendente',
    missing365TermType: 'Ausente na 365',
    missingFlashTermType: 'Ausente no Flash',
    absent365: '(ausente)',
    absentFlash: '(ausente)',
    missing365TermHint: 'Competição no Flashscore ausente na 365 — ignorar se a 365 não cobre',
    generateReport: 'Gerar relatório',
    termsPending: 'Correção de termos necessária',
    rulesTab: 'Competições Ignoradas',
    sport: 'Esporte',
    scraperSource: 'Scraper',
    sofascoreUnavailable: 'Sofascore ainda não está conectado. Escolha Flashscore por enquanto.',
    date: 'Data',
    scanButton: 'Escanear',
    dateHint: 'Escolha a data da varredura que deseja comparar.',
    total365: 'Jogos 365',
    totalFlash: 'Jogos Flash',
    matchedCount: 'Jogos sincronizados',
    only365: 'Só 365',
    onlyFlash: 'Só Flash',
    allIssues: 'Todos',
    timeDiff: 'Dif. horário',
    statusDiff: 'Dif. status',
    nameDiff: 'Dif. nome',
    breakdownTitle: 'Detalhamento dos Resultados',
    breakdownHint: 'Inspecione jogos problemáticos e perfeitamente sincronizados.',
    problematicTab: 'Jogos Problemáticos',
    matchedTab: 'Jogos Sincronizados',
    searchPlaceholder: 'Buscar time ou competição...',
    noDetails: 'Rode uma varredura para inspecionar os jogos.',
    noMatches: 'Nenhum jogo corresponde ao filtro.',
    outputFiles: 'Arquivos de Saída',
    reportTitle: 'Relatório de Comparação',
    reportDetailScanner: 'Scanner',
    reportDetailDate: 'Data',
    reportDetailSport: 'Esporte',
    downloadPdf: 'Baixar PDF',
    openLatestReport: 'Abrir último relatório',
    closeReport: 'Fechar relatório',
    viewReport: 'Ver relatório',
    openReportBanner: 'Relatório aberto:',
    close: 'Fechar',
    addIgnored: 'Adicionar competição ignorada',
    source: 'Origem',
    side365: 'Ausente no Flashscore',
    sideFlash: 'Ausente na 365Scores',
    scope: 'País / Escopo',
    scopePlaceholder: 'Brasil, ATP - Simples...',
    competition: 'Competição',
    competitionPlaceholder: 'Kings League, ITF...',
    add: 'Adicionar',
    rulesHint: 'As regras são salvas em',
    rulesHintTail: 'e usadas por',
    ignoredRules: 'Regras ignoradas',
    noRules: 'Sem regras.',
    edit: 'Editar',
    delete: 'Excluir',
    country: 'País',
    game: 'Jogo',
    comp: 'Competição',
    time: 'Horário',
    time365: 'Horário 365Scores',
    timeFlash: 'Horário Flashscore',
    issue: 'Problema',
    status: 'Status',
    synced: 'Sincronizado',
    loadingTitle: 'Varredura em andamento',
    loading365: 'Coletando 365Scores...',
    loadingFlash: 'Lendo Flashscore...',
    loadingCompare: 'Comparando dados...',
    loadingFinal: 'Gerando relatório...',
    reportGenTitle: 'Gerando relatório',
    reportStepSave: 'Salvando decisões de termos...',
    reportStepCompare: 'Reexecutando comparação...',
    reportStepXlsx: 'Gerando arquivo Excel...',
    reportStepFinish: 'Finalizando relatório...',
    stepStart: 'Iniciando varredura',
    stepMemory: 'Atualizando memória de competições',
    stepFinishingFlash: 'Finalizando Flashscore...',
    stepLatamFilter: 'Filtrando países LATAM',
    starting: 'Iniciando...',
    scanning: 'Escaneando',
    completed: 'Concluído',
    failed: 'Falhou',
    download365: 'Baixar JSON 365',
    downloadFlash: 'Baixar JSON Flash',
    downloadXlsx: 'Baixar Excel XLSX',
    noFiles: 'Nenhum arquivo disponível ainda.',
    missingFlash: 'Ausente no Flashscore',
    missing365: 'Ausente na 365Scores',
    missing365Operational: 'Ausente na 365 (liga coberta)',
    missing365Uncovered: 'Só Flash (365 não cobre)',
    catalogCoveredBadge: '365 cobre',
    catalogOutsideBadge: '365 não cobre',
    timeMismatch: 'Divergência de horário',
    statusMismatch: 'Divergência de status',
    nameMismatch: 'Divergência de nome',
    football: 'Futebol',
    basketball: 'Basquete',
    basketball_usa: 'Basquete',
    american_football_usa: 'Futebol Americano',
    baseball_usa: 'Beisebol',
    hockey: 'Hockey',
    volleyball: 'Vôlei',
    tennis: 'Tênis',
    all: 'Todos os esportes',
    usa_all: 'Todos os esportes EUA',
    latam_football: 'LATAM Futebol',
    latam_basketball: 'LATAM Basquete',
    latam_all: 'Futebol + Basquete',
    latam_hockey: 'LATAM Hockey',
    latam_volleyball: 'LATAM Vôlei',
    latam_tennis: 'LATAM Tênis',
    israel_football: 'Israel Futebol',
    israel_basketball: 'Israel Basquete',
    israel_all: 'Futebol + Basquete',
    invalidScanDate: 'Escolha uma data válida para a varredura.',
  },
};

const ASANA_TASKS_CACHE_PREFIX = 'asanaTasksDay:';
const ASANA_TASKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ASANA_VIEW_TIMEZONE = 'America/Sao_Paulo';
const USA_ALL_SPORT_KEYS = ['american_football_usa', 'baseball_usa', 'basketball_usa'];

const state = {
  sports: [],
  polling: null,
  language: i18n[localStorage.getItem('uiLanguage')] ? localStorage.getItem('uiLanguage') : 'en',
  theme: localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark',
  loading: false,
  loadingTick: 0,
  loadingTimer: null,
  progressTimer: null,
  progress: 0,
  progressScanId: null,
  progressPeak: 0,
  flashPhaseAt: null,
  activeResultTab: 'problematic',
  issueFilter: 'all',
  activePanel: 'tasks',
  autoOpenDetails: false,
  scanStartedByUser: false,
  asanaReady: false,
  asanaConfigured: false,
  asanaDueOn: null,
  asanaViewDate: null,
  asanaTasks: [],
  asanaWarning: null,
  asanaLoading: false,
  asanaLoadSeq: 0,
  asanaAllowedByGroup: null,
  asanaScanQueue: [],
  asanaScanQueueTotal: 0,
  asanaScanQueueAdvancedFor: null,
  lastOpenedReportId: null,
  lastFailureAlertId: null,
  wasRunning: false,
  history: [],
  selectedHistoryId: null,
  pinnedHistoryReportId: null,
  reportSportFilter: 'all',
  reportExpandedSections: {},
  termDecisions: {},
  competitionRules: {},
  catalog365BySport: {},
  catalog365Loaded: false,
  scan365PresenceIndex: new Map(),
  presenceScanId: null,
  pendingTermsLeaveResolve: null,
  pendingTermsLeaveMode: '',
  dismissedTermsScanId: null,
  generatingReport: false,
  reportGenTimer: null,
  reportGenStepIndex: 0,
  finishingAsanaTask: false,
  search: '',
  currentScan: null,
};

const $ = (id) => document.getElementById(id);
const t = (key) => i18n[state.language][key] || i18n.en[key] || key;

function setLatestReportButtonVisible(isVisible) {
  const button = $('openLatestReport');
  if (!button) return;
  button.classList.toggle('hidden', !isVisible);
  if (isVisible) button.textContent = t('openLatestReport');
}

function normalizeAsanaGid(value) {
  return String(value || '').trim();
}

function resolveAsanaTaskSportKey(task = {}) {
  const name = String(task.name || '').trim();
  if (name === 'Daily US' || name === 'Daily USA') return 'usa_all';
  return task.sportKey || null;
}

function isUsaAllAsanaTask(task = {}) {
  return resolveAsanaTaskSportKey(task) === 'usa_all';
}

function usaAllSportsLabel() {
  return USA_ALL_SPORT_KEYS.map(key => sportLabel(key)).join(' · ');
}

function asanaUsSportsHintHtml(task = {}) {
  if (!isUsaAllAsanaTask(task)) return '';
  const keys = Array.isArray(task.usaAllSportKeys) && task.usaAllSportKeys.length
    ? task.usaAllSportKeys
    : USA_ALL_SPORT_KEYS;
  const label = keys.map(key => sportLabel(key)).join(' · ');
  return `<span class="asana-task-us-hint">${escapeHtml(label || t('asanaUsScanHint'))}</span>`;
}

function asanaQueueEntryFromTask(task = {}) {
  const sportKey = resolveAsanaTaskSportKey(task);
  return {
    gid: normalizeAsanaGid(task.gid),
    sportKey,
    suggestedScanDate: task.suggestedScanDate || null,
    scannerGroup: sportKey ? (task.scannerGroup || scannerGroupForSportKey(sportKey)) : null,
    assigneeEmail: task.assignee?.email || null,
    name: task.name || '',
    usaAllSportKeys: task.usaAllSportKeys || (sportKey === 'usa_all' ? USA_ALL_SPORT_KEYS : null),
  };
}

function asanaQueueHeadEntry() {
  return state.asanaScanQueue[0] || null;
}

function asanaQueueHeadGid() {
  return normalizeAsanaGid(asanaQueueHeadEntry()?.gid);
}

function findAsanaTaskByGid(gid) {
  const key = normalizeAsanaGid(gid);
  return state.asanaTasks.find(item => normalizeAsanaGid(item.gid) === key) || null;
}

function scanMatchesAsanaQueueHead(scan = {}) {
  if (!isAsanaScanQueueActive()) return false;
  return normalizeAsanaGid(scan.asanaTaskGid) === asanaQueueHeadGid();
}

function updateFinishAsanaTaskButton(scan = state.currentScan) {
  const button = $('finishAsanaTask');
  if (!button) return;
  const show = scan?.status === 'completed' && scan?.asanaTaskGid && !scan?.asanaCompletedAt;
  button.classList.toggle('hidden', !show);
  if (!show) return;
  button.disabled = state.finishingAsanaTask;
  const inQueue = scanMatchesAsanaQueueHead(scan);
  const isLastInQueue = inQueue && state.asanaScanQueue.length === 1;
  if (state.finishingAsanaTask) {
    button.textContent = t('finishingAsanaTask');
  } else if (inQueue && !isLastInQueue) {
    button.textContent = t('finishAsanaTaskNext');
  } else {
    button.textContent = t('finishAsanaTask');
  }
}

async function completeAsanaTaskForScan(scan, { advanceQueue = false } = {}) {
  if (!scan?.asanaTaskGid || scan.asanaCompletedAt || state.finishingAsanaTask) return scan;

  state.finishingAsanaTask = true;
  updateFinishAsanaTaskButton(scan);

  let updatedScan = scan;
  try {
    const data = await api(`/api/asana/tasks/${encodeURIComponent(normalizeAsanaGid(scan.asanaTaskGid))}/complete`, {
      method: 'POST',
      body: JSON.stringify({ scanId: scan.id }),
    });

    const completedAt = data.completedAt || new Date().toISOString();
    updatedScan = { ...scan, asanaCompletedAt: completedAt };
    state.currentScan = updatedScan;

    const historyIndex = state.history.findIndex(item => item.id === scan.id);
    if (historyIndex >= 0) {
      state.history[historyIndex] = { ...state.history[historyIndex], asanaCompletedAt: completedAt };
    }
    if (data.scan?.id === scan.id) {
      Object.assign(updatedScan, data.scan);
      state.currentScan = updatedScan;
    }

    renderHistoryList();
    updateFinishAsanaTaskButton(updatedScan);

    if (advanceQueue) {
      await maybeAdvanceAsanaScanQueueAfterFinish(updatedScan);
    }

    loadAsanaTasks({ fresh: true, silent: true }).catch(() => {});
  } catch (error) {
    alert(error.message);
  } finally {
    state.finishingAsanaTask = false;
    updateFinishAsanaTaskButton(state.currentScan);
  }

  return updatedScan;
}

async function finishAsanaTaskForScan() {
  const scan = state.currentScan;
  if (!scan?.asanaTaskGid || scan.asanaCompletedAt || state.finishingAsanaTask) return;
  await completeAsanaTaskForScan(scan, {
    advanceQueue: scanMatchesAsanaQueueHead(scan),
  });
}

function sportLabel(sport) {
  const key = typeof sport === 'string' ? sport : sport.key;
  return t(key) || (typeof sport === 'string' ? sport : sport.label);
}

const DAILY_REPORT_SPORT_NAMES = {
  en: {
    football: 'Football',
    basketball: 'Basketball',
    hockey: 'Hockey',
    tennis: 'Tennis',
    volleyball: 'Volley',
    all: 'All',
    usa_all: 'US',
    latam_all: 'LATAM',
    latam_football: 'LATAM Football',
    latam_basketball: 'LATAM Basketball',
    latam_hockey: 'LATAM Hockey',
    latam_volleyball: 'LATAM Volley',
    latam_tennis: 'LATAM Tennis',
    israel_football: 'Israel Football',
    israel_basketball: 'Israel Basketball',
    israel_all: 'Israel',
    basketball_usa: 'Basketball',
    american_football_usa: 'American Football',
    baseball_usa: 'Baseball',
  },
  pt: {
    football: 'Futebol',
    basketball: 'Basquete',
    hockey: 'Hockey',
    tennis: 'Tênis',
    volleyball: 'Vôlei',
    all: 'Todos',
    usa_all: 'EUA',
    latam_all: 'LATAM',
    latam_football: 'LATAM Futebol',
    latam_basketball: 'LATAM Basquete',
    latam_hockey: 'LATAM Hockey',
    latam_volleyball: 'LATAM Vôlei',
    latam_tennis: 'LATAM Tênis',
    israel_football: 'Israel Futebol',
    israel_basketball: 'Israel Basquete',
    israel_all: 'Israel',
    basketball_usa: 'Basquete',
    american_football_usa: 'Futebol Americano',
    baseball_usa: 'Beisebol',
  },
};

function formatScanDateDdMm(dateKey = '') {
  const match = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const [, , month, day] = match;
  return `${day}/${month}`;
}

function dailyReportSportName(sportKey = '') {
  const lang = state.language === 'pt' ? 'pt' : 'en';
  const names = DAILY_REPORT_SPORT_NAMES[lang];
  return names[sportKey] || sportLabel(sportKey) || sportKey;
}

function dailyReportTitle(scan) {
  const sport = dailyReportSportName(scan?.sport);
  const date = formatScanDateDdMm(scan?.date);
  return date ? `Daily ${sport} - ${date}` : `Daily ${sport}`;
}

function cleanReportCountry(value = '') {
  return String(value || '-')
    .replace(/^(football|futebol|basketball|basquete|hockey|volleyball|v[ôo]lei|tennis|t[êe]nis)\s*\/\s*/i, '')
    .trim() || '-';
}

const BRAND_VERSION = '20260624-logo2';
const BRAND_LOGOS = {
  '365': `/brand/365scores.png?v=${BRAND_VERSION}`,
  flash: `/brand/flashscore.png?v=${BRAND_VERSION}`,
  appLight: `/brand/logo-light.png?v=${BRAND_VERSION}`,
  appDark: `/brand/logo-dark.png?v=${BRAND_VERSION}`,
};

function updateBrandLogo() {
  const logo = document.querySelector('.brand-logo');
  if (!logo) return;
  logo.src = state.theme === 'light' ? BRAND_LOGOS.appLight : BRAND_LOGOS.appDark;
}

function reportSectionBrandLogo(tone = '') {
  if (tone === 'missing-365' || tone === 'brand-365') return BRAND_LOGOS['365'];
  if (tone === 'missing-flash' || tone === 'brand-flash') return BRAND_LOGOS.flash;
  return '';
}

function renderSectionHeading(title, tone = 'neutral') {
  const logo = reportSectionBrandLogo(tone);
  const marker = logo
    ? `<img class="section-brand-logo" src="${logo}" alt="">`
    : `<i class="issue-dot ${tone}"></i>`;
  return `<span class="report-section-heading">${marker}<span>${escapeHtml(title)}</span></span>`;
}

function renderMetricHeading(title, tone = 'neutral') {
  const logo = reportSectionBrandLogo(tone);
  if (!logo) return `<span><i class="issue-dot ${tone}"></i>${escapeHtml(title)}</span>`;
  return `<span class="report-metric-heading"><img class="metric-brand-logo" src="${logo}" alt=""><span>${escapeHtml(title)}</span></span>`;
}

function countryFlagHtml(countryName = '', size = 40) {
  const tennisLogo = window.CountryFlags?.getTennisScopeLogoUrl?.(countryName) || '';
  if (tennisLogo) {
    const safeSize = window.CountryFlags?.normalizeFlagSize?.(size) || (size <= 20 ? 20 : size <= 40 ? 40 : 80);
    const px = safeSize <= 20 ? 20 : 28;
    return `<img class="country-flag tennis-scope-logo" src="${tennisLogo}?v=${BRAND_VERSION}" alt="" loading="lazy" width="${px}" height="${px}" onerror="this.remove()">`;
  }

  const regionLogo = window.CountryFlags?.getRegionScopeLogoUrl?.(countryName) || '';
  if (regionLogo) {
    const safeSize = window.CountryFlags?.normalizeFlagSize?.(size) || (size <= 20 ? 20 : size <= 40 ? 40 : 80);
    const px = safeSize <= 20 ? 20 : 28;
    return `<img class="country-flag region-scope-logo" src="${regionLogo}?v=${BRAND_VERSION}" alt="" loading="lazy" width="${px}" height="${px}" onerror="this.remove()">`;
  }

  const url = window.CountryFlags?.getCountryFlagUrl?.(countryName, size) || '';
  if (!url) return '';
  const safeSize = window.CountryFlags?.normalizeFlagSize?.(size) || (size <= 20 ? 20 : size <= 40 ? 40 : 80);
  return `<img class="country-flag" src="${url}" alt="" loading="lazy" width="${Math.round(safeSize * 0.75)}" height="${Math.round(safeSize * 0.56)}" onerror="this.remove()">`;
}

function localizeCountryName(value = '') {
  const text = String(value || '').trim();
  if (!text || state.language !== 'pt') return text;
  const localized = window.CountryFlags?.getCountryDisplayName?.(text, 'pt');
  return localized || text;
}

function renderCountryHeading(countryName = '') {
  const flag = countryFlagHtml(countryName, 40);
  return `<span class="country-heading">${flag}<span>${escapeHtml(localizeCountryName(countryName))}</span></span>`;
}

function localizeReportText(value) {
  let text = String(value ?? '');
  if (!text) return text;

  const toEnglish = [
    [/\bDuplas\b/g, 'Doubles'],
    [/\bSimples\b/g, 'Singles'],
    [/\bMasculino\b/g, 'Men'],
    [/\bFeminino\b/g, 'Women'],
    [/\bQualificação\b/g, 'Qualification'],
    [/\bAlemanha\b/g, 'Germany'],
    [/\bItália\b/g, 'Italy'],
    [/\bEslováquia\b/g, 'Slovakia'],
    [/\bBrasil\b/g, 'Brazil'],
    [/\bPaíses Baixos\b/g, 'Netherlands'],
    [/\bGrã-Bretanha\b/g, 'Great Britain'],
    [/\bReino Unido\b/g, 'United Kingdom'],
    [/\bEspanha\b/g, 'Spain'],
    [/\bFrança\b/g, 'France'],
    [/\bArgentina\b/g, 'Argentina'],
    [/\bLondres\b/g, 'London'],
    [/\bsaibro\b/gi, 'clay'],
    [/\bgrama\b/gi, 'grass'],
    [/\bdura\b/gi, 'hard'],
    [/\bprograma(?:cao|ção)\b/gi, 'scheduled'],
    [/\bagendado\b/gi, 'scheduled'],
    [/\badiado\b/gi, 'postponed'],
    [/\bcancelado\b/gi, 'cancelled'],
    [/\bencerrado\b/gi, 'finished'],
  ];

  const toPortuguese = [
    [/\bDoubles\b/g, 'Duplas'],
    [/\bSingles\b/g, 'Simples'],
    [/\bMen\b/g, 'Masculino'],
    [/\bWomen\b/g, 'Feminino'],
    [/\bQualification\b/g, 'Qualificação'],
    [/\bGermany\b/g, 'Alemanha'],
    [/\bItaly\b/g, 'Itália'],
    [/\bSlovakia\b/g, 'Eslováquia'],
    [/\bBrazil\b/g, 'Brasil'],
    [/\bNetherlands\b/g, 'Países Baixos'],
    [/\bGreat Britain\b/g, 'Grã-Bretanha'],
    [/\bUnited Kingdom\b/g, 'Reino Unido'],
    [/\bSpain\b/g, 'Espanha'],
    [/\bFrance\b/g, 'França'],
    [/\bArgentina\b/g, 'Argentina'],
    [/\bLondon\b/g, 'Londres'],
    [/\bclay\b/gi, 'saibro'],
    [/\bgrass\b/gi, 'grama'],
    [/\bhard\b/gi, 'dura'],
    [/\bscheduled\b/gi, 'programação'],
    [/\bpostponed\b/gi, 'adiado'],
    [/\bcancelled\b/gi, 'cancelado'],
    [/\bcanceled\b/gi, 'cancelado'],
    [/\bfinished\b/gi, 'encerrado'],
  ];

  for (const [pattern, replacement] of state.language === 'pt' ? toPortuguese : toEnglish) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

function reportText(value) {
  return escapeHtml(localizeReportText(value));
}

function sourceText(value) {
  const text = String(value ?? '').trim();
  if (!text) return escapeHtml('-');
  const localized = localizeCountryName(text);
  if (localized !== text) return escapeHtml(localized);
  return escapeHtml(text);
}

function reportValueText(value) {
  return reportText(value || '-');
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatScraperSource(value) {
  const key = String(value || 'flashscore').toLowerCase();
  if (key === 'sofascore') return 'Sofascore';
  return 'Flashscore';
}

function reportDetailsHtml(scan) {
  const sportLabel = t(scan?.sport) || scan?.label || scan?.sport || '-';
  const queueLine = scanMatchesAsanaQueueHead(scan)
    ? `<span><b>${escapeHtml(asanaQueueProgressLabel())}</b></span>`
    : '';
  return `
    <span><b>${t('reportDetailScanner')}:</b> ${escapeHtml(formatScraperSource(scan?.scraperSource))}</span>
    <span><b>${t('reportDetailDate')}:</b> ${escapeHtml(scan?.date || '-')}</span>
    <span><b>${t('reportDetailSport')}:</b> ${escapeHtml(sportLabel)}</span>
    ${queueLine}
  `;
}

function updateLanguageFlag() {
  const flag = $('languageFlag');
  if (!flag) return;
  flag.src = `/api/flag/${state.language === 'pt' ? 'br' : 'us'}?s=20`;
}

function applyTheme() {
  const isLight = state.theme === 'light';
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';

  const icon = $('themeToggleIcon');
  if (icon) icon.textContent = isLight ? '🌙' : '☀️';

  const btn = $('themeToggle');
  if (btn) {
    const key = isLight ? 'themeDark' : 'themeLight';
    btn.dataset.i18nTitle = key;
    const label = t(key);
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }

  updateBrandLogo();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('uiTheme', state.theme);
  applyTheme();
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  $('languageSelect').value = state.language;
  updateLanguageFlag();

  document.querySelectorAll('[data-i18n]:not(option)').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('option[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const label = t(el.dataset.i18nTitle);
    el.title = label;
    el.setAttribute('aria-label', label);
  });

  applyTheme();
  rerenderSportSelects();
  renderHistoryList();
  renderScan(state.currentScan);
  renderTerms(state.currentScan);
  renderLeaveTermsDialog();
  renderReport(state.currentScan);
  renderRules().catch(console.error);
  updateHistoryReportBanner();
  renderAsanaTasks();
}

function shouldPinReport(scan) {
  if (!scan?.id || !scan?.result) return false;
  return state.history.some(item => item.id === scan.id) || scan.status === 'completed';
}

function restorePinnedHistoryReport() {
  const scanId = state.pinnedHistoryReportId;
  if (!scanId) return null;
  let scan = state.history.find(item => item.id === scanId);
  if (!scan && state.currentScan?.id === scanId) scan = state.currentScan;
  if (!scan?.result) {
    state.pinnedHistoryReportId = null;
    return null;
  }
  state.selectedHistoryId = scan.id;
  state.currentScan = scan;
  renderHistoryList();
  renderReport(scan);
  return scan;
}

function showPanel(panelName) {
  state.activePanel = panelName;
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === panelName);
  });
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active'));
  const panel = $(`${panelName}Panel`);
  if (panel) panel.classList.add('active');

  if (panelName === 'compare' && state.pinnedHistoryReportId) {
    const scan = restorePinnedHistoryReport();
    if (scan) $('reportOverlay').classList.remove('hidden');
  } else if (panelName !== 'compare' && isReportOpen()) {
    hideReportOverlay();
  }

  updateHistoryReportBanner();
}

async function goHome() {
  if (state.activePanel === 'tasks' && $('reportOverlay').classList.contains('hidden')) return;

  if (hasRunningScan()) {
    const shouldStopScan = await confirmStopRunningScan();
    if (!shouldStopScan) return;
    await cancelRunningScan().catch(e => alert(e.message));
  }

  const canLeave = await confirmLeaveTermsFix();
  if (!canLeave) return;

  if (!$('reportOverlay').classList.contains('hidden')) closeReport();
  showPanel('tasks');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scannerGroupForSportKey(sportKey = '') {
  const key = String(sportKey || '');
  if (key === 'usa_all' || key.endsWith('_usa')) return 'usa';
  if (key === 'latam_all' || key.startsWith('latam_')) return 'latam';
  if (key === 'israel_all' || key.startsWith('israel_')) return 'israel';
  return 'content';
}

function asanaAllowedByGroup(tasks = []) {
  const groups = { content: [], usa: [], latam: [], israel: [] };
  for (const task of tasks || []) {
    if (!task.mapped || !task.sportKey || task.completed) continue;
    const group = task.scannerGroup || scannerGroupForSportKey(task.sportKey);
    if (groups[group]) groups[group].push(task.sportKey);
  }

  const result = {};
  for (const [group, keys] of Object.entries(groups)) {
    const unique = [...new Set(keys)];
    result[group] = unique.length ? unique : null;
  }

  return Object.values(result).some(keys => keys?.length) ? result : null;
}

function todayIsoInAsanaTimezone() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ASANA_VIEW_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function resolveAsanaViewDate() {
  const stateValue = String(state.asanaViewDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(stateValue)) return stateValue;
  const inputValue = String($('asanaViewDate')?.value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) return inputValue;
  return todayIsoInAsanaTimezone();
}

function setAsanaViewDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate || ''))) return;
  state.asanaViewDate = isoDate;
  syncAsanaViewDateInput();
}

function syncAsanaViewDateInput() {
  const input = $('asanaViewDate');
  if (!input) return;
  const value = resolveAsanaViewDate();
  input.value = value;
}

function formatAsanaViewDateLabel(isoDate = '') {
  const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate || '—';
  if (state.language === 'pt') return `${match[3]}/${match[2]}/${match[1]}`;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function asanaNoTasksMessage() {
  const viewDate = resolveAsanaViewDate();
  if (viewDate === todayIsoInAsanaTimezone()) return t('asanaNoTasks');
  return t('asanaNoTasksForDate').replace('{date}', formatAsanaViewDateLabel(viewDate));
}

function formatAsanaDayNumber(dueOn = '') {
  const match = String(dueOn || resolveAsanaViewDate()).match(/^\d{4}-\d{2}-(\d{2})$/);
  return match ? String(Number(match[1])) : '—';
}

function updateAsanaStatusHint(message = '') {
  const hint = $('asanaStatusHint');
  if (!hint) return;
  hint.textContent = message;
}

function updateAsanaScanButtons() {
  // Manual scanner buttons are never gated by Asana; tasks panel is guidance only.
  for (const id of ['startScan', 'startUsaSportsScan', 'startLatamScan', 'startIsraelScan']) {
    const button = $(id);
    if (!button) continue;
    button.disabled = false;
    button.title = '';
  }
}

function renderAssignee(task = {}) {
  const name = String(task.assignee?.name || '').trim();
  if (!name) {
    return `<span class="asana-task-unassigned">${escapeHtml(t('asanaUnassigned'))}</span>`;
  }
  const firstName = name.split(/\s+/)[0];
  return escapeHtml(firstName);
}

function assigneeGroupKey(task = {}) {
  return task.assignee?.gid || '__unassigned__';
}

function assigneeGroupLabel(task = {}) {
  const name = String(task.assignee?.name || '').trim();
  return name || t('asanaUnassigned');
}

function groupAsanaTasksByAssignee(tasks = []) {
  const groups = [];
  const indexByKey = new Map();

  for (const task of tasks) {
    const key = assigneeGroupKey(task);
    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({
        key,
        label: assigneeGroupLabel(task),
        tasks: [],
      });
    }
    groups[indexByKey.get(key)].tasks.push(task);
  }

  return groups;
}

function renderAsanaTaskStatus(task = {}) {
  const statusClass = task.completed ? 'completed' : task.mapped ? 'pending' : 'unmapped';
  const statusLabel = task.completed
    ? t('taskCompleted')
    : task.mapped
      ? t('taskPending')
      : t('taskUnmapped');
  return { statusClass, statusLabel };
}

function findReportForAsanaTask(task = {}) {
  return state.history.find(record =>
    record?.status === 'completed' && record?.result && (
      (task.gid && String(record.asanaTaskGid || '') === String(task.gid)) ||
      (task.sportKey && record.sport === task.sportKey && record.date === task.suggestedScanDate)
    )
  ) || null;
}

function renderAsanaReportButton(task = {}) {
  const scan = findReportForAsanaTask(task);
  if (!scan) return '';
  return `<button type="button" class="secondary asana-report-button" data-asana-view-report="${scan.id}">${t('viewReport')}</button>`;
}

function renderAsanaTaskActions(task = {}, options = {}) {
  const { showScanButton = true } = options;
  const reportButton = renderAsanaReportButton(task);
  const scanDisabled = task.completed || !task.mapped;
  const scanButton = showScanButton
    ? `<button type="button" class="primary asana-scan-button" data-asana-scan="${task.gid}" ${scanDisabled ? 'disabled' : ''}>${t('scanTask')}</button>`
    : '';
  if (!reportButton && !scanButton) return '';
  return `<div class="asana-task-actions">${reportButton}${scanButton}</div>`;
}

function getScannableAsanaTasks(tasks = []) {
  return (tasks || []).filter(task => task.mapped && !task.completed);
}

function clearAsanaScanQueue() {
  state.asanaScanQueue = [];
  state.asanaScanQueueTotal = 0;
  state.asanaScanQueueAdvancedFor = null;
}

function asanaQueueProgressLabel() {
  if (!state.asanaScanQueue.length) return '';
  const total = state.asanaScanQueueTotal || state.asanaScanQueue.length;
  const currentIndex = total - state.asanaScanQueue.length + 1;
  const head = asanaQueueHeadEntry();
  const taskName = head?.name || findAsanaTaskByGid(head?.gid)?.name || '';
  return t('asanaQueueProgress')
    .replace('{current}', String(currentIndex))
    .replace('{total}', String(total))
    .replace('{task}', taskName);
}

function isAsanaScanQueueActive() {
  return state.asanaScanQueue.length > 0;
}

async function maybeAdvanceAsanaScanQueueAfterFinish(scan) {
  if (!isAsanaScanQueueActive() || !scan) return;
  if (!scan.asanaCompletedAt || !scan.asanaTaskGid) return;
  if (!scanMatchesAsanaQueueHead(scan)) return;
  if (state.asanaScanQueueAdvancedFor === scan.id) return;

  state.asanaScanQueueAdvancedFor = scan.id;
  state.asanaScanQueue.shift();

  if ($('reportOverlay') && !$('reportOverlay').classList.contains('hidden')) {
    closeReport();
  }

  if (!state.asanaScanQueue.length) {
    clearAsanaScanQueue();
    showPanel('tasks');
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 400));
  const started = await startScanFromAsanaTask(asanaQueueHeadEntry(), { fromQueue: true });
  if (!started) {
    alert(t('asanaQueueAdvanceFailed'));
    clearAsanaScanQueue();
  }
}

async function startAsanaScanQueue(taskGids = []) {
  if (hasRunningScan()) {
    alert(t('scanAlreadyRunning'));
    return;
  }

  const tasks = taskGids
    .map(gid => findAsanaTaskByGid(gid))
    .filter(task => task && task.mapped && !task.completed);

  if (!tasks.length) return;

  state.asanaScanQueue = tasks.map(asanaQueueEntryFromTask);
  state.asanaScanQueueTotal = state.asanaScanQueue.length;
  state.asanaScanQueueAdvancedFor = null;
  await startScanFromAsanaTask(asanaQueueHeadEntry(), { fromQueue: true });
}

function renderAsanaTaskRow(task = {}, options = {}) {
  const { showScanButton = true } = options;
  const { statusClass, statusLabel } = renderAsanaTaskStatus(task);
  const scanDate = task.suggestedScanDate || '';
  const asanaLink = task.permalink
    ? `<a class="asana-task-link" href="${task.permalink}" target="_blank" rel="noopener noreferrer">${t('openInAsana')}</a>`
    : '';
  const actions = renderAsanaTaskActions(task, { showScanButton });

  return `
    <div class="asana-task-row ${statusClass}" data-asana-task-gid="${task.gid}">
      <div class="asana-task-row-main">
        <strong class="asana-task-name">${task.name}</strong>
        <div class="asana-task-meta">
          <span class="asana-task-badge ${statusClass}">${statusLabel}</span>
          ${scanDate ? `<span class="asana-task-date">${t('asanaScanFor')} ${scanDate}</span>` : ''}
          ${asanaUsSportsHintHtml(task)}
          ${asanaLink}
        </div>
      </div>
      ${actions}
    </div>
  `;
}

function renderAsanaSingleTaskCard(task = {}) {
  const { statusClass, statusLabel } = renderAsanaTaskStatus(task);
  const assignee = renderAssignee(task);
  const scanDate = task.suggestedScanDate || '';
  const asanaLink = task.permalink
    ? `<a class="asana-task-link" href="${task.permalink}" target="_blank" rel="noopener noreferrer">${t('openInAsana')}</a>`
    : '';
  const actions = renderAsanaTaskActions(task);

  return `
    <article class="asana-task-card ${statusClass}" data-asana-task-gid="${task.gid}">
      <div class="asana-task-main">
        <strong class="asana-task-name">${task.name}</strong>
        <span class="asana-task-assignee">→ ${assignee}</span>
      </div>
      <div class="asana-task-meta">
        <span class="asana-task-badge ${statusClass}">${statusLabel}</span>
        ${scanDate ? `<span class="asana-task-date">${t('asanaScanFor')} ${scanDate}</span>` : ''}
        ${asanaUsSportsHintHtml(task)}
        ${asanaLink}
      </div>
      ${actions}
    </article>
  `;
}

function renderAsanaTaskGroup(group = {}) {
  const countLabel = t('asanaTaskCount').replace('{count}', String(group.tasks.length));
  const scannable = getScannableAsanaTasks(group.tasks);
  const scanAllLabel = t('scanAllTasks').replace('{count}', String(scannable.length));
  const footer = scannable.length
    ? `<footer class="asana-task-group-footer">
        <button type="button" class="primary asana-scan-button" data-asana-scan-all="${scannable.map(task => task.gid).join(',')}">${escapeHtml(scanAllLabel)}</button>
      </footer>`
    : '';

  return `
    <article class="asana-task-group">
      <header class="asana-task-group-header">
        <strong class="asana-task-group-name">${escapeHtml(group.label)}</strong>
        <span class="asana-task-group-count">${countLabel}</span>
      </header>
      <div class="asana-task-group-items">
        ${group.tasks.map(task => renderAsanaTaskRow(task, { showScanButton: false })).join('')}
      </div>
      ${footer}
    </article>
  `;
}

function renderAsanaTasks() {
  const list = $('asanaTasksList');
  const dayNumber = $('asanaDayNumber');
  if (!list) return;

  if (dayNumber) {
    dayNumber.textContent = formatAsanaDayNumber(state.asanaDueOn || resolveAsanaViewDate());
  }

  if (state.asanaLoading) {
    list.innerHTML = `<p class="empty-state">${t('asanaLoading')}</p>`;
    return;
  }

  if (!state.asanaConfigured && !state.asanaReady) {
    list.innerHTML = `<p class="empty-state">${t('asanaNotConfigured')}</p>`;
    return;
  }

  if (!state.asanaTasks.length) {
    list.innerHTML = `<p class="empty-state">${asanaNoTasksMessage()}</p>`;
    return;
  }

  list.innerHTML = groupAsanaTasksByAssignee(state.asanaTasks).map(group => (
    group.tasks.length > 1
      ? renderAsanaTaskGroup(group)
      : renderAsanaSingleTaskCard(group.tasks[0])
  )).join('');
}

function addDaysIsoClient(isoDate, deltaDays) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

function saveAsanaTasksCache(payload = {}) {
  const dueOn = payload.dueOn || resolveAsanaViewDate();
  try {
    localStorage.setItem(`${ASANA_TASKS_CACHE_PREFIX}${dueOn}`, JSON.stringify({
      savedAt: Date.now(),
      configured: payload.configured,
      ready: payload.ready,
      dueOn,
      tasks: payload.tasks || [],
      projectName: payload.projectName || null,
      hint: payload.hint || '',
    }));
  } catch (_) {
    // Ignore storage quota / private mode errors.
  }
}

function readAsanaTasksCache(dueOn = resolveAsanaViewDate()) {
  try {
    const raw = localStorage.getItem(`${ASANA_TASKS_CACHE_PREFIX}${dueOn}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.savedAt || Date.now() - cached.savedAt > ASANA_TASKS_CACHE_TTL_MS) return null;
    if (!Array.isArray(cached.tasks)) return null;
    if (cached.dueOn !== dueOn) return null;
    return cached;
  } catch (_) {
    return null;
  }
}

function applyAsanaDashboard(data = {}, { hint = '' } = {}) {
  state.asanaConfigured = Boolean(data.configured);
  state.asanaReady = Boolean(data.ready);
  state.asanaDueOn = data.dueOn || resolveAsanaViewDate();
  state.asanaTasks = data.tasks || [];
  state.asanaWarning = data.warning || null;
  state.asanaAllowedByGroup = asanaAllowedByGroup(state.asanaTasks);
  syncAsanaViewDateInput();

  if (!data.ready) {
    updateAsanaStatusHint(data.message || t('asanaNotConfigured'));
    return;
  }

  const hintParts = [
    hint || t('asanaDayHint'),
    data.projectName || null,
  ].filter(Boolean);
  updateAsanaStatusHint(hintParts.join(' · '));
}

function hydrateAsanaTasksFromCache(dueOn = resolveAsanaViewDate()) {
  const cached = readAsanaTasksCache(dueOn);
  if (!cached) return false;
  applyAsanaDashboard(cached, { hint: cached.hint || t('asanaDayHint') });
  rerenderSportSelects();
  updateAsanaScanButtons();
  renderAsanaTasks();
  return true;
}

function prefetchAsanaDays(centerDate = resolveAsanaViewDate()) {
  for (const delta of [-3, -2, -1, 1, 2, 3]) {
    const dueOn = addDaysIsoClient(centerDate, delta);
    if (readAsanaTasksCache(dueOn)) continue;
    api(`/api/asana/dashboard?dueOn=${encodeURIComponent(dueOn)}`)
      .then(data => {
        if (!data?.ready) return;
        saveAsanaTasksCache({
          ...data,
          dueOn: data.dueOn || dueOn,
          hint: [
            t('asanaDayHint'),
            data.projectName || null,
          ].filter(Boolean).join(' · '),
        });
      })
      .catch(() => {});
  }
}

async function loadAsanaTasks(options = {}) {
  if (!$('asanaTasksList')) return;

  const { fresh = false, silent = false } = options;
  const dueOn = resolveAsanaViewDate();
  const loadId = ++state.asanaLoadSeq;

  state.asanaLoading = true;
  if (!silent) {
    state.asanaTasks = [];
    state.asanaDueOn = dueOn;
    state.asanaAllowedByGroup = null;
    updateAsanaStatusHint(t('asanaLoading'));
    renderAsanaTasks();
  }

  try {
    const params = new URLSearchParams();
    params.set('dueOn', dueOn);
    if (fresh) params.set('fresh', '1');
    const data = await api(`/api/asana/dashboard?${params.toString()}`);
    if (loadId !== state.asanaLoadSeq) return;

    applyAsanaDashboard(data);
    saveAsanaTasksCache({
      ...data,
      dueOn: data.dueOn || dueOn,
      hint: [
        t('asanaDayHint'),
        data.projectName || null,
      ].filter(Boolean).join(' · '),
    });
    rerenderSportSelects();
    updateAsanaScanButtons();
    prefetchAsanaDays(dueOn);
  } catch (error) {
    if (loadId !== state.asanaLoadSeq) return;
    state.asanaTasks = [];
    state.asanaDueOn = dueOn;
    state.asanaAllowedByGroup = null;
    state.asanaWarning = null;
    updateAsanaStatusHint(`${t('asanaUnavailable')} ${error.message}`);
  } finally {
    if (loadId !== state.asanaLoadSeq) return;
    state.asanaLoading = false;
    renderAsanaTasks();
  }
}

function applyAsanaTaskToScanner(task = {}) {
  const sportKey = resolveAsanaTaskSportKey(task);
  const { suggestedScanDate, scannerGroup } = task;
  if (!sportKey) return;

  const group = scannerGroup || scannerGroupForSportKey(sportKey);

  if (group === 'usa') {
    if ($('usaSportSelect')) $('usaSportSelect').value = sportKey;
    if ($('usaSportsScanDate') && suggestedScanDate) $('usaSportsScanDate').value = suggestedScanDate;
    $('usaSportsControls')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  if (scannerGroup === 'latam') {
    if ($('latamSportSelect')) $('latamSportSelect').value = sportKey;
    if ($('latamScanDate') && suggestedScanDate) $('latamScanDate').value = suggestedScanDate;
    return;
  }

  if (scannerGroup === 'israel') {
    if ($('israelSportSelect')) $('israelSportSelect').value = sportKey;
    if ($('israelScanDate') && suggestedScanDate) $('israelScanDate').value = suggestedScanDate;
    return;
  }

  if ($('sportSelect')) $('sportSelect').value = sportKey;
  if ($('scanDate') && suggestedScanDate) $('scanDate').value = suggestedScanDate;
}

async function startScanFromAsanaTask(queueRef, { fromQueue = false } = {}) {
  const entry = typeof queueRef === 'object' && queueRef?.gid
    ? { ...queueRef, gid: normalizeAsanaGid(queueRef.gid) }
    : asanaQueueEntryFromTask(findAsanaTaskByGid(queueRef) || {});

  if (!entry.gid || !entry.sportKey) {
    if (fromQueue) alert(t('asanaQueueAdvanceFailed'));
    return false;
  }

  const liveTask = findAsanaTaskByGid(entry.gid);
  if (liveTask?.completed) {
    if (fromQueue) {
      state.asanaScanQueue.shift();
      if (state.asanaScanQueue.length) {
        return startScanFromAsanaTask(asanaQueueHeadEntry(), { fromQueue: true });
      }
    }
    return false;
  }

  if (!fromQueue) clearAsanaScanQueue();

  applyAsanaTaskToScanner({
    sportKey: entry.sportKey,
    suggestedScanDate: entry.suggestedScanDate,
    scannerGroup: entry.scannerGroup || liveTask?.scannerGroup || null,
  });
  showPanel('scan');

  await startScanForSport({
    sport: entry.sportKey,
    date: entry.suggestedScanDate,
    asanaTaskGid: entry.gid,
    operatorEmail: entry.assigneeEmail || liveTask?.assignee?.email || null,
  });
  return true;
}

function setupAsanaPanel() {
  syncAsanaViewDateInput();

  const onAsanaViewDateChange = () => {
    const nextDate = String($('asanaViewDate')?.value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) return;
    if (nextDate === state.asanaDueOn && state.asanaTasks.length && !state.asanaLoading) return;
    setAsanaViewDate(nextDate);
    const hadCache = hydrateAsanaTasksFromCache(nextDate);
    loadAsanaTasks({ silent: hadCache, fresh: false }).catch(error => alert(error.message));
  };

  $('asanaViewDate')?.addEventListener('change', onAsanaViewDateChange);

  $('asanaViewToday')?.addEventListener('click', () => {
    const today = todayIsoInAsanaTimezone();
    setAsanaViewDate(today);
    const hadCache = hydrateAsanaTasksFromCache(today);
    loadAsanaTasks({ silent: hadCache, fresh: false }).catch(error => alert(error.message));
  });

  $('refreshAsanaTasks')?.addEventListener('click', () => {
    setAsanaViewDate(resolveAsanaViewDate());
    loadAsanaTasks({ fresh: true }).catch(error => alert(error.message));
  });

  $('asanaTasksList')?.addEventListener('click', event => {
    const reportButton = event.target.closest('[data-asana-view-report]');
    if (reportButton) {
      const scanId = Number(reportButton.dataset.asanaViewReport);
      if (scanId) selectHistory(scanId);
      return;
    }

    const groupButton = event.target.closest('[data-asana-scan-all]');
    if (groupButton && !groupButton.disabled) {
      const gids = String(groupButton.dataset.asanaScanAll || '').split(',').filter(Boolean);
      startAsanaScanQueue(gids).catch(error => alert(error.message));
      return;
    }

    const button = event.target.closest('[data-asana-scan]');
    if (!button || button.disabled) return;
    startScanFromAsanaTask(button.dataset.asanaScan).catch(error => alert(error.message));
  });

  ['sportSelect', 'usaSportSelect', 'latamSportSelect', 'israelSportSelect'].forEach(id => {
    $(id)?.addEventListener('change', updateAsanaScanButtons);
  });
}

function isUsaSportKey(sportKey = '') {
  return String(sportKey).endsWith('_usa');
}

function hasUsaSportsSupport() {
  return state.sports.some(sport => isUsaSportKey(sport.key));
}

function hasUsaAllSupport() {
  return state.sports.some(sport => sport.key === 'usa_all');
}

function ensureUsaAllSupport() {
  if (hasUsaAllSupport()) return true;
  alert(t('usaAllServerRestart'));
  return false;
}

function ensureUsaSportsSupport() {
  if (hasUsaSportsSupport()) return true;
  alert(t('usaSportsServerRestart'));
  return false;
}

function usaSports(sports = state.sports) {
  return sports.filter(sport => isUsaSportKey(sport.key));
}

function hasLatamSupport() {
  return state.sports.some(sport => sport.key.startsWith('latam_'));
}

function latamSports(sports = state.sports) {
  return sports.filter(sport => sport.key === 'latam_football' || sport.key === 'latam_basketball');
}

function hasIsraelSupport() {
  return state.sports.some(sport => sport.key.startsWith('israel_'));
}

function israelSports(sports = state.sports) {
  return sports.filter(sport => sport.key === 'israel_football' || sport.key === 'israel_basketball');
}

function hasIsraelAllSupport() {
  return state.sports.some(sport => sport.key === 'israel_all');
}

function ensureIsraelAllSupport() {
  if (hasIsraelAllSupport()) return true;
  alert(t('israelAllServerRestart'));
  return false;
}

function ensureIsraelSupport() {
  if (hasIsraelSupport()) return true;
  alert(t('israelServerRestart'));
  return false;
}

function fillIsraelSportSelect(select, sports) {
  if (!select) return;
  const options = israelSports(sports);
  const allOption = `<option value="israel_all">${sportLabel('israel_all')}</option>`;
  select.innerHTML = allOption + options.map(sport => `<option value="${sport.key}">${sportLabel(sport.key)}</option>`).join('');
}

function hasLatamAllSupport() {
  return state.sports.some(sport => sport.key === 'latam_all');
}

function ensureLatamAllSupport() {
  if (hasLatamAllSupport()) return true;
  alert(t('latamAllServerRestart'));
  return false;
}

function ensureLatamSupport() {
  if (hasLatamSupport()) return true;
  alert(t('latamServerRestart'));
  return false;
}

function fillLatamSportSelect(select, sports) {
  if (!select) return;
  const options = latamSports(sports);
  const allOption = `<option value="latam_all">${sportLabel('latam_all')}</option>`;
  select.innerHTML = allOption + options.map(sport => `<option value="${sport.key}">${sportLabel(sport)}</option>`).join('');
}

function hasPendingTermsReport() {
  return state.currentScan?.status === 'terms_fix' &&
    state.dismissedTermsScanId !== state.currentScan.id;
}

function hasRunningScan() {
  return state.currentScan?.status === 'running';
}

function renderLeaveTermsDialog(mode = 'terms') {
  const title = $('leaveTermsTitle');
  const message = $('leaveTermsMessage');
  const stayButton = $('stayOnTerms');
  const leaveButton = $('confirmLeaveTerms');
  const isScanStop = mode === 'scan';

  if (title) title.textContent = isScanStop ? t('stopScanTitle') : t('leaveTermsTitle');
  if (message) message.textContent = isScanStop ? t('stopScanMessage') : t('leaveTermsMessage');
  if (stayButton) stayButton.textContent = isScanStop ? t('keepScanning') : t('stayOnTerms');
  if (leaveButton) leaveButton.textContent = isScanStop ? t('stopScan') : t('leavePage');
}

function closeLeaveTermsDialog(shouldLeave) {
  const overlay = $('leaveTermsOverlay');
  if (overlay) overlay.classList.add('hidden');
  const mode = state.pendingTermsLeaveMode;

  if (shouldLeave && mode === 'terms' && state.currentScan?.id) {
    state.dismissedTermsScanId = state.currentScan.id;
    state.scanStartedByUser = false;
    updateTermsTabVisibility();
  }

  const resolve = state.pendingTermsLeaveResolve;
  state.pendingTermsLeaveResolve = null;
  state.pendingTermsLeaveMode = '';

  if (!shouldLeave && mode === 'terms' && state.currentScan?.status === 'terms_fix') {
    renderTerms(state.currentScan);
    showPanel('terms');
  }

  if (resolve) resolve(shouldLeave);
}

function confirmLeaveTermsFix() {
  if (!hasPendingTermsReport()) return Promise.resolve(true);

  renderLeaveTermsDialog('terms');
  const overlay = $('leaveTermsOverlay');
  if (!overlay) return Promise.resolve(window.confirm(t('leaveTermsMessage')));

  overlay.classList.remove('hidden');
  $('stayOnTerms')?.focus();

  return new Promise(resolve => {
    state.pendingTermsLeaveMode = 'terms';
    state.pendingTermsLeaveResolve = resolve;
  });
}

function confirmStopRunningScan() {
  if (!hasRunningScan()) return Promise.resolve(false);

  renderLeaveTermsDialog('scan');
  const overlay = $('leaveTermsOverlay');
  if (!overlay) return Promise.resolve(window.confirm(t('stopScanMessage')));

  overlay.classList.remove('hidden');
  $('stayOnTerms')?.focus();

  return new Promise(resolve => {
    state.pendingTermsLeaveMode = 'scan';
    state.pendingTermsLeaveResolve = resolve;
  });
}

async function cancelRunningScan() {
  await api('/api/scan', { method: 'DELETE' });
  if (state.polling) {
    clearInterval(state.polling);
    state.polling = null;
  }
  state.currentScan = null;
  state.wasRunning = false;
  state.scanStartedByUser = false;
  state.dismissedTermsScanId = null;
  state.autoOpenDetails = false;
  state.progressScanId = null;
  state.progressPeak = 0;
  setLoading(false);
  updateProgress(0);
  setStatus('', t('idle'));
  setLatestReportButtonVisible(false);
  renderScan(null);
}

function updateCompareTabVisibility() {
  $('compareTab').classList.remove('hidden');
}

function updateTermsTabVisibility() {
  const tab = $('termsTab');
  if (!tab) return;
  tab.classList.toggle('hidden', !hasPendingTermsReport());
}

function setStatus(status, text) {
  const el = $('scanState');
  if (!el) return;
  el.className = `status-pill ${status || ''}`;
  el.textContent = text;
}

function setLoading(isLoading) {
  state.loading = isLoading;
  $('loadingOverlay').classList.toggle('hidden', !isLoading);
  document.querySelectorAll('button, input, select').forEach(el => {
    if (el.id === 'languageSelect') return;
    if (['stayOnTerms', 'confirmLeaveTerms', 'stopScanFromLoading'].includes(el.id)) return;
    el.disabled = isLoading;
  });

  if (state.loadingTimer) {
    clearInterval(state.loadingTimer);
    state.loadingTimer = null;
  }
  if (state.progressTimer) {
    clearInterval(state.progressTimer);
    state.progressTimer = null;
  }

  if (isLoading) {
    const runningScan = state.currentScan?.status === 'running' ? state.currentScan : null;
    if (runningScan) {
      updateProgress(progressFromScan(runningScan));
      updateLoadingFromScan(runningScan);
    } else {
      updateProgress(0);
      updateLoadingFromScan(null);
    }

    if (!state.progressTimer) {
      state.progressTimer = setInterval(() => {
        if (!state.loading) return;
        const scan = state.currentScan?.status === 'running' ? state.currentScan : null;
        if (!scan) return;
        updateProgress(progressFromScan(scan));
        updateLoadingFromScan(scan);
      }, 500);
    }
  } else if (state.progressTimer) {
    clearInterval(state.progressTimer);
    state.progressTimer = null;
    state.flashPhaseAt = null;
  }
}

function scanLogText(scan) {
  return (scan?.logs || []).join('\n');
}

function resetProgressForScan(scan) {
  if (!scan?.id) return;
  if (state.progressScanId !== scan.id) {
    state.progressScanId = scan.id;
    state.progressPeak = 0;
  }
}

function scrapePhaseFlags(scan) {
  const text = scanLogText(scan);
  const lower = text.toLowerCase();

  return {
    lower,
    has365Start: /\|\s*365:|▶[^\n]*\|\s*365/i.test(text),
    hasFlashStart: /\|\s*flashscore:|flashscore-/i.test(text),
    has365Done: /saved successfully|done\. 365scores/i.test(lower),
    hasFlashSaved: /arquivo salvo:/i.test(lower) || /saved successfully to:.*flashscore/i.test(lower),
    hasFlashChildDone: /scraper finished/i.test(lower),
    hasFlashServerDone: /✅[^\n]*\|\s*flashscore finished/i.test(lower),
    hasLatamFilter: /filtering latam/i.test(lower),
    hasIsraelFilter: /filtering israel/i.test(lower),
    hasMemorySkipped: /competition memory skipped/i.test(lower),
    hasCompare: /comparing results|comparing latam|comparing israel|running comparison/i.test(lower),
    hasCompareDone: /comparison finished|concluído!/i.test(lower),
    hasXlsxSkipped: /xlsx ignorado/i.test(lower),
    hasAllSports: scan?.sport === 'all' || /executando: run-all\.js/i.test(lower),
  };
}

function flashSubProgress(lower) {
  let progress = 42;

  if (lower.includes('starting flashscore')) progress = 46;
  if (lower.includes('abrindo página flashscore')) progress = 48;
  if (lower.includes('página carregada')) progress = 50;
  if (lower.includes('selecionando data')) progress = 52;
  if (lower.includes('data selecionada')) progress = 54;
  if (lower.includes('carregando jogos')) progress = 58;
  if (lower.includes('extração da página concluída')) progress = 76;
  if (lower.includes('extraindo jogos do dom')) progress = 78;
  if (lower.includes('extração concluída:')) progress = 81;
  if (lower.includes('salvando arquivo json')) progress = 80;
  if (lower.includes('formatando json')) progress = 79;
  if (lower.includes('fechando navegador')) progress = 83;
  if (lower.includes('navegador fechado')) progress = 84;
  if (lower.includes('scraper finished')) progress = 86;
  if (lower.includes('found ') && lower.includes('match nodes')) progress = 77;

  const scrollMatches = lower.match(/scrolling [\w-]+?\.\.\.\s*(\d+)\/(\d+)/g) || [];
  if (scrollMatches.length) {
    const last = scrollMatches[scrollMatches.length - 1].match(/(\d+)\/(\d+)/);
    if (last) {
      const current = Number(last[1]) || 0;
      const total = Number(last[2]) || 12;
      progress = Math.max(progress, Math.min(74, 50 + Math.floor((current / total) * 24)));
    }
  }

  const showMatches = lower.match(/show matches clicks:\s*(\d+)/i);
  if (showMatches) {
    const clicks = Number(showMatches[1]) || 0;
    progress = Math.max(progress, Math.min(78, 54 + Math.floor(clicks * 0.4)));
  }

  const rounds = lower.match(/rodada\s+(\d+)/gi) || [];
  if (rounds.length) {
    const lastRound = Number((rounds[rounds.length - 1].match(/\d+/) || [0])[0]) || 0;
    progress = Math.max(progress, Math.min(76, 50 + lastRound * 5));
  }

  if (lower.includes('total de nodes') || lower.includes('total de jogos lidos')) {
    progress = Math.max(progress, 78);
  }

  return progress;
}

function progressFromScan(scan) {
  if (!scan) return 0;
  if (scan.status === 'completed' || scan.status === 'terms_fix') return 100;
  if (scan.status !== 'running') return state.progressScanId === scan.id ? (state.progressPeak || 0) : 0;

  resetProgressForScan(scan);

  let progress = 5;
  const flags = scrapePhaseFlags(scan);

  if (flags.hasAllSports) {
    const sportRuns = (flags.lower.match(/executando: scrapers\//g) || []).length;
    const compares = (flags.lower.match(/xlsx salvo|comparacao_amanha|comparing/g) || []).length;
    progress = Math.min(92, 8 + sportRuns * 8 + compares * 6);
    if (flags.lower.includes('all sports scan completed')) progress = 98;
  } else {
    if (flags.has365Start) progress = 12;
    if (flags.has365Done) progress = 38;

    if (flags.hasFlashStart) {
      const flashProgress = flashSubProgress(flags.lower);
      progress = flags.has365Done || !flags.has365Start
        ? flashProgress
        : Math.max(progress, Math.min(flashProgress, 36));
    }

    if (flags.has365Start && flags.hasFlashStart && !flags.hasFlashServerDone) {
      const scores365Progress = flags.has365Done ? 38 : 18;
      progress = Math.max(scores365Progress, flashSubProgress(flags.lower));
    }

    if (flags.hasFlashSaved) progress = 78;
    if (flags.hasFlashChildDone) progress = 82;
    if (flags.hasFlashServerDone) progress = 85;
    if (flags.hasMemorySkipped) progress = 86;
    if (flags.hasLatamFilter) progress = 86;
    if (flags.hasCompare) progress = 90;
    if (flags.lower.includes('comparando:') || flags.lower.includes('comparing:')) progress = 92;
    if (flags.hasCompareDone) progress = 96;
  }

  if (flags.lower.includes('waiting for terms fix')) progress = 98;

  if (flags.hasFlashStart && !flags.hasFlashServerDone) {
    if (!state.flashPhaseAt || state.progressScanId !== scan.id) {
      state.flashPhaseAt = Date.now();
    }
    const elapsed = (Date.now() - state.flashPhaseAt) / 1000;
    const creepCap = Math.min(76, flashSubProgress(flags.lower) + 4);
    const creep = Math.min(creepCap, 46 + Math.floor(elapsed * 0.4));
    progress = Math.max(progress, creep);
  } else if (state.progressScanId === scan.id) {
    state.flashPhaseAt = null;
  }

  state.progressPeak = Math.max(state.progressPeak || 0, progress);
  return state.progressPeak;
}

function loadingStepModel(scan) {
  const flags = scrapePhaseFlags(scan || { logs: [] });
  const isLatam = String(scan?.sport || '').startsWith('latam_');
  const isIsrael = String(scan?.sport || '').startsWith('israel_') || scan?.sport === 'israel_all';
  const isAll = scan?.sport === 'all';

  const steps = [
    { id: 'start', label: t('stepStart') },
    { id: '365', label: t('loading365') },
    { id: 'flash', label: t('loadingFlash') },
  ];

  if (isLatam) {
    steps.push({ id: 'latam', label: t('stepLatamFilter') });
  }
  if (isIsrael) {
    steps.push({ id: 'israel', label: t('stepIsraelFilter') });
  }

  steps.push({ id: 'compare', label: t('loadingCompare') });
  steps.push({ id: 'done', label: t('loadingFinal') });

  let active = 'start';
  if (!scan || scan.status === 'terms_fix' || scan.status === 'completed') {
    active = 'done';
  } else if (flags.hasCompare || flags.hasMemorySkipped || flags.hasFlashServerDone) {
    active = 'compare';
  } else if (flags.hasLatamFilter) {
    active = 'latam';
  } else if (flags.hasIsraelFilter) {
    active = 'israel';
  } else if (flags.hasFlashStart) {
    active = 'flash';
  } else if (flags.has365Start) {
    active = '365';
  } else if (scan.status === 'running') {
    active = 'start';
  }

  const activeIndex = steps.findIndex(step => step.id === active);

  return steps.map((step, index) => ({
    ...step,
    status: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }));
}

function renderLoadingSteps(scan) {
  const list = $('loadingSteps');
  if (!list) return;

  list.innerHTML = loadingStepModel(scan).map(step => `
    <li class="loading-step ${step.status}">
      <span class="loading-step-marker" aria-hidden="true">${step.status === 'done' ? '✓' : step.status === 'active' ? '…' : ''}</span>
      <span class="loading-step-label">${escapeHtml(step.label)}</span>
    </li>
  `).join('');
}

function updateProgress(value) {
  state.progress = Math.max(0, Math.min(100, Math.round(value)));
  const bar = $('loadingProgress');
  const text = $('loadingProgressText');
  if (bar) bar.style.width = `${state.progress}%`;
  if (text) text.textContent = `${state.progress}%`;
}

function loadingStageFromScan(scan) {
  if (!scan) return 'starting';

  const logs = (scan.logs || []).join('\n').toLowerCase();

  if (
    logs.includes('waiting for terms fix') ||
    logs.includes('aguardando') ||
    logs.includes('terms fix') ||
    scan.status === 'terms_fix'
  ) {
    return 'loadingFinal';
  }

  if (
    logs.includes('comparing results') ||
    logs.includes('comparando') ||
    logs.includes('running comparison') ||
    logs.includes('comparison still running') ||
    logs.includes('comparison finished') ||
    logs.includes('gerando xlsx') ||
    logs.includes('competition memory skipped') ||
    logs.includes('filtering latam') ||
    logs.includes('filtering israel') ||
    logs.includes('all sports scan completed') ||
    /✅[^\n]*\|\s*flashscore finished/i.test(logs)
  ) {
    return 'loadingCompare';
  }

  const flashStarted = logs.includes('flashscore') || logs.includes('| flash');
  const scores365Started = logs.includes('365scores') || logs.includes('| 365') || logs.includes('365-football') || logs.includes('365-');

  if (flashStarted && !logs.includes('comparing') && !logs.includes('comparando')) {
    return scores365Started ? 'loadingFlash' : 'loadingFlash';
  }

  if (scores365Started) return 'loading365';

  return scan.status === 'running' ? 'starting' : 'loadingFinal';
}

function isNoisyScanDetailLine(line) {
  const text = String(line || '').trim();
  if (!text) return true;
  if (/^⏳\s/.test(text)) return true;
  if (/^scrolling\b/i.test(text)) return true;
  if (/^pass\s+\d+\s*\/\s*\d+/i.test(text)) return true;
  if (/^rodada\s+\d+/i.test(text)) return true;
  if (/show matches clicks:/i.test(text)) return true;
  if (/cliques em ["']show matches["']/i.test(text)) return true;
  return false;
}

function pickUserFacingScanLogLine(lines) {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (!isNoisyScanDetailLine(lines[i])) return lines[i];
  }
  return '';
}

function latestScanLogLine(scan) {
  const lines = (scan?.logs || [])
    .flatMap(chunk => String(chunk || '').split('\n'))
    .map(line => line.trim())
    .filter(Boolean);

  const flashMarker = lines.findIndex(line => /\|\s*flashscore:|flashscore-|starting flashscore/i.test(line));
  if (flashMarker >= 0) {
    const flashLines = lines.slice(flashMarker).filter(line => !/^⏳\s/.test(line));
    const relevant = flashLines.filter(line =>
      !/saved successfully to:.*365/i.test(line.toLowerCase()) &&
      !/done\. 365scores/i.test(line.toLowerCase())
    );
    const picked = pickUserFacingScanLogLine(relevant);
    if (picked) return picked;
  }

  return pickUserFacingScanLogLine(lines);
}

function updateLoadingFromScan(scan) {
  const flags = scrapePhaseFlags(scan || { logs: [] });
  let stage = loadingStageFromScan(scan);
  if (
    stage === 'loadingFlash' &&
    (flags.hasFlashSaved || flags.hasFlashChildDone) &&
    !flags.hasFlashServerDone
  ) {
    $('loadingMessage').textContent = t('stepFinishingFlash');
  } else {
    $('loadingMessage').textContent = t(stage);
  }

  const detail = $('loadingDetail');
  const lastLine = latestScanLogLine(scan);
  if (detail) {
    detail.textContent = lastLine || '';
    detail.classList.toggle('hidden', !lastLine);
  }

  renderLoadingSteps(scan);
}

function updateLoadingMessage() {
  updateLoadingFromScan(state.currentScan);
}

function fillSportSelect(select, sports) {
  const current = select.value;
  select.innerHTML = sports.map(s => `<option value="${s.key}">${sportLabel(s)}</option>`).join('');
  if (current) select.value = current;
}

function mainScannerSports(sports = []) {
  return sports.filter(sport =>
    !isUsaSportKey(sport.key) &&
    !sport.key.startsWith('latam_') &&
    !sport.key.startsWith('israel_') &&
    sport.key !== 'usa_all'
  );
}

function fillUsaSportSelect(select, sports) {
  if (!select) return;
  const options = usaSports(sports);
  const allOption = `<option value="usa_all">${sportLabel('usa_all')}</option>`;
  select.innerHTML = allOption + options.map(sport => `<option value="${sport.key}">${sportLabel(sport)}</option>`).join('');
}

function isMultiSportReport(scan) {
  return scan?.sport === 'all' || scan?.sport === 'usa_all' || scan?.sport === 'latam_all' || scan?.sport === 'israel_all';
}

function rerenderSportSelects() {
  if (!state.sports.length) return;

  fillSportSelect($('sportSelect'), mainScannerSports(state.sports));

  fillSportSelect($('ruleSport'), state.sports.filter(sport =>
    sport.key !== 'all' && !sport.key.startsWith('latam_') && !sport.key.startsWith('israel_')
  ));

  fillUsaSportSelect($('usaSportSelect'), state.sports);
  fillLatamSportSelect($('latamSportSelect'), state.sports);
  fillIsraelSportSelect($('israelSportSelect'), state.sports);

  updateAsanaScanButtons();
}

function renderSummary(scan) {
  const summary = normalizedSummary(scan);
  const fields = ['total365', 'totalFlash', 'matched'];
  for (const field of fields) {
    $(field).textContent = summary[field] ?? '-';
  }

  const files = scan?.result?.files || {};
  const hasFiles = Object.keys(files).length > 0;
  const scanId = scan?.id ? `&scanId=${encodeURIComponent(scan.id)}` : '';
  $('outputFiles').innerHTML = hasFiles ? `
    <a class="download-button" href="/api/download?file=json365${scanId}" download>⬇ ${t('download365')}</a>
    <a class="download-button" href="/api/download?file=jsonFlash${scanId}" download>⬇ ${t('downloadFlash')}</a>
    <a class="download-button" href="/api/download?file=xlsx${scanId}" download>⬇ ${t('downloadXlsx')}</a>
  ` : `<p class="hint">${t('noFiles')}</p>`;
}

function historyName(scan) {
  if (scan?.historyName) return scan.historyName;
  if (!scan?.date || !scan?.sport) return String(scan?.id || '');
  return `${String(scan.date).replaceAll('-', '_')}_${scan.sport === 'all' ? 'Allsports' : scan.sport === 'usa_all' ? 'Usa_all' : scan.sport === 'latam_all' ? 'Latam_all' : scan.sport === 'israel_all' ? 'Israel_all' : scan.sport}`;
}

function historyDisplayParts(scan) {
  const rawName = historyName(scan);
  const match = String(rawName).match(/^(\d{4})_(\d{2})_(\d{2})_(.+)$/);
  if (!match) {
    return {
      date: rawName,
      category: sportLabel(scan?.sport) || '',
    };
  }

  const [, year, month, day, rawCategory] = match;
  const normalizedCategory = rawCategory.toLowerCase() === 'allsports'
    ? 'All sports'
    : rawCategory.toLowerCase() === 'usa_all'
      ? sportLabel('usa_all')
      : rawCategory.toLowerCase() === 'latam_all'
        ? sportLabel('latam_all')
        : rawCategory.toLowerCase() === 'israel_all'
          ? sportLabel('israel_all')
      : sportLabel(rawCategory.toLowerCase()) || rawCategory;

  return {
    date: `${year}-${month}-${day}`,
    category: normalizedCategory,
  };
}

function renderHistoryList() {
  const list = $('historyList');
  if (!list) return;

  if (!state.history.length) {
    list.innerHTML = `<p class="empty-state">${t('noHistory')}</p>`;
    return;
  }

  list.innerHTML = state.history.map(scan => {
    const parts = historyDisplayParts(scan);
    return `
      <div class="history-row ${scan.id === state.selectedHistoryId ? 'active' : ''}" data-history-id="${scan.id}" role="button" tabindex="0">
        <span class="history-main">
          <span class="history-date">${escapeHtml(parts.date)}</span>
          <span class="history-category">${escapeHtml(parts.category)}</span>
        </span>
        <span class="history-meta">
          <button class="history-action-button" data-rename-history="${scan.id}" type="button">Rename</button>
          <button class="history-action-button danger" data-delete-history="${scan.id}" type="button">Delete</button>
          <span class="history-action">View Report</span>
          <span class="history-chevron" aria-hidden="true">›</span>
        </span>
      </div>
    `;
  }).join('');
}

async function renameHistory(button) {
  const scanId = Number(button.dataset.renameHistory);
  const scan = state.history.find(item => item.id === scanId);
  if (!scan) return;

  const nextName = prompt('Rename history report', historyName(scan));
  if (nextName === null) return;

  const data = await api('/api/history', {
    method: 'PUT',
    body: JSON.stringify({ id: scanId, historyName: nextName }),
  });
  state.history = data.history || [];
  renderHistoryList();
}

async function deleteHistory(button) {
  const scanId = Number(button.dataset.deleteHistory);
  const scan = state.history.find(item => item.id === scanId);
  if (!scan) return;
  if (!confirm(`Delete "${historyName(scan)}" from history?`)) return;

  const data = await api('/api/history', {
    method: 'DELETE',
    body: JSON.stringify({ id: scanId }),
  });
  state.history = data.history || [];
  if (state.selectedHistoryId === scanId) {
    state.selectedHistoryId = null;
    state.currentScan = null;
  }
  if (state.pinnedHistoryReportId === scanId) {
    state.pinnedHistoryReportId = null;
    hideReportOverlay();
  }
  renderHistoryList();
}

function selectHistory(scanId) {
  const scan = state.history.find(item => item.id === scanId);
  if (!scan) return;

  state.selectedHistoryId = scan.id;
  state.currentScan = scan;
  renderHistoryList();
  setLatestReportButtonVisible(Boolean(scan.result));
  openReport(scan);
}

async function refreshHistory() {
  const data = await api('/api/history');
  state.history = data.history || [];
  renderHistoryList();
  renderAsanaTasks();
}

function openReportFromUrl() {
  const scanId = Number(new URLSearchParams(location.search).get('scanId'));
  if (!scanId) return;

  const scan = state.history.find(item => item.id === scanId);
  if (!scan?.result) return;

  openReport(scan, { force: true });

  const url = new URL(location.href);
  url.searchParams.delete('scanId');
  const next = `${url.pathname}${url.search}${url.hash}`;
  history.replaceState({}, '', next || url.pathname);
}

async function load365CompetitionCatalogs() {
  try {
    const data = await api('/api/365-competitions');
    const catalogs = data.catalogs || {};
    state.catalog365BySport = {};
    for (const [sport, rows] of Object.entries(catalogs)) {
      state.catalog365BySport[sport] = buildCatalogIndexFromRows(Array.isArray(rows) ? rows : []);
    }
    state.catalog365Loaded = true;
  } catch (error) {
    console.warn('365Scores competition catalogs unavailable:', error.message);
    state.catalog365BySport = {};
    state.catalog365Loaded = false;
  }
}

function buildCatalogIndexFromRows(rows = []) {
  const byScope = new Map();
  for (const item of rows) {
    const scopeKey = footballCatalogScopeKey(item.country || '');
    const entry = {
      id: String(item.id ?? ''),
      competition: item.competition || '',
      country: item.country || '',
      scopeKey,
      competitionKey: normalizeRuleCompetition(item.competition || ''),
    };
    if (!entry.competitionKey) continue;
    if (!byScope.has(scopeKey)) byScope.set(scopeKey, []);
    byScope.get(scopeKey).push(entry);
  }
  return byScope;
}

function resolveCatalogSportKey(sportKey = '') {
  const key = String(sportKey || '').trim();
  if (!key) return null;
  if (key.startsWith('latam_')) return resolveCatalogSportKey(key.slice(6));
  if (key.startsWith('israel_')) return resolveCatalogSportKey(key.slice(7));
  if (key.endsWith('_usa')) return resolveCatalogSportKey(key.slice(0, -4));
  return state.catalog365BySport[key] ? key : null;
}

function matchesCatalogCompetition(catalogRow, competition = '') {
  const competitionKey = normalizeRuleCompetition(competition);
  if (!competitionKey) return false;
  if (catalogRow.competitionKey === competitionKey) return true;
  if (catalogRow.competitionKey.startsWith(`${competitionKey} `) || competitionKey.startsWith(`${catalogRow.competitionKey} `)) {
    return true;
  }
  return diceSimilarity(catalogRow.competition, competition) >= 0.72;
}

function competitionIn365Catalog(sportKey = '', scope = '', competition = '') {
  const catalogSport = resolveCatalogSportKey(sportKey);
  if (!catalogSport) return null;
  const index = state.catalog365BySport[catalogSport];
  if (!index) return null;

  const scopeKey = catalogScopeKeyForSport(sportKey, scope);
  const rows = index.get(scopeKey) || [];
  if (!rows.length) return false;
  return rows.some(item => matchesCatalogCompetition(item, competition));
}

function currentReportRows(scan) {
  const details = scan?.result?.details || buildClientDetails(scan);
  return {
    problematic: details.problematic || [],
    matched: details.matched || [],
  };
}

function metricCardsHtml(scan, summaryOverride = null) {
  const summary = { ...(summaryOverride || normalizedSummary(scan)) };
  const visibleRows = currentReportRows(scan);
  const visibleProblematic = filterReportRows(visibleRows.problematic || [], scan, { includeIgnored: false });
  const visibleMatched = filterReportRows(visibleRows.matched || [], scan, { includeIgnored: false });
  const visibleTimeDiff = visibleProblematic.filter(row => row.type === 'timeDiff');
  const totalTarget = isMultiSportReport(scan) ? 'all-sports' : '';
  summary.only365 = visibleProblematic.filter(row => row.type === 'only365').length;
  summary.onlyFlash = visibleProblematic.filter(row => row.type === 'onlyFlash').length;
  summary.statusDiff = visibleProblematic.filter(row => row.type === 'statusDiff').length;
  summary.timeDiff = visibleTimeDiff.length;
  summary.matched = visibleMatched.length + (isTennisReportContext(scan) ? visibleTimeDiff.length : 0);
  const timeMetricCard = isTennisReportContext(scan) ? '' : `
      <article class="metric report-filter-card-toggle" data-report-card-target="time"><span><i class="issue-dot time"></i>${t('timeDiff')}</span><strong>${summary.timeDiff ?? 0}</strong></article>`;
  return `
    <div class="grid results report-metrics">
      <article class="metric report-filter-card-toggle" data-report-card-target="${totalTarget}">${renderMetricHeading(t('total365'), 'brand-365')}<strong>${summary.total365 ?? 0}</strong></article>
      <article class="metric report-filter-card-toggle" data-report-card-target="${totalTarget}">${renderMetricHeading(t('totalFlash'), 'brand-flash')}<strong>${summary.totalFlash ?? 0}</strong></article>
      <article class="metric report-filter-card-toggle" data-report-card-target="matched"><span><i class="issue-dot matched"></i>${t('matchedCount')}</span><strong>${summary.matched ?? 0}</strong></article>
      <article class="metric report-filter-card-toggle" data-report-card-target="missing-365">${renderMetricHeading(t('missing365'), 'missing-365')}<strong>${summary.onlyFlash ?? 0}</strong></article>
      <article class="metric report-filter-card-toggle" data-report-card-target="missing-flash">${renderMetricHeading(t('missingFlash'), 'missing-flash')}<strong>${summary.only365 ?? 0}</strong></article>${timeMetricCard}
      <article class="metric report-filter-card-toggle" data-report-card-target="status"><span><i class="issue-dot status"></i>${t('statusDiff')}</span><strong>${summary.statusDiff ?? 0}</strong></article>
    </div>
  `;
}

function reportTimeValue(row) {
  const value = row.time365 || row.timeFlash || row.time || '';
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

function reportSportIndex(row) {
  const sportKey = row.sport || '';
  const order = ['football', 'basketball', 'basketball_usa', 'american_football_usa', 'baseball_usa', 'latam_football', 'latam_basketball', 'latam_all', 'israel_football', 'israel_basketball', 'israel_all', 'hockey', 'volleyball', 'tennis'];
  const index = order.indexOf(sportKey);
  if (index !== -1) return index;

  const dynamicIndex = state.sports.findIndex(sport => sport.key === sportKey);
  return dynamicIndex === -1 ? Number.MAX_SAFE_INTEGER : dynamicIndex;
}

function sortedReportRows(rows) {
  return [...rows].sort((a, b) => {
    const sportDiff = reportSportIndex(a) - reportSportIndex(b);
    if (sportDiff !== 0) return sportDiff;
    const diff = reportTimeValue(a) - reportTimeValue(b);
    if (diff !== 0) return diff;
    return searchableText(a).localeCompare(searchableText(b));
  });
}

function reportSportFiltersHtml(scan) {
  const sports = scan?.result?.sports || [];
  if (!isMultiSportReport(scan) || !sports.length) return '';

  const groupLabel = scan.sport === 'usa_all'
    ? sportLabel('usa_all')
    : scan.sport === 'latam_all'
      ? sportLabel('latam_all')
      : scan.sport === 'israel_all'
        ? sportLabel('israel_all')
        : sportLabel('all');

  const option = (key, label) => `
    <button class="segment ${state.reportSportFilter === key ? 'active' : ''}" data-report-sport-filter="${key}">
      ${escapeHtml(label)}
    </button>
  `;

  return `
    <details class="report-section report-toggle filter-controls" data-report-section="filters" data-report-open-key="${escapeHtml(reportOpenKey('section', 'filters'))}">
      <summary><span><i class="issue-dot neutral"></i>${t('sportFilter')}</span><strong>${sports.length + 1}</strong></summary>
      <div class="report-filter-card">
        <div class="segmented report-sport-filter">
          ${option('all', groupLabel)}
          ${sports.map(sport => option(sport.sport, sportLabel(sport.sport))).join('')}
        </div>
      </div>
    </details>
  `;
}

function normalizeRuleText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[:.!?_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRuleScope(value = '') {
  const key = window.CountryFlags?.resolveScopeKey?.(value);
  if (key) return key;
  const normalized = normalizeRuleText(String(value || '').replace(/[()]/g, ' '));
  return ['', '*', 'all', 'all competitions', 'world', 'mundo', 'international', 'internacional', 'global'].includes(normalized)
    ? '*'
    : normalized;
}

function normalizeRuleCompetition(value = '') {
  return normalizeRuleText(value)
    .replace(/\b(singles|doubles|simples|duplas)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function footballCatalogScopeKey(value = '') {
  const normalized = normalizeRuleScope(cleanReportCountry(value || ''));
  const aliases = {
    '*': 'international',
    world: 'international',
    mundial: 'international',
    global: 'international',
    intl: 'international',
  };
  return aliases[normalized] || normalized;
}

function compactSimilarityText(value = '') {
  return normalizeRuleCompetition(value).replace(/\s+/g, '');
}

function diceSimilarity(left = '', right = '') {
  const a = compactSimilarityText(left);
  const b = compactSimilarityText(right);
  if (!a || !b) return a === b ? 1 : 0;
  if (a === b) return 1;
  if (a.length === 1 || b.length === 1) return a === b ? 1 : 0;

  const counts = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const gram = a.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }

  let shared = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const gram = b.slice(i, i + 2);
    const count = counts.get(gram) || 0;
    if (!count) continue;
    shared += 1;
    counts.set(gram, count - 1);
  }

  return (2 * shared) / (a.length + b.length - 2);
}

function resolveCoreSportKey(sportKey = '') {
  const key = String(sportKey || '').trim();
  if (key === 'latam_all' || key === 'israel_all') return key;
  if (key.startsWith('latam_')) return key.slice(6);
  if (key.startsWith('israel_')) return key.slice(7);
  return key;
}

function catalogScopeKeyForSport(sportKey = '', scope = '') {
  const cleaned = cleanReportCountry(scope || '');
  if (resolveCoreSportKey(sportKey) === 'tennis') return normalizeRuleScope(cleaned);
  return footballCatalogScopeKey(cleaned);
}

function competitionMatches365Index(scopeSet, competition = '') {
  const competitionKey = normalizeRuleCompetition(competition);
  if (!competitionKey || !scopeSet) return false;
  if (scopeSet.has(competitionKey)) return true;

  for (const itemKey of scopeSet) {
    if (itemKey.startsWith(`${competitionKey} `) || competitionKey.startsWith(`${itemKey} `)) return true;
    if (diceSimilarity(itemKey, competitionKey) >= 0.72) return true;
  }

  return false;
}

function buildScan365PresenceIndex(scan) {
  const index = new Map();
  const entries = scan?.result?.countries || [];

  for (const entry of entries) {
    const sport = entry.sport || scan?.sport || '';
    if (!sport || sport === 'all' || sport === 'usa_all' || sport === 'latam_all' || sport === 'israel_all') continue;

    const result = entry.result || {};
    const scopeKey = catalogScopeKeyForSport(sport, entry.country || '');

    const addCompetition = (competitionName = '') => {
      const competitionKey = normalizeRuleCompetition(competitionName);
      if (!competitionKey) return;
      if (!index.has(sport)) index.set(sport, new Map());
      const byScope = index.get(sport);
      if (!byScope.has(scopeKey)) byScope.set(scopeKey, new Set());
      byScope.get(scopeKey).add(competitionKey);
    };

    for (const pair of result.matched_pairs || []) addCompetition(pair.competition365);
    for (const game of result.so_no_365 || []) addCompetition(game.competicao || game.competition);
  }

  return index;
}

function ensureScan365PresenceIndex(scan) {
  const scanId = scan?.id || null;
  if (state.presenceScanId !== scanId) {
    state.scan365PresenceIndex = buildScan365PresenceIndex(scan);
    state.presenceScanId = scanId;
  }
  return state.scan365PresenceIndex;
}

function competitionInScan365Presence(sport, scope, competition, scan) {
  ensureScan365PresenceIndex(scan);
  const scopeKey = catalogScopeKeyForSport(sport, scope);
  const competitionKey = normalizeRuleCompetition(competition);
  if (!competitionKey) return false;

  const sportKeys = [sport];
  const coreSport = resolveCoreSportKey(sport);
  if (coreSport && coreSport !== sport) sportKeys.push(coreSport);

  for (const sportKey of sportKeys) {
    const byScope = state.scan365PresenceIndex.get(sportKey);
    if (!byScope) continue;

    const scopeSet = byScope.get(scopeKey);
    if (scopeSet && competitionMatches365Index(scopeSet, competition)) return true;
  }

  return false;
}

function has365CatalogForSport(sportKey = '') {
  const catalogSport = resolveCatalogSportKey(sportKey);
  if (!catalogSport) return false;
  return Boolean(state.catalog365BySport[catalogSport]);
}

function competition365CoversLeague(sport, scope, competition, scan) {
  if (competitionIn365Catalog(sport, scope, competition) === true) return true;
  if (competitionInScan365Presence(sport, scope, competition, scan)) return true;
  return false;
}

function isTrackableFriendlyCompetition(competition = '') {
  const key = normalizeRuleCompetition(competition);
  if (!key) return false;
  const exact = new Set([
    'club friendly',
    'friendly international',
    'club friendlies',
    'international friendlies',
    'amistoso internacional',
    'amistosos internacionais',
    'amistoso de clube',
    'amistosos de clube',
    'amistoso de clubes',
    'amistosos de clubes',
  ]);
  if (exact.has(key)) return true;
  if (key.startsWith('club friendly')) return true;
  if (key.startsWith('friendly international')) return true;
  if (key.startsWith('amistoso internacional')) return true;
  if (key.startsWith('amistoso de clube') || key.startsWith('amistoso de clubes')) return true;
  return false;
}

function isOutside365Catalog(row, scan) {
  const sport = row.sport || scan?.sport || '';
  if (!sport || sport === 'all' || sport === 'usa_all' || sport === 'latam_all' || sport === 'israel_all' || row.type !== 'onlyFlash') {
    return false;
  }

  const scope = cleanReportCountry(row.country || '');
  const competition = row.competitionFlash || row.competition || '';
  if (!scope || !competition) return false;

  if (isTrackableFriendlyCompetition(competition)) return false;
  if (competition365CoversLeague(sport, scope, competition, scan)) return false;
  if (!has365CatalogForSport(sport)) return false;
  return true;
}

function catalogBadgeHtml(row, scan) {
  if (row.type !== 'onlyFlash') return '';
  const sport = row.sport || scan?.sport || '';
  const scope = cleanReportCountry(row.country || '');
  const competition = row.competitionFlash || row.competition || '';
  if (!scope || !competition) return '';

  const covered = competition365CoversLeague(sport, scope, competition, scan);
  const outside = isOutside365Catalog(row, scan);
  if (!covered && !outside) return '';

  const label = outside ? t('catalogOutsideBadge') : t('catalogCoveredBadge');
  const tone = outside ? 'outside' : 'covered';
  return `<span class="catalog-badge ${tone}">${escapeHtml(label)}</span>`;
}

function ruleCompetitionMatches(ruleCompetition = '', rowCompetition = '') {
  const ruleKey = normalizeRuleCompetition(ruleCompetition);
  const rowKey = normalizeRuleCompetition(rowCompetition);
  if (!ruleKey || !rowKey) return false;
  if (ruleKey === '*' || ruleKey === rowKey) return true;
  return rowKey.startsWith(`${ruleKey} `);
}

function reportIgnoreSideForTone(tone = '') {
  if (tone === 'missing-365') return 'flash';
  if (tone === 'missing-flash') return '365';
  return '';
}

function findIgnoreRuleIndex(sport, side, scope, competition) {
  const sportRules = state.competitionRules[sport] || {};
  const rules = side === '365' ? (sportRules.ignore365Only || []) : (sportRules.ignoreFlashOnly || []);
  const rowScope = normalizeRuleScope(scope || '');
  const rowCompetition = competition || '';
  return rules.findIndex(rule => {
    const ruleScope = normalizeRuleScope(rule.scope || '');
    const scopeMatches = ruleScope === '*' || ruleScope === rowScope;
    return scopeMatches && ruleCompetitionMatches(rule.competition || '', rowCompetition);
  });
}

function rowIgnoredByRule(row, scan) {
  const rowSport = row.sport || scan?.sport || '';
  const sportRules = state.competitionRules[rowSport] || {};
  const rowScope = normalizeRuleScope(row.country || '');
  const competitions = [
    row.competition,
    row.competition365,
    row.competitionFlash,
  ].map(value => String(value || '').trim()).filter(Boolean);

  if (!competitions.length) return false;

  // Ignore rules are stored per side, but an ignored competition should leave the report entirely.
  const lists = [
    ...(sportRules.ignoreFlashOnly || []),
    ...(sportRules.ignore365Only || []),
  ];
  if (!lists.length) return false;

  return lists.some(rule => {
    const ruleScope = normalizeRuleScope(rule.scope || '');
    const scopeMatches = ruleScope === '*' || ruleScope === rowScope;
    if (!scopeMatches) return false;
    return competitions.some(competition => ruleCompetitionMatches(rule.competition || '', competition));
  });
}

function rowAcknowledged365Only(row, scan) {
  const rowSport = row.sport || scan?.sport || '';
  const sportRules = state.competitionRules[rowSport] || {};
  const rules = sportRules.acknowledged365Only || [];
  if (!rules.length || row.type !== 'only365') return false;

  const rowScope = normalizeRuleScope(row.country || '');
  const rowCompetition = row.competition365 || row.competition || '';

  return rules.some(rule => {
    const ruleScope = normalizeRuleScope(rule.scope || '');
    const scopeMatches = ruleScope === '*' || ruleScope === rowScope;
    return scopeMatches && ruleCompetitionMatches(rule.competition || '', rowCompetition);
  });
}

function rowAcknowledgedFlashOnly(row, scan) {
  const rowSport = row.sport || scan?.sport || '';
  const sportRules = state.competitionRules[rowSport] || {};
  const rules = sportRules.acknowledgedFlashOnly || [];
  if (!rules.length || row.type !== 'onlyFlash') return false;

  const rowScope = normalizeRuleScope(row.country || '');
  const rowCompetition = row.competitionFlash || row.competition || '';

  return rules.some(rule => {
    const ruleScope = normalizeRuleScope(rule.scope || '');
    const scopeMatches = ruleScope === '*' || ruleScope === rowScope;
    return scopeMatches && ruleCompetitionMatches(rule.competition || '', rowCompetition);
  });
}

function isPlaceholderParticipant(value = '') {
  const text = normalizeRuleText(value);
  return !text ||
    text === 'fro' ||
    text === 'srf' ||
    text === 'somente resultado final' ||
    text === 'somente o resultado final' ||
    /^\d{1,2}\s+\d{2}\s*fro$/.test(text) ||
    /^\d{1,2}\s+\d{2}\s*srf$/.test(text);
}

function rowHasPlaceholderTeams(row) {
  const sides = [
    [row.home, row.away],
    [row.home365, row.away365],
    [row.homeFlash, row.awayFlash],
  ];
  return sides.some(([home, away]) => (
    (home || away) &&
    (isPlaceholderParticipant(home) || isPlaceholderParticipant(away))
  ));
}

function ignoredSuggestionKey({ sport, scope, competition, side = 'flash' }) {
  return [
    sport || '',
    side || '',
    normalizeRuleScope(scope || ''),
    normalizeRuleCompetition(competition || ''),
  ].join('|||');
}

function hasMissing365Term(scan, sport, scope, competition) {
  const scopeNorm = normalizeRuleScope(scope || '');
  const compNorm = normalizeRuleCompetition(competition || '');
  if (!compNorm) return false;

  return (scan?.terms || []).some(term => (
    term.type === 'missing_365' &&
    (term.sport || scan?.sport || '') === (sport || '') &&
    normalizeRuleScope(term.scope || '') === scopeNorm &&
    normalizeRuleCompetition(term.valueFlash || '') === compNorm
  ));
}

function missing365TermHandled(term, scan) {
  if (term.type !== 'missing_365') return false;

  return isTermFixSuppressed(
    scan,
    term.sport || scan?.sport || '',
    term.scope || '',
    term.valueFlash || ''
  );
}

function isTermFixSuppressed(scan, sport, scope, competition) {
  const scopeNorm = normalizeRuleScope(scope || '');
  const compNorm = normalizeRuleCompetition(competition || '');
  if (!compNorm) return false;

  if ((scan?.termFixSuppressed || []).some(item => (
    (item.sport || '') === (sport || '') &&
    normalizeRuleScope(item.scope || '') === scopeNorm &&
    normalizeRuleCompetition(item.competition || '') === compNorm
  ))) {
    return true;
  }

  const entries = scan?.result?.countries || [];
  for (const entry of entries) {
    const entrySport = entry.sport || scan?.sport || '';
    if (entrySport !== sport) continue;
    if (normalizeRuleScope(entry.country || '') !== scopeNorm) continue;

    const pairs = entry.result?.matched_pairs || [];
    for (const pair of pairs) {
      const flashComp = normalizeRuleCompetition(pair.competitionFlash || '');
      const comp365 = normalizeRuleCompetition(pair.competition365 || '');
      if (flashComp === compNorm || comp365 === compNorm) return true;
      if (flashComp && (compNorm.startsWith(`${flashComp} `) || flashComp.startsWith(`${compNorm} `))) return true;
      if (comp365 && (compNorm.startsWith(`${comp365} `) || comp365.startsWith(`${compNorm} `))) return true;
      if (flashComp && diceSimilarity(flashComp, compNorm) >= 0.85) return true;
      if (comp365 && diceSimilarity(comp365, compNorm) >= 0.85) return true;
    }
  }

  return false;
}

function buildIgnoredCompetitionSuggestions(scan) {
  // Bulk onlyFlash leagues belong in the Missing on 365 report, not Term Fix.
  return [];
}

function ignoredSuggestionsHtml(scan) {
  const suggestions = buildIgnoredCompetitionSuggestions(scan);
  if (!suggestions.length) return '';

  return `
    <div class="ignored-suggestions">
      <div class="ignored-suggestions-head">
        <h3>${t('ignoredSuggestionsTitle')}</h3>
        <p class="hint">${t('ignoredSuggestionsHint')}</p>
      </div>
      <div class="terms-table ignored-suggestions-table">
        <div class="terms-row header ignored-suggestion-row">
          <span>${t('sport')}</span>
          <span>${t('termScope')}</span>
          <span>${t('competition')}</span>
          <span>${t('status')}</span>
        </div>
        ${suggestions.map(item => `
          <div class="terms-row ignored-suggestion-row">
            <span><span class="badge">${escapeHtml(sportLabel(item.sport))}</span></span>
            <span>${sourceText(item.scope)}</span>
            <span>${reportText(item.competition)}</span>
            <span class="term-actions">
              <small>${t('missing365')} · ${item.count} ${t('ignoredSuggestionReason')}</small>
              <button
                class="segment active"
                data-ignore-suggestion
                data-side="${escapeHtml(item.side || 'flash')}"
                data-sport="${escapeHtml(item.sport)}"
                data-scope="${escapeHtml(item.scope)}"
                data-competition="${escapeHtml(item.competition)}"
              >${t('addIgnoredSuggestion')}</button>
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function reportSummaryForFilter(scan) {
  if (!isMultiSportReport(scan) || state.reportSportFilter === 'all') {
    return normalizedSummary(scan);
  }

  const sportSummary = (scan.result?.sports || []).find(row => row.sport === state.reportSportFilter);
  return sportSummary ? {
    total365: sportSummary.total365 ?? 0,
    totalFlash: sportSummary.totalFlash ?? 0,
    matched: sportSummary.matched ?? 0,
    only365: sportSummary.only365 ?? 0,
    onlyFlash: sportSummary.onlyFlash ?? 0,
    timeDiff: sportSummary.timeDiff ?? 0,
    statusDiff: sportSummary.statusDiff ?? 0,
    nameDiff: sportSummary.nameDiff ?? 0,
  } : normalizedSummary(scan);
}

function filterReportRows(rows, scan, options = {}) {
  const includeIgnored = options.includeIgnored === true;
  let nextRows = rows || [];
  if (isMultiSportReport(scan) && state.reportSportFilter !== 'all') {
    nextRows = nextRows.filter(row => row.sport === state.reportSportFilter);
  }
  return nextRows.filter(row =>
    !rowHasPlaceholderTeams(row) &&
    !isOutside365Catalog(row, scan) &&
    (includeIgnored || !rowIgnoredByRule(row, scan))
  );
}

function isTennisReportContext(scan) {
  return scan?.sport === 'tennis' || (isMultiSportReport(scan) && state.reportSportFilter === 'tennis');
}

function comparisonSideData(row, side) {
  const is365 = side === '365';
  const isMissing = (is365 && row.type === 'onlyFlash') || (!is365 && row.type === 'only365');
  const home = is365
    ? (row.home365 || row.home || '')
    : (row.homeFlash || row.home || '');
  const away = is365
    ? (row.away365 || row.away || '')
    : (row.awayFlash || row.away || '');
  const competition = is365
    ? (row.competition365 || row.competition || '')
    : (row.competitionFlash || row.competition || '');
  const time = is365
    ? (row.time365 || (row.type === 'only365' ? row.time : ''))
    : (row.timeFlash || (row.type === 'onlyFlash' ? row.time : ''));
  const status = is365
    ? (row.status365 || row.status || '')
    : (row.statusFlash || (row.type === 'onlyFlash' ? row.status : ''));
  const value = row.type === 'statusDiff' ? status : time;

  return { isMissing, home, away, competition, value, status };
}

function renderComparisonSide(row, side) {
  const data = comparisonSideData(row, side);
  if (data.isMissing) {
    return `
      <div class="comparison-cell missing-side">
        <strong>-</strong>
      </div>
    `;
  }

  return `
    <div class="comparison-cell">
      <strong>${sourceText(data.home)} / ${sourceText(data.away)}</strong>
      <span>${reportValueText(data.value || '-')}</span>
    </div>
  `;
}

function renderReportDetailRow(row) {
  return `
    <div class="comparison-row ${row.type || ''}">
      ${renderComparisonSide(row, '365')}
      ${renderComparisonSide(row, 'flash')}
    </div>
  `;
}

function reportCompetitionName(row) {
  return row.type === 'matched'
    ? (row.competition365 || row.competition || row.competitionFlash || '-')
    : (row.competition || row.competition365 || row.competitionFlash || '-');
}

function reportCompetition365Name(row) {
  return row.competition365 || (row.type === 'only365' ? row.competition : '') || reportCompetitionName(row);
}

function reportCompetitionFlashName(row) {
  return row.competitionFlash || (row.type === 'onlyFlash' ? row.competition : '') || reportCompetitionName(row);
}

function reportCompetitionGroupKey(row) {
  const countryName = cleanReportCountry(row.country);
  return [
    row.sport || '',
    countryName,
    String(reportCompetition365Name(row)).toLowerCase(),
    String(reportCompetitionFlashName(row)).toLowerCase(),
  ].join('|||');
}

function renderSourceHeader(group, side, tone) {
  const is365 = side === '365';
  const isMissingSide = (is365 && tone === 'missing-365') || (!is365 && tone === 'missing-flash');
  const logo = is365 ? BRAND_LOGOS['365'] : BRAND_LOGOS.flash;
  const alt = is365 ? '365Scores' : 'Flashscore';
  const competition = is365 ? group.competition365 : group.competitionFlash;
  const label = isMissingSide ? '-' : sourceText(competition);

  return `
    <span class="source-heading">
      <span class="source-logo-wrap"><img src="${logo}" alt="${alt}"></span>
      <span class="source-name"><small>${label}</small></span>
    </span>
  `;
}

function competitionIgnoreMenuHtml(group, tone = '', scan = null) {
  const side = reportIgnoreSideForTone(tone);
  if (!side) return '';
  const sample = group?.rows?.[0];
  if (!sample) return '';

  const sport = sample.sport || scan?.sport || '';
  if (!sport || sport === 'all' || sport === 'usa_all' || sport === 'latam_all' || sport === 'israel_all') {
    return '';
  }

  const scope = cleanReportCountry(sample.country || group.country || '');
  const competition = side === '365'
    ? (group.competition365 || sample.competition365 || sample.competition || '')
    : (group.competitionFlash || sample.competitionFlash || sample.competition || '');
  if (!scope || !competition) return '';

  return `
    <span class="competition-action-menu" data-competition-menu>
      <button type="button" class="competition-menu-toggle" data-competition-menu-toggle aria-label="${escapeHtml(t('competitionIgnoreMenu'))}" title="${escapeHtml(t('competitionIgnoreMenu'))}">⋯</button>
      <span class="competition-menu-dropdown" hidden>
        <button type="button"
          data-competition-ignore-action="ignore"
          data-sport="${escapeHtml(sport)}"
          data-side="${side}"
          data-scope="${escapeHtml(scope)}"
          data-competition="${escapeHtml(competition)}">${escapeHtml(t('ignoreCompetition'))}</button>
      </span>
    </span>
  `;
}

function groupedReportRowsHtml(rows, tone = 'neutral', scan = null) {
  const countries = new Map();
  for (const row of sortedReportRows(rows)) {
    const countryName = cleanReportCountry(row.country);
    const countryKey = `${row.sport || ''}|||${String(countryName).toLowerCase()}`;
    if (!countries.has(countryKey)) {
      countries.set(countryKey, {
        country: countryName,
        rows: [],
        competitions: new Map(),
      });
    }

    const country = countries.get(countryKey);
    const competitionKey = reportCompetitionGroupKey(row);
    if (!country.competitions.has(competitionKey)) {
      country.competitions.set(competitionKey, {
        country: countryName,
        competition: reportCompetitionName(row),
        competition365: reportCompetition365Name(row),
        competitionFlash: reportCompetitionFlashName(row),
        rows: [],
      });
    }

    country.rows.push(row);
    country.competitions.get(competitionKey).rows.push(row);
  }

  return `
    <div class="competition-groups">
      ${[...countries.values()].map(country => {
        const countryKey = `${country.rows[0]?.sport || ''}|||${String(country.country).toLowerCase()}`;
        const countryOpenKey = reportOpenKey('section', tone, 'country', countryKey);
        return `
        <details class="country-toggle competition-block ${tone}" data-report-open-key="${escapeHtml(countryOpenKey)}">
          <summary class="competition-heading">
            <span>${renderCountryHeading(country.country)}</span>
            <strong>${country.rows.length}</strong>
          </summary>
          <div class="country-competition-list">
            ${[...country.competitions.values()].map(group => {
              const competitionKey = reportCompetitionGroupKey(group.rows[0]);
              const competitionOpenKey = reportOpenKey('section', tone, 'country', countryKey, 'comp', competitionKey);
              return `
              <details class="competition-toggle ${tone}" data-report-open-key="${escapeHtml(competitionOpenKey)}">
                <summary>
                  <span>
                    ${sourceText(group.competition)}
                    ${scan ? catalogBadgeHtml(group.rows[0], scan) : ''}
                  </span>
                  <span class="competition-summary-meta">
                    ${competitionIgnoreMenuHtml(group, tone, scan)}
                    <strong>${group.rows.length}</strong>
                  </span>
                </summary>
                <div class="comparison-table">
                  <div class="comparison-header">
                    ${renderSourceHeader(group, '365', tone)}
                    ${renderSourceHeader(group, 'flash', tone)}
                  </div>
                  ${group.rows.map(row => renderReportDetailRow(row)).join('')}
                </div>
              </details>
            `;
            }).join('')}
          </div>
        </details>
      `;
      }).join('')}
    </div>
  `;
}

function reportOpenKey(...parts) {
  return parts.filter(part => part !== undefined && part !== null && part !== '').join('::');
}

function activeReportScanId() {
  return state.pinnedHistoryReportId || state.currentScan?.id || null;
}

function ensureReportExpandedSet(scanId = activeReportScanId()) {
  const key = String(scanId ?? '');
  if (!key) return null;
  if (!state.reportExpandedSections[key]) state.reportExpandedSections[key] = new Set();
  return state.reportExpandedSections[key];
}

function syncReportOpenKey(details) {
  const openKey = details?.dataset?.reportOpenKey;
  const expanded = ensureReportExpandedSet();
  if (!openKey || !expanded) return;
  if (details.open) expanded.add(openKey);
  else expanded.delete(openKey);
}

function captureReportExpandedSections(scanId = activeReportScanId()) {
  const key = String(scanId ?? '');
  if (!key || !isReportOpen()) return;
  const expanded = new Set();
  document.querySelectorAll('#reportContent details[open][data-report-open-key]').forEach(details => {
    expanded.add(details.dataset.reportOpenKey);
  });
  state.reportExpandedSections[key] = expanded;
}

function applyReportExpandedSections(scanId = activeReportScanId()) {
  const expanded = state.reportExpandedSections[String(scanId ?? '')];
  if (!expanded?.size) return;
  document.querySelectorAll('#reportContent details[data-report-open-key]').forEach(details => {
    if (expanded.has(details.dataset.reportOpenKey)) details.open = true;
  });
}

function reportRowsHtml(title, rows, tone = 'neutral', open = false, scan = null) {
  if (!rows.length && ['time', 'status'].includes(tone)) return '';

  const sectionOpenKey = reportOpenKey('section', tone);

  if (!rows.length) return `
    <details class="report-section report-toggle empty-section ${tone}" data-report-section="${tone}" data-report-open-key="${escapeHtml(sectionOpenKey)}" ${open ? 'open' : ''}>
      <summary>${renderSectionHeading(title, tone)}<strong>0</strong></summary>
      <p class="empty-state">${t('noMatches')}</p>
    </details>
  `;

  return `
    <details class="report-section report-toggle ${tone}" data-report-section="${tone}" data-report-open-key="${escapeHtml(sectionOpenKey)}" ${open ? 'open' : ''}>
      <summary>${renderSectionHeading(title, tone)}<strong>${rows.length}</strong></summary>
      ${groupedReportRowsHtml(rows, tone, scan)}
    </details>
  `;
}

function allSportsHtml(scan) {
  const sports = state.reportSportFilter === 'all'
    ? (scan?.result?.sports || [])
    : (scan?.result?.sports || []).filter(row => row.sport === state.reportSportFilter);
  if (!sports.length) return '';
  const sectionLabel = scan?.sport === 'usa_all'
    ? sportLabel('usa_all')
    : scan?.sport === 'latam_all'
      ? sportLabel('latam_all')
      : scan?.sport === 'israel_all'
        ? sportLabel('israel_all')
        : sportLabel('all');
  return `
    <details class="report-section report-toggle all-sports" data-report-section="all-sports" data-report-open-key="${escapeHtml(reportOpenKey('section', 'all-sports'))}">
      <summary><span><i class="issue-dot neutral"></i>${sectionLabel}</span><strong>${sports.length}</strong></summary>
      <div class="details-table all-sports-table">
        <div class="details-row header">
          <span>${t('sport')}</span>
          <span>${t('total365')}</span>
          <span>${t('totalFlash')}</span>
          <span>${t('matchedCount')}</span>
          <span>${t('missingFlash')}</span>
          <span>${t('missing365')}</span>
          <span>${t('status')}</span>
        </div>
        ${sports.map(row => `
          <div class="details-row" id="report-sport-${escapeHtml(row.sport)}">
            <span>${escapeHtml(sportLabel(row.sport))}</span>
            <span>${row.total365 ?? 0}</span>
            <span>${row.totalFlash ?? 0}</span>
            <span>${row.matched ?? 0}</span>
            <span>${row.only365 ?? 0}</span>
            <span>${row.onlyFlash ?? 0}</span>
            <span><span class="badge ${row.status === 'failed' ? 'danger' : 'ok'}">${row.status === 'failed' ? t('failed') : t('completed')}</span></span>
          </div>
        `).join('')}
      </div>
    </details>
  `;
}

function renderReport(scan) {
  if (!scan?.result) return;
  if (!isMultiSportReport(scan)) state.reportSportFilter = 'all';
  if (isMultiSportReport(scan) && state.reportSportFilter !== 'all') {
    const exists = (scan.result?.sports || []).some(row => row.sport === state.reportSportFilter);
    if (!exists) state.reportSportFilter = 'all';
  }
  const { problematic, matched } = currentReportRows(scan);
  const filteredProblematic = filterReportRows(problematic, scan, { includeIgnored: false });
  const filteredMatched = filterReportRows(matched, scan, { includeIgnored: false });
  const missing365 = filteredProblematic.filter(row => row.type === 'onlyFlash');
  const missingFlash = filteredProblematic.filter(row => row.type === 'only365');
  const timeDiffRows = filteredProblematic.filter(row => row.type === 'timeDiff');
  const statusDiffRows = filteredProblematic.filter(row => row.type === 'statusDiff');
  const isTennisReport = isTennisReportContext(scan);
  const matchedRows = isTennisReport ? [...filteredMatched, ...timeDiffRows] : filteredMatched;
  $('reportTitle').textContent = dailyReportTitle(scan);
  $('reportSubtitle').innerHTML = reportDetailsHtml(scan);
  $('reportContent').innerHTML = `
    ${metricCardsHtml(scan, reportSummaryForFilter(scan))}
    ${reportSportFiltersHtml(scan)}
    ${allSportsHtml(scan)}
    ${reportRowsHtml(t('missing365Operational'), missing365, 'missing-365', missing365.length > 0, scan)}
    ${reportRowsHtml(t('missingFlash'), missingFlash, 'missing-flash', false, scan)}
    ${isTennisReport ? '' : reportRowsHtml(t('timeDiff'), timeDiffRows, 'time', false, scan)}
    ${reportRowsHtml(t('statusDiff'), statusDiffRows, 'status', false, scan)}
    ${reportRowsHtml(t('matchedTab'), matchedRows, 'matched', false, scan)}
  `;
  applyReportExpandedSections(scan.id);
}

function isReportOpen() {
  return !$('reportOverlay').classList.contains('hidden');
}

function hideReportOverlay() {
  captureReportExpandedSections();
  $('reportOverlay').classList.add('hidden');
  updateHistoryReportBanner();
}

function updateHistoryReportBanner() {
  const banner = $('historyReportBanner');
  if (!banner) return;

  const scanId = state.pinnedHistoryReportId;
  if (!scanId || state.activePanel !== 'compare') {
    banner.classList.add('hidden');
    return;
  }

  const scan = state.history.find(item => item.id === scanId);
  if (!scan) {
    state.pinnedHistoryReportId = null;
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');
  const nameEl = $('historyReportBannerName');
  if (nameEl) nameEl.textContent = historyName(scan);

  const reopenBtn = $('reopenHistoryReport');
  if (reopenBtn) reopenBtn.classList.toggle('hidden', isReportOpen());
}

function openReport(scan, options = {}) {
  if (!scan?.result) return;
  const force = options.force === true;
  if (shouldPinReport(scan) || force) {
    state.pinnedHistoryReportId = scan.id;
    state.selectedHistoryId = scan.id;
    state.currentScan = scan;
    renderHistoryList();
    showPanel('compare');
    $('reportOverlay').classList.remove('hidden');
  } else {
    renderReport(scan);
    if (state.activePanel === 'compare') {
      $('reportOverlay').classList.remove('hidden');
    }
  }
  updateHistoryReportBanner();
  updateFinishAsanaTaskButton(scan);
}

function closeReport() {
  captureReportExpandedSections();
  $('reportOverlay').classList.add('hidden');
  state.pinnedHistoryReportId = null;
  updateHistoryReportBanner();
}

function reopenPinnedHistoryReport() {
  if (!state.pinnedHistoryReportId) return;
  showPanel('compare');
  const scan = restorePinnedHistoryReport();
  if (!scan) {
    closeReport();
    return;
  }
  $('reportOverlay').classList.remove('hidden');
  updateHistoryReportBanner();
}

function printReport() {
  document.querySelectorAll('.report-toggle, .country-toggle, .competition-toggle').forEach(section => {
    section.open = true;
  });

  // Print the already-rendered report modal. Opening a cloned popup can leave
  // Chrome/Edge print preview stuck on some local environments.
  requestAnimationFrame(() => {
    setTimeout(() => {
    window.print();
    }, 150);
  });
}

function normalizedSummary(scan) {
  const summary = { ...(scan?.result?.summary || {}) };
  const details = scan?.result?.details || buildClientDetails(scan);
  const problematic = details.problematic || [];
  const matched = details.matched || [];

  summary.matched ??= matched.length;
  summary.only365 ??= problematic.filter(row => row.type === 'only365').length;
  summary.onlyFlash ??= problematic.filter(row => row.type === 'onlyFlash').length;
  summary.timeDiff ??= problematic.filter(row => row.type === 'timeDiff').length;
  summary.statusDiff ??= problematic.filter(row => row.type === 'statusDiff').length;
  summary.nameDiff ??= problematic.filter(row => row.type === 'nameDiff').length;

  // Some scrapers write flat JSON while older counters expected nested JSON.
  summary.total365 = Math.max(Number(summary.total365 || 0), Number(summary.matched || 0) + Number(summary.only365 || 0));
  summary.totalFlash = Math.max(Number(summary.totalFlash || 0), Number(summary.matched || 0) + Number(summary.onlyFlash || 0));

  return summary;
}

function issueLabel(type) {
  const labels = {
    only365: t('missingFlash'),
    onlyFlash: t('missing365'),
    timeDiff: t('timeMismatch'),
    statusDiff: t('statusMismatch'),
    nameDiff: t('nameMismatch'),
    matched: t('synced'),
  };
  return labels[type] || type;
}

function compactClientGame(country, type, game, extra = {}) {
  return {
    country,
    type,
    competition: game.competicao || game.competition || game.competicao_365 || game.competicao_flash || '',
    competition365: game.competicao_365 || game.competition365 || '',
    competitionFlash: game.competicao_flash || game.competitionFlash || '',
    home: game.home || game.home_365 || game.home365 || '',
    away: game.away || game.away_365 || game.away365 || '',
    home365: game.home_365 || game.home365 || '',
    away365: game.away_365 || game.away365 || '',
    homeFlash: game.home_flash || game.homeFlash || '',
    awayFlash: game.away_flash || game.awayFlash || '',
    time: game.horario || game.time || game.horario_365 || game.time365 || '',
    status: game.status || game.status_365 || game.status365 || '',
    ...extra,
  };
}

function buildClientDetails(scan) {
  const problematic = [];
  const matched = [];

  for (const row of scan?.result?.countries || []) {
    const country = row.country || '';
    const sport = row.sport || scan?.sport || '';
    const result = row.result || {};

    for (const g of result.so_no_365 || []) {
      problematic.push(compactClientGame(country, 'only365', g, {
        sport,
        competition365: g.competicao || '',
        home365: g.home || '',
        away365: g.away || '',
        badge: t('missingFlash'),
        severity: 'warning',
      }));
    }

    for (const g of result.so_no_flash || []) {
      problematic.push(compactClientGame(country, 'onlyFlash', g, {
        sport,
        competitionFlash: g.competicao || '',
        homeFlash: g.home || '',
        awayFlash: g.away || '',
        badge: t('missing365'),
        severity: 'warning',
      }));
    }

    for (const g of result.divergencias_horario || []) {
      problematic.push(compactClientGame(country, 'timeDiff', g, {
        sport,
        competition: g.competicao_365 || g.competicao_flash || '',
        competition365: g.competicao_365 || '',
        competitionFlash: g.competicao_flash || '',
        home365: g.home_365 || g.home || '',
        away365: g.away_365 || g.away || '',
        homeFlash: g.home_flash || '',
        awayFlash: g.away_flash || '',
        time365: g.horario_365 || '',
        timeFlash: g.horario_flash || '',
        badge: `365Scores: ${g.horario_365 || '-'} | Flashscore: ${g.horario_flash || '-'}`,
        severity: 'danger',
      }));
    }

    for (const g of result.divergencias_status || []) {
      problematic.push(compactClientGame(country, 'statusDiff', g, {
        sport,
        competition: g.competicao_365 || g.competicao_flash || '',
        competition365: g.competicao_365 || '',
        competitionFlash: g.competicao_flash || '',
        home365: g.home_365 || g.home || '',
        away365: g.away_365 || g.away || '',
        homeFlash: g.home_flash || '',
        awayFlash: g.away_flash || '',
        status365: g.status_365 || '',
        statusFlash: g.status_flash || '',
        badge: `365Scores: ${g.status_365 || '-'} | Flashscore: ${g.status_flash || '-'}`,
        severity: 'danger',
      }));
    }

    for (const g of result.divergencias_nome || []) {
      problematic.push(compactClientGame(country, 'nameDiff', g, {
        sport,
        competition: g.competicao || '',
        competition365: g.competicao_365 || g.competicao || '',
        competitionFlash: g.competicao_flash || '',
        home365: g.home_365 || '',
        away365: g.away_365 || '',
        homeFlash: g.home_flash || '',
        awayFlash: g.away_flash || '',
        badge: `Similarity: ${g.similaridade || '-'}`,
        severity: 'danger',
      }));
    }

    for (const pair of result.matched_pairs || []) {
      matched.push({
        country,
        sport,
        type: 'matched',
        competition: pair.competition365 || pair.competitionFlash || '',
        competition365: pair.competition365 || '',
        competitionFlash: pair.competitionFlash || '',
        home: pair.home365 || '',
        away: pair.away365 || '',
        home365: pair.home365 || '',
        away365: pair.away365 || '',
        homeFlash: pair.homeFlash || '',
        awayFlash: pair.awayFlash || '',
        time: pair.time365 || pair.timeFlash || '',
        time365: pair.time365 || '',
        timeFlash: pair.timeFlash || '',
        status: pair.status365 || pair.statusFlash || '',
        status365: pair.status365 || '',
        statusFlash: pair.statusFlash || '',
        badge: t('synced'),
        severity: 'ok',
      });
    }
  }

  return { problematic, matched };
}

function searchableText(row) {
  return [
    row.country,
    row.competition,
    row.competition365,
    row.competitionFlash,
    row.home,
    row.away,
    row.home365,
    row.away365,
    row.homeFlash,
    row.awayFlash,
    row.badge,
  ].join(' ').toLowerCase();
}

function filteredDetails() {
  const details = state.currentScan?.result?.details || buildClientDetails(state.currentScan);
  let rows = details[state.activeResultTab] || [];
  if (state.activeResultTab === 'problematic' && state.issueFilter !== 'all') {
    rows = rows.filter(row => row.type === state.issueFilter);
  }
  const query = state.search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter(row => searchableText(row).includes(query));
}

function renderDetails() {
  const rows = filteredDetails();
  if (!state.currentScan?.result) {
    $('detailsList').innerHTML = `<p class="empty-state">${t('noDetails')}</p>`;
    return;
  }

  if (!rows.length) {
    $('detailsList').innerHTML = `<p class="empty-state">${t('noMatches')}</p>`;
    return;
  }

  $('detailsList').innerHTML = `
    <div class="details-table">
      <div class="details-row header">
        <span>${t('country')}</span>
        <span>${t('comp')}</span>
        <span>${t('game')}</span>
        <span>${t('time')}</span>
        <span>${state.activeResultTab === 'problematic' ? t('issue') : t('status')}</span>
      </div>
      ${rows.map(renderDetailRow).join('')}
    </div>
  `;
}

function renderDetailRow(row) {
  const teams = row.type === 'nameDiff'
    ? `${escapeHtml(row.home365)} / ${escapeHtml(row.away365)}<span class="subtext">Flash: ${escapeHtml(row.homeFlash)} / ${escapeHtml(row.awayFlash)}</span>`
    : `${escapeHtml(row.home)} / ${escapeHtml(row.away)}`;
  const time = row.time365 || row.timeFlash
    ? `${escapeHtml(row.time365 || '-')} / ${escapeHtml(row.timeFlash || '-')}`
    : escapeHtml(row.time || '-');

  return `
    <div class="details-row">
      <span>${escapeHtml(row.country || '-')}</span>
      <span>${escapeHtml(row.competition || row.competition365 || '-')}<span class="subtext">${escapeHtml(row.competitionFlash || '')}</span></span>
      <span class="teams">${teams}</span>
      <span>${time}</span>
      <span><span class="badge ${row.severity || ''}">${escapeHtml(row.badge || issueLabel(row.type))}</span><span class="subtext">${escapeHtml(issueLabel(row.type))}</span></span>
    </div>
  `;
}

function termTypeLabel(type) {
  const labels = {
    name: t('game'),
    competition: t('competition'),
    country: t('country'),
    missing_365: t('missing365TermType'),
    missing_flash: t('missingFlashTermType'),
  };
  return labels[type] || type || '-';
}

function termValue365Display(term) {
  if (term.type === 'missing_365') return t('absent365');
  return term.value365 || '-';
}

function termValueFlashDisplay(term) {
  if (term.type === 'missing_flash') return t('absentFlash');
  return term.valueFlash || '-';
}

function renderTerms(scan) {
  const list = $('termsList');
  if (!list) return;

  const terms = (scan?.terms || [])
    .filter(term => term.type !== 'missing_flash')
    .filter(term => !missing365TermHandled(term, scan));
  const ignoredSuggestions = ignoredSuggestionsHtml(scan);
  if (!terms.length && !ignoredSuggestions) {
    list.innerHTML = `<p class="empty-state">${t('noTerms')}</p>`;
    return;
  }

  list.innerHTML = `
    ${ignoredSuggestions}
    ${terms.length ? `
      <div class="terms-table">
        <div class="terms-row header">
          <span>${t('termType')}</span>
          <span>${t('termScope')}</span>
          <span>${t('term365')}</span>
          <span>${t('termFlash')}</span>
          <span>${t('termContext')}</span>
          <span>${t('status')}</span>
        </div>
        ${terms.map(term => {
          const decision = state.termDecisions[term.id] || '';
          const isMissing365 = term.type === 'missing_365';
          const missingHint = isMissing365 ? t('missing365TermHint') : '';
          const sameLabel = isMissing365 ? t('ignoreTerm') : t('sameTerm');
          const differentLabel = isMissing365 ? t('dontIgnoreTerm') : t('differentTerm');
          return `
            <div class="terms-row ${isMissing365 ? 'missing-365-term' : ''}" data-term-id="${escapeHtml(term.id)}">
              <span><span class="badge">${escapeHtml(termTypeLabel(term.type))}</span></span>
              <span>${reportText(term.scope || '-')}</span>
              <span>${reportText(termValue365Display(term))}</span>
              <span>${reportText(termValueFlashDisplay(term))}</span>
              <span>${reportText(term.context || term.similarity || '-')}${missingHint ? ` · ${missingHint}` : ''}</span>
              <span class="term-actions">
                <button class="segment ${decision === 'same' ? 'active' : ''}" data-term-decision="same">${sameLabel}</button>
                <button class="segment danger ${decision === 'different' ? 'active' : ''}" data-term-decision="different">${differentLabel}</button>
                <small>${decision ? '' : t('undecidedTerm')}</small>
              </span>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;
}

function setTermDecision(button) {
  const row = button.closest('[data-term-id]');
  if (!row) return;
  state.termDecisions[row.dataset.termId] = button.dataset.termDecision;
  renderTerms(state.currentScan);
}

async function addIgnoredSuggestion(button) {
  try {
    const rules = await api('/api/rules', {
      method: 'POST',
      body: JSON.stringify({
        sport: button.dataset.sport,
        side: button.dataset.side || 'flash',
        scope: button.dataset.scope,
        competition: button.dataset.competition,
      }),
    });
    state.competitionRules = rules || {};
    await renderRules();
    renderTerms(state.currentScan);
    renderReport(state.currentScan);
  } catch (e) {
    alert(e.message);
  }
}

function resetCompetitionMenuDropdown(dropdown) {
  if (!dropdown) return;
  dropdown.hidden = true;
  dropdown.style.position = '';
  dropdown.style.top = '';
  dropdown.style.right = '';
  dropdown.style.left = '';
  dropdown.style.bottom = '';
}

function positionCompetitionMenuDropdown(toggle, dropdown) {
  if (!toggle || !dropdown) return;
  const rect = toggle.getBoundingClientRect();
  const menuWidth = Math.max(dropdown.offsetWidth || 210, 210);
  const gap = 4;
  let left = rect.right - menuWidth;
  left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
  let top = rect.bottom + gap;
  dropdown.style.position = 'fixed';
  dropdown.style.right = 'auto';
  dropdown.style.left = `${Math.round(left)}px`;
  dropdown.style.top = `${Math.round(top)}px`;
  dropdown.style.bottom = 'auto';

  const menuHeight = dropdown.offsetHeight || 40;
  if (top + menuHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - menuHeight - gap);
    dropdown.style.top = `${Math.round(top)}px`;
  }
}

function closeCompetitionMenus(exceptMenu = null) {
  document.querySelectorAll('[data-competition-menu]').forEach(menu => {
    if (exceptMenu && menu === exceptMenu) return;
    const dropdown = menu.querySelector('.competition-menu-dropdown');
    resetCompetitionMenuDropdown(dropdown);
    menu.classList.remove('open');
  });
}

async function toggleReportCompetitionIgnore(button) {
  const sport = button.dataset.sport;
  const side = button.dataset.side;
  const scope = button.dataset.scope;
  const competition = button.dataset.competition;
  const action = button.dataset.competitionIgnoreAction;
  if (!sport || !side || !scope || !competition || !action) return;

  try {
    let rules;
    if (action === 'unignore') {
      const index = findIgnoreRuleIndex(sport, side, scope, competition);
      if (index < 0) {
        closeCompetitionMenus();
        renderReport(state.currentScan);
        return;
      }
      rules = await api('/api/rules', {
        method: 'DELETE',
        body: JSON.stringify({ sport, side, index, scope, competition }),
      });
    } else {
      rules = await api('/api/rules', {
        method: 'POST',
        body: JSON.stringify({ sport, side, scope, competition }),
      });
    }

    state.competitionRules = rules || {};
    closeCompetitionMenus();
    await renderRules();
    renderReport(state.currentScan);
    const feedback = action === 'unignore'
      ? t('competitionUnignoredFeedback')
      : t('competitionIgnoredFeedback');
    setStatus('completed', feedback);
  } catch (e) {
    alert(e.message);
  }
}

function reportGenStepIds(hasTermDecisions) {
  const steps = ['save', 'xlsx', 'finish'];
  if (hasTermDecisions) steps.splice(1, 0, 'compare');
  return steps;
}

function reportGenStepLabel(stepId) {
  const labels = {
    save: t('reportStepSave'),
    compare: t('reportStepCompare'),
    xlsx: t('reportStepXlsx'),
    finish: t('reportStepFinish'),
  };
  return labels[stepId] || stepId;
}

function reportGenProgressForStep(stepIds, activeIndex) {
  if (!stepIds.length) return 0;
  const slot = 100 / stepIds.length;
  return Math.min(99, Math.round(activeIndex * slot + slot * 0.35));
}

function renderReportGenSteps(stepIds, activeIndex) {
  const list = $('reportGenSteps');
  if (!list) return;
  list.innerHTML = stepIds.map((stepId, index) => {
    const status = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending';
    return `
      <li class="loading-step ${status}">
        <span class="loading-step-marker" aria-hidden="true">${status === 'done' ? '✓' : status === 'active' ? '…' : ''}</span>
        <span class="loading-step-label">${escapeHtml(reportGenStepLabel(stepId))}</span>
      </li>
    `;
  }).join('');
}

function updateReportGenProgress(stepIds, activeIndex, progressOverride = null) {
  const progress = progressOverride ?? reportGenProgressForStep(stepIds, activeIndex);
  const bar = $('reportGenProgressBar');
  const text = $('reportGenProgressText');
  const message = $('reportGenMessage');
  if (bar) bar.style.width = `${progress}%`;
  if (text) text.textContent = `${progress}%`;
  if (message) message.textContent = reportGenStepLabel(stepIds[activeIndex] || stepIds[stepIds.length - 1]);
  renderReportGenSteps(stepIds, activeIndex);
}

function startReportGenProgress(hasTermDecisions) {
  const panel = $('reportGenPanel');
  const stepIds = reportGenStepIds(hasTermDecisions);
  state.reportGenStepIndex = 0;
  if (panel) panel.classList.remove('hidden');
  updateReportGenProgress(stepIds, 0, 8);

  if (state.reportGenTimer) clearInterval(state.reportGenTimer);
  state.reportGenTimer = setInterval(() => {
    if (!state.generatingReport) return;
    const maxIndex = stepIds.length - 1;
    if (state.reportGenStepIndex < maxIndex) {
      state.reportGenStepIndex += 1;
    }
    updateReportGenProgress(stepIds, state.reportGenStepIndex);
  }, hasTermDecisions ? 4500 : 2200);
}

function finishReportGenProgress(hasTermDecisions) {
  const stepIds = reportGenStepIds(hasTermDecisions);
  updateReportGenProgress(stepIds, stepIds.length - 1, 100);
}

function stopReportGenProgress() {
  if (state.reportGenTimer) {
    clearInterval(state.reportGenTimer);
    state.reportGenTimer = null;
  }
  state.reportGenStepIndex = 0;
  const panel = $('reportGenPanel');
  if (panel) panel.classList.add('hidden');
  const bar = $('reportGenProgressBar');
  const text = $('reportGenProgressText');
  if (bar) bar.style.width = '0%';
  if (text) text.textContent = '0%';
}

async function generateReport() {
  if (!state.currentScan?.id || state.generatingReport) return;
  if (state.currentScan.status !== 'terms_fix' && state.currentScan.status !== 'completed') return;

  const generateButton = $('generateReport');
  const hasTermDecisions = Object.values(state.termDecisions).some(value => value === 'same' || value === 'different');
  state.generatingReport = true;
  if (generateButton) {
    generateButton.disabled = true;
    generateButton.dataset.busy = '1';
  }
  startReportGenProgress(hasTermDecisions);

  try {
    const acknowledgedSuggestions = [
      ...buildIgnoredCompetitionSuggestions(state.currentScan)
        .map(item => ({
          sport: item.sport,
          scope: item.scope,
          competition: item.competition,
          side: item.side || 'flash',
        })),
      ...(state.currentScan?.terms || [])
        .filter(term => term.type === 'missing_365' && state.termDecisions[term.id] === 'same')
        .map(term => ({
          sport: term.sport,
          scope: term.scope,
          competition: term.valueFlash,
          side: 'flash',
        })),
    ];

    const data = await api('/api/terms/generate', {
      method: 'POST',
      body: JSON.stringify({
        scanId: state.currentScan.id,
        decisions: state.termDecisions,
        acknowledgedSuggestions,
      }),
    });

    finishReportGenProgress(hasTermDecisions);
    state.termDecisions = {};
    state.competitionRules = data.rules || state.competitionRules;
    state.currentScan = data.scan;
    state.history = data.history || state.history;
    state.dismissedTermsScanId = null;
    updateTermsTabVisibility();
    renderHistoryList();
    renderAsanaTasks();
    renderScan(data.scan);
    openReport(data.scan, { force: true });
    updateFinishAsanaTaskButton(data.scan);
  } catch (e) {
    alert(e.message);
  } finally {
    state.generatingReport = false;
    stopReportGenProgress();
    if (generateButton) {
      generateButton.disabled = false;
      delete generateButton.dataset.busy;
    }
  }
}

function renderScan(scan) {
  const previousWasRunning = state.wasRunning;
  state.currentScan = scan;
  updateCompareTabVisibility();

  if (!scan) {
    setStatus('', t('idle'));
    setLoading(false);
    $('startScan').disabled = false;
    setLatestReportButtonVisible(false);
    updateFinishAsanaTaskButton(null);
    state.progressScanId = null;
    state.progressPeak = 0;
    updateProgress(0);
    state.wasRunning = false;
    updateTermsTabVisibility();
    return;
  }

  const statusLabel = scan.status === 'running'
    ? scan.sport === 'usa_all'
      ? `${t('scanning')} ${usaAllSportsLabel()}...`
      : `${t('scanning')} ${sportLabel(scan.sport)}...`
    : scan.status === 'completed'
      ? `${t('completed')} ${sportLabel(scan.sport)}`
      : scan.status === 'terms_fix'
        ? `${t('termsPending')} ${sportLabel(scan.sport)}`
        : `${t('failed')} ${sportLabel(scan.sport)}`;

  setStatus(scan.status, statusLabel);
  if (scan.status === 'running') {
    updateProgress(progressFromScan(scan));
    updateLoadingFromScan(scan);
  } else if (scan.status === 'completed' || scan.status === 'terms_fix') {
    updateProgress(100);
  } else if (scan.status === 'failed') {
    updateProgress(state.progressScanId === scan.id ? (state.progressPeak || 0) : 0);
  }
  setLoading(scan.status === 'running');
  state.wasRunning = scan.status === 'running';
  $('startScan').disabled = scan.status === 'running';
  updateCompareTabVisibility();
  updateTermsTabVisibility();
  if (scan.status === 'terms_fix' && scan.result) {
    setLatestReportButtonVisible(false);
    renderTerms(scan);
    if (state.dismissedTermsScanId !== scan.id) {
      showPanel('terms');
      state.autoOpenDetails = false;
    }
  } else if (scan.status === 'completed' && scan.result) {
    state.selectedHistoryId = scan.id;
    setLatestReportButtonVisible(true);
    updateFinishAsanaTaskButton(scan);
    renderSummary(scan);
    renderDetails();
    renderReport(scan);
    renderHistoryList();
    if (state.autoOpenDetails) {
      state.autoOpenDetails = false;
      showPanel('compare');
    }
    const justFinished = previousWasRunning || state.scanStartedByUser;
    if (justFinished && state.lastOpenedReportId !== scan.id) {
      state.lastOpenedReportId = scan.id;
      state.scanStartedByUser = false;
      setTimeout(() => openReport(scan), 250);
    }
  } else if (scan.status === 'running') {
    setLatestReportButtonVisible(false);
  } else if (scan.status === 'failed') {
    state.autoOpenDetails = false;
    setLatestReportButtonVisible(false);
    if (state.asanaScanQueue.length && scanMatchesAsanaQueueHead(scan)) {
      clearAsanaScanQueue();
    }
    const shouldAlertFailure = previousWasRunning || state.scanStartedByUser;
    if (shouldAlertFailure && scan.error && state.lastFailureAlertId !== scan.id) {
      state.lastFailureAlertId = scan.id;
      setTimeout(() => alert(scan.error), 50);
    }
    state.scanStartedByUser = false;
  }
}

async function pollScan() {
  try {
    const data = await api('/api/scan');
    if (data.active) {
      renderScan(data.active);
    } else if (data.last) {
      renderScan(data.last);
    } else {
      renderScan(null);
    }

    if (!data.active && data.last?.id && !state.history.some(item => item.id === data.last.id)) {
      await refreshHistory();
    }

    if (!data.active && state.polling) {
      clearInterval(state.polling);
      state.polling = null;
    }
  } catch (e) {
    setLoading(false);
    setStatus('failed', e.message);
    if (state.polling) {
      clearInterval(state.polling);
      state.polling = null;
    }
  }
}

async function startScanForSport({ sport, date, asanaTaskGid = null, operatorEmail = null }) {
  if (sport === 'usa_all' && !ensureUsaAllSupport()) return;
  if ((isUsaSportKey(sport) || sport === 'usa_all') && !ensureUsaSportsSupport()) return;
  if (sport === 'latam_all' && !ensureLatamAllSupport()) return;
  if (sport.startsWith('latam_') && sport !== 'latam_all' && !ensureLatamSupport()) return;
  if (sport === 'israel_all' && !ensureIsraelAllSupport()) return;
  if (sport.startsWith('israel_') && sport !== 'israel_all' && !ensureIsraelSupport()) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    alert(t('invalidScanDate'));
    return;
  }
  if (!asanaTaskGid && isAsanaScanQueueActive()) {
    clearAsanaScanQueue();
  }
  const scraperSource = 'flashscore';
  const resolvedOperatorEmail = operatorEmail || null;
  state.autoOpenDetails = true;
  state.scanStartedByUser = true;
  state.wasRunning = true;
  state.dismissedTermsScanId = null;
  state.lastOpenedReportId = null;
  state.lastFailureAlertId = null;
  state.progressScanId = null;
  state.progressPeak = 0;
  setLatestReportButtonVisible(false);
  updateProgress(0);
  showPanel('scan');
  setLoading(true);
  setStatus('running', sport === 'usa_all' ? `${t('starting')} ${usaAllSportsLabel()}...` : t('starting'));
  await api('/api/scan', {
    method: 'POST',
    body: JSON.stringify({
      sport,
      date,
      scraperSource,
      asanaTaskGid,
      operatorEmail: resolvedOperatorEmail,
    }),
  });

  if (!state.polling) state.polling = setInterval(pollScan, 1000);
  await pollScan();
}

async function startScan() {
  try {
    await startScanForSport({
      sport: $('sportSelect').value,
      date: $('scanDate').value,
    });
  } catch (e) {
    setLoading(false);
    alert(e.message);
  }
}

async function startUsaSportsScan() {
  try {
    await startScanForSport({
      sport: $('usaSportSelect').value,
      date: $('usaSportsScanDate').value,
    });
  } catch (e) {
    setLoading(false);
    alert(e.message);
  }
}

async function startLatamScan() {
  try {
    await startScanForSport({
      sport: $('latamSportSelect').value,
      date: $('latamScanDate').value,
    });
  } catch (e) {
    setLoading(false);
    alert(e.message);
  }
}

async function startIsraelScan() {
  try {
    await startScanForSport({
      sport: $('israelSportSelect').value,
      date: $('israelScanDate').value,
    });
  } catch (e) {
    setLoading(false);
    alert(e.message);
  }
}

function ruleRows(sport, side, rows) {
  if (!rows.length) {
    return `<p class="hint">${side === '365' ? t('side365') : t('sideFlash')}: ${t('noRules')}</p>`;
  }
  return rows.map((rule, index) => `
    <div class="rule-row" data-rule-row>
      <span data-rule-view>${side === '365' ? t('side365') : t('sideFlash')}</span>
      <code data-rule-view>${sourceText(rule.scope || '')}</code>
      <span data-rule-view>${escapeHtml(rule.competition === '*' ? t('allCompetitions') : rule.competition || '')}</span>
      <span class="rule-actions">
        <button data-edit-rule data-sport="${sport}" data-side="${side}" data-index="${index}" data-scope="${escapeHtml(rule.scope || '')}" data-competition="${escapeHtml(rule.competition || '')}">${t('edit')}</button>
        <button class="ghost-danger" data-delete-rule data-sport="${sport}" data-side="${side}" data-index="${index}">${t('delete')}</button>
      </span>
    </div>
  `).join('');
}

async function renderRules() {
  if (!state.sports.length) return;
  const rules = await api('/api/rules');
  state.competitionRules = rules || {};
  $('rulesList').innerHTML = state.sports.map(sport => {
    const sportRules = rules[sport.key] || {};
    return `
      <section class="rule-group">
        <h3>${sportLabel(sport)}</h3>
        ${ruleRows(sport.key, '365', sportRules.ignore365Only || [])}
        ${ruleRows(sport.key, 'flash', sportRules.ignoreFlashOnly || [])}
      </section>
    `;
  }).join('');
}

async function addRule() {
  try {
    await api('/api/rules', {
      method: 'POST',
      body: JSON.stringify({
        sport: $('ruleSport').value,
        side: $('ruleSide').value,
        scope: $('ruleScope').value,
        competition: $('ruleCompetition').value,
      }),
    });
    $('ruleCompetition').value = '';
    await renderRules();
    renderReport(state.currentScan);
  } catch (e) {
    alert(e.message);
  }
}

async function deleteRule(button) {
  try {
    await api('/api/rules', {
      method: 'DELETE',
      body: JSON.stringify({
        sport: button.dataset.sport,
        side: button.dataset.side,
        index: button.dataset.index,
      }),
    });
    await renderRules();
    renderReport(state.currentScan);
  } catch (e) {
    alert(e.message);
  }
}

function editRule(button) {
  const row = button.closest('[data-rule-row]');
  if (!row) return;
  row.classList.add('editing');
  row.innerHTML = `
    <select data-edit-side>
      <option value="365" ${button.dataset.side === '365' ? 'selected' : ''}>${t('side365')}</option>
      <option value="flash" ${button.dataset.side === 'flash' ? 'selected' : ''}>${t('sideFlash')}</option>
    </select>
    <input data-edit-scope value="${escapeHtml(button.dataset.scope || '')}">
    <input data-edit-competition value="${escapeHtml(button.dataset.competition || '')}">
    <span class="rule-actions">
      <button data-save-rule data-sport="${button.dataset.sport}" data-side="${button.dataset.side}" data-index="${button.dataset.index}">${t('add')}</button>
      <button class="ghost-danger" data-cancel-rule>${t('close')}</button>
    </span>
  `;
}

async function saveRuleEdit(button) {
  const row = button.closest('[data-rule-row]');
  if (!row) return;
  try {
    await api('/api/rules', {
      method: 'PUT',
      body: JSON.stringify({
        sport: button.dataset.sport,
        side: button.dataset.side,
        newSide: row.querySelector('[data-edit-side]').value,
        index: button.dataset.index,
        scope: row.querySelector('[data-edit-scope]').value,
        competition: row.querySelector('[data-edit-competition]').value,
      }),
    });
    await renderRules();
    renderReport(state.currentScan);
  } catch (e) {
    alert(e.message);
  }
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const nextPanel = tab.dataset.tab;
      if (nextPanel === state.activePanel) return;

      if (hasRunningScan()) {
        const shouldStopScan = await confirmStopRunningScan();
        if (!shouldStopScan) return;
        await cancelRunningScan().catch(e => alert(e.message));
      }

      const canLeave = nextPanel === 'terms' ? true : await confirmLeaveTermsFix();
      if (!canLeave) return;

      showPanel(nextPanel);
    });
  });
}

function setupResultTabs() {
  if (!$('detailsSearch')) return;
  const setIssueFilter = (value) => {
    state.issueFilter = value;
    document.querySelectorAll('[data-issue-filter]').forEach(el => {
      el.classList.toggle('active', el.dataset.issueFilter === value);
    });
  };

  document.querySelectorAll('[data-result-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeResultTab = tab.dataset.resultTab;
      document.querySelectorAll('[data-result-tab]').forEach(tEl => tEl.classList.remove('active'));
      tab.classList.add('active');
      $('issueMenu').style.display = state.activeResultTab === 'problematic' ? 'inline-flex' : 'none';
      if (state.activeResultTab === 'matched') setIssueFilter('all');
      renderDetails();
    });
  });

  document.querySelectorAll('[data-issue-filter]').forEach(button => {
    button.addEventListener('click', () => {
      setIssueFilter(button.dataset.issueFilter);
      renderDetails();
    });
  });

  $('detailsSearch').addEventListener('input', event => {
    state.search = event.target.value;
    renderDetails();
  });
}

async function init() {
  setupTabs();
  setupResultTabs();

  state.asanaViewDate = todayIsoInAsanaTimezone();
  syncAsanaViewDateInput();
  const hadCachedAsanaTasks = hydrateAsanaTasksFromCache();
  showPanel('tasks');
  setupAsanaPanel();
  const asanaLoadPromise = loadAsanaTasks({ silent: hadCachedAsanaTasks, fresh: false });

  const { sports, defaultDate, defaultDates } = await api('/api/sports');
  state.sports = sports;
  fillSportSelect($('sportSelect'), mainScannerSports(sports));
  fillSportSelect($('ruleSport'), sports.filter(sport =>
    sport.key !== 'all' && sport.key !== 'usa_all' && !sport.key.startsWith('latam_') && !sport.key.startsWith('israel_')
  ));
  fillUsaSportSelect($('usaSportSelect'), sports);
  fillLatamSportSelect($('latamSportSelect'), sports);
  fillIsraelSportSelect($('israelSportSelect'), sports);
  const dates = defaultDates || {};
  $('scanDate').value = dates.content || defaultDate;
  if ($('usaSportsScanDate')) $('usaSportsScanDate').value = dates.usa || defaultDate;
  if ($('latamScanDate')) $('latamScanDate').value = dates.latam || defaultDate;
  if ($('israelScanDate')) $('israelScanDate').value = dates.israel || defaultDate;

  $('languageSelect').addEventListener('change', event => {
    const nextLanguage = i18n[event.target.value] ? event.target.value : 'en';
    state.language = nextLanguage;
    localStorage.setItem('uiLanguage', nextLanguage);
    applyLanguage();
  });
  $('themeToggle')?.addEventListener('click', toggleTheme);
  $('homeLogo')?.addEventListener('click', () => {
    goHome().catch(e => alert(e.message));
  });
  $('startScan').addEventListener('click', startScan);
  $('startUsaSportsScan')?.addEventListener('click', startUsaSportsScan);
  $('startLatamScan')?.addEventListener('click', startLatamScan);
  $('startIsraelScan')?.addEventListener('click', startIsraelScan);
  $('stopScanFromLoading')?.addEventListener('click', async () => {
    const shouldStopScan = await confirmStopRunningScan();
    if (!shouldStopScan) return;
    await cancelRunningScan().catch(e => alert(e.message));
  });
  $('openLatestReport')?.addEventListener('click', () => openReport(state.currentScan));
  $('addRule').addEventListener('click', addRule);
  $('generateReport').addEventListener('click', generateReport);
  $('stayOnTerms').addEventListener('click', () => closeLeaveTermsDialog(false));
  $('confirmLeaveTerms').addEventListener('click', () => closeLeaveTermsDialog(true));
  $('leaveTermsOverlay').addEventListener('click', event => {
    if (event.target === event.currentTarget) closeLeaveTermsDialog(false);
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.pendingTermsLeaveResolve) closeLeaveTermsDialog(false);
  });
  window.addEventListener('beforeunload', event => {
    if (!hasPendingTermsReport() && !hasRunningScan()) return;
    event.preventDefault();
    event.returnValue = '';
  });
  $('termsList').addEventListener('click', event => {
    const ignoredSuggestionButton = event.target.closest('[data-ignore-suggestion]');
    if (ignoredSuggestionButton) addIgnoredSuggestion(ignoredSuggestionButton);
    const button = event.target.closest('[data-term-decision]');
    if (button) setTermDecision(button);
  });
  $('closeReportButton')?.addEventListener('click', closeReport);
  $('finishAsanaTask')?.addEventListener('click', () => {
    finishAsanaTaskForScan().catch(error => alert(error.message));
  });
  $('closeHistoryReport')?.addEventListener('click', closeReport);
  $('reopenHistoryReport')?.addEventListener('click', reopenPinnedHistoryReport);
  $('downloadPdf')?.addEventListener('click', printReport);
  $('reportContent').addEventListener('toggle', event => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement)) return;
    syncReportOpenKey(details);
  }, true);
  $('reportContent').addEventListener('scroll', () => closeCompetitionMenus(), { passive: true });
  $('reportOverlay')?.addEventListener('scroll', () => closeCompetitionMenus(), { passive: true });
  window.addEventListener('resize', () => closeCompetitionMenus());
  $('reportContent').addEventListener('click', event => {
    const menuToggle = event.target.closest('[data-competition-menu-toggle]');
    if (menuToggle) {
      event.preventDefault();
      event.stopPropagation();
      const menu = menuToggle.closest('[data-competition-menu]');
      const dropdown = menu?.querySelector('.competition-menu-dropdown');
      if (!menu || !dropdown) return;
      const willOpen = dropdown.hidden;
      closeCompetitionMenus(menu);
      if (willOpen) {
        dropdown.hidden = false;
        menu.classList.add('open');
        positionCompetitionMenuDropdown(menuToggle, dropdown);
      } else {
        resetCompetitionMenuDropdown(dropdown);
        menu.classList.remove('open');
      }
      return;
    }

    const ignoreAction = event.target.closest('[data-competition-ignore-action]');
    if (ignoreAction) {
      event.preventDefault();
      event.stopPropagation();
      toggleReportCompetitionIgnore(ignoreAction).catch(e => alert(e.message));
      return;
    }

    if (!event.target.closest('[data-competition-menu]')) {
      closeCompetitionMenus();
    }

    const metricCard = event.target.closest('[data-report-card-target]');
    if (metricCard) {
      const target = metricCard.dataset.reportCardTarget;
      if (!target) return;
      const section = document.querySelector(`[data-report-section="${target}"]`);
      if (!section) return;
      section.open = !section.open;
      syncReportOpenKey(section);
      if (section.open) section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const button = event.target.closest('[data-report-sport-filter]');
    if (!button) return;
    event.preventDefault();
    captureReportExpandedSections();
    state.reportSportFilter = button.dataset.reportSportFilter;
    renderReport(state.currentScan);
  });
  $('historyList').addEventListener('click', event => {
    const renameButton = event.target.closest('[data-rename-history]');
    if (renameButton) {
      event.stopPropagation();
      renameHistory(renameButton).catch(e => alert(e.message));
      return;
    }

    const deleteButton = event.target.closest('[data-delete-history]');
    if (deleteButton) {
      event.stopPropagation();
      deleteHistory(deleteButton).catch(e => alert(e.message));
      return;
    }

    const button = event.target.closest('[data-history-id]');
    if (button) selectHistory(Number(button.dataset.historyId));
  });
  $('rulesList').addEventListener('click', event => {
    const button = event.target.closest('[data-delete-rule]');
    if (button) deleteRule(button);
    const editButton = event.target.closest('[data-edit-rule]');
    if (editButton) editRule(editButton);
    const saveButton = event.target.closest('[data-save-rule]');
    if (saveButton) saveRuleEdit(saveButton);
    const cancelButton = event.target.closest('[data-cancel-rule]');
    if (cancelButton) renderRules();
  });

  applyLanguage();
  await asanaLoadPromise;
  await load365CompetitionCatalogs();
  await renderRules();
  await refreshHistory();
  openReportFromUrl();
  await pollScan();
}

init().catch(e => {
  console.error(e);
  alert(e.message);
});
