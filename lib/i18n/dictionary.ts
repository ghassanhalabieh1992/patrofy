export type Locale = "pt" | "en"

export interface Dictionary {
  common: {
    entrar: string
    cadastrar: string
    carregando: string
    cancelar: string
    salvar: string
    adicionar: string
    excluir: string
    voltar: string
    sairDaConta: string
  }
  landing: {
    free: string
    badge: string
    titlePart1: string
    titlePart2: string
    subtitle: string
    cta: string
    ctaSub: string
    feature1Title: string
    feature1Desc: string
    feature2Title: string
    feature2Desc: string
    feature3Title: string
    feature3Desc: string
    footer: string
  }
  login: {
    tagline: string
    nome: string
    nomePlaceholder: string
    email: string
    senha: string
    aguarde: string
    criarConta: string
    erroRede: string
    contaCriada: string
    termos: string
  }
  dashboard: {
    novaConversa: string
    meusMoldes: string
    nenhumMolde: string
    assistente: string
    portalEspecialista: string
    painelAdmin: string
    welcomeMessage: string
    moldeParametricoFallback: string
    moldeGerado: string
    analisarPrefix: string
    gerandoMolde: string
    baixarPDF: string
    copiar: string
    imagemEnviada: string
    medidasCliente: string
    gerarMoldeParametricoTitulo: string
    medidasObrigatorias: string
    medidasComplementares: string
    imagemReferencia: string
    arquivoReferencia: string
    gerarMoldeParametricoTooltip: string
    anexarImagemTooltip: string
    adicionarMedidasTooltip: string
    inputPlaceholderFile: string
    inputPlaceholderDefault: string
    footerHint: string
    erroAoGerar: string
    erroDesconhecido: string
    erroPrefix: string
    moldeGeradoComSucesso: string
    fichaTecnicaGeradaPara: (peca: string) => string
    fichaTecnicaSimples: (peca: string) => string
    moldeParametricoGeradoFast: (label: string, sizeName: string) => string
    moldeParametricoGeradoManual: (label: string, sizeName: string, pieceCount: number) => string
    preencher: (fields: string) => string
    gerarMolde: (garment: string) => string
    garmentLabels: Record<string, string>
    fieldLabels: Record<string, string>
  }
  patternViewer: {
    seamAllowanceLabel: string
    hemLabel: string
    pdfButton: (pages: number) => string
    exportar: string
    svgDesc: string
    dxfDesc: string
    pdfA4Desc: string
    foldOnBlueLine: string
    legendCortar: string
    legendCosturar: string
    legendDobrar: string
    scaleNote: string
    medidasUtilizadas: string
    dobrarAqui: string
    fio: string
    pagina: string
    peca: string
    margemCosturaLinha: (seam: number) => string
  }
  fichaTecnica: {
    headerTitle: string
    modo: string
    pdf: string
    tamanhoBase: string
    margemCostura: string
    rendimentoTecido: string
    tecidoRecomendado: string
    tabelaMedidas: string
    tamanho: string
    partesDoMolde: (count: number) => string
    fio: string
    sequenciaMontagem: string
    alteracoesAplicadas: string
    observacoesTecnicas: string
    moldeFallback: string
    pdfLines: {
      fichaTecnica: (peca: string) => string
      tamanhoLinha: (tamanho: string, tecido: string, margem: string) => string
      rendimento: (m: number) => string
      partesDoMolde: string
      parteItem: (i: number, nome: string, qty: number, fio: string, w: number, h: number) => string
      sequenciaMontagem: string
      observacoesTecnicas: string
      alteracoesAplicadas: string
    }
  }
}

export const dictionary: Record<Locale, Dictionary> = {
  pt: {
    common: {
      entrar: "Entrar",
      cadastrar: "Cadastrar",
      carregando: "Carregando...",
      cancelar: "Cancelar",
      salvar: "Salvar",
      adicionar: "Adicionar",
      excluir: "Excluir",
      voltar: "Voltar",
      sairDaConta: "Sair da conta",
    },
    landing: {
      free: "Grátis",
      badge: "IA para Costura Profissional",
      titlePart1: "Moldes profissionais gerados por",
      titlePart2: "IA em segundos.",
      subtitle: "Descreva a peça que deseja e receba instruções técnicas completas — medidas, formato, marcações e orientações de corte.",
      cta: "Começar agora →",
      ctaSub: "100% grátis, sem cartão de crédito.",
      feature1Title: "Rapidez",
      feature1Desc: "Moldes detalhados em segundos, sem esperar pelo próximo atendimento.",
      feature2Title: "Precisão técnica",
      feature2Desc: "Instruções profissionais com medidas, marcações e orientações de corte.",
      feature3Title: "Histórico completo",
      feature3Desc: "Todos os seus moldes salvos e acessíveis a qualquer momento.",
      footer: "© 2024 Patrofy — Powered by LLaMA 3 (Meta) via OpenRouter",
    },
    login: {
      tagline: "Sistema de IA para Geração de Moldes",
      nome: "Nome",
      nomePlaceholder: "Seu nome completo",
      email: "Email",
      senha: "Senha",
      aguarde: "Aguarde...",
      criarConta: "Criar conta",
      erroRede: "Erro de rede. Tente novamente.",
      contaCriada: "Conta criada! Verifique seu email para confirmar o cadastro.",
      termos: "Ao continuar, você concorda com os termos de uso da Patrofy.",
    },
    dashboard: {
      novaConversa: "Nova conversa",
      meusMoldes: "Meus Moldes",
      nenhumMolde: "Nenhum molde salvo ainda.",
      assistente: "Assistente de Modelagem",
      portalEspecialista: "Portal do Especialista",
      painelAdmin: "Painel Admin",
      welcomeMessage: `Olá! Sou o **Patrofy AI**, seu assistente de modelagem de roupas.

Descreva a peça que deseja em texto livre — com as medidas — e gerei o molde completo automaticamente. Exemplos:

• **"Saia reta cintura 72 quadril 98 comprimento 65"**
• **"Blusa básica busto 92 cintura 76 comprimento 58"**
• **"Calça básica cintura 74 quadril 100 comprimento 100"**

Também posso analisar imagens de peças e gerar o molde a partir delas.
• **Exportar em PDF** em escala 1:1 para costura profissional

Como posso começar?`,
      moldeParametricoFallback: "Molde paramétrico",
      moldeGerado: "Molde gerado.",
      analisarPrefix: "Analisar: ",
      gerandoMolde: "Gerando molde com IA…",
      baixarPDF: "Baixar PDF",
      copiar: "Copiar",
      imagemEnviada: "Imagem enviada",
      medidasCliente: "Medidas do cliente (cm)",
      gerarMoldeParametricoTitulo: "Gerar Molde Paramétrico",
      medidasObrigatorias: "Medidas obrigatórias",
      medidasComplementares: "Medidas complementares (opcional)",
      imagemReferencia: "Imagem de referência",
      arquivoReferencia: "Arquivo de referência",
      gerarMoldeParametricoTooltip: "Gerar molde paramétrico (formas reais para corte)",
      anexarImagemTooltip: "Anexar imagem",
      adicionarMedidasTooltip: "Adicionar medidas",
      inputPlaceholderFile: "Descreva o que deseja fazer com este arquivo…",
      inputPlaceholderDefault: "Descreva a peça: tipo, tamanho, tecido, estilo…",
      footerHint: "Enter para enviar · 🔷 molde paramétrico · 📎 imagem · 📏 medidas",
      erroAoGerar: "Erro ao gerar molde.",
      erroDesconhecido: "Erro desconhecido.",
      erroPrefix: "Erro: ",
      moldeGeradoComSucesso: "Molde gerado com sucesso.",
      fichaTecnicaGeradaPara: (peca) => `Ficha técnica gerada para **${peca}**.`,
      fichaTecnicaSimples: (peca) => `Ficha técnica: **${peca}**`,
      moldeParametricoGeradoFast: (label, sizeName) => `Molde paramétrico gerado: **${label}** (${sizeName}).\n\nExporte em PDF, SVG ou DXF com o botão **Exportar**.`,
      moldeParametricoGeradoManual: (label, sizeName, pieceCount) => `Molde paramétrico gerado para **${label}** (${sizeName}).\n\n${pieceCount} peças calculadas. Visualize abaixo e clique **"Imprimir A4"** para baixar em escala real.`,
      preencher: (fields) => `Preencher: ${fields}`,
      gerarMolde: (garment) => `Gerar Molde — ${garment}`,
      garmentLabels: {
        saia: "Saia Reta",
        calca: "Calça Básica",
        blusa: "Blusa Básica",
        "blazer-masc": "Blazer Masculino",
        "blazer-fem": "Blazer Feminino",
      },
      fieldLabels: {
        cintura: "Cintura",
        quadril: "Quadril",
        busto: "Busto / Peitoral",
        comprimento: "Comprimento",
        altura: "Altura total",
        mangas: "Comprimento manga",
        ombros: "Largura ombros",
        pescoco: "Pescoço (circ.)",
        dorsoCostas: "Largura costas",
        profCava: "Prof. cava",
        punho: "Punho (circ.)",
        bracoCirc: "Braço (circ.)",
        entrepernas: "Entrep. (interno)",
        cava: "Cava (circ.)",
        coxa: "Coxa (circ.)",
        joelho: "Joelho (circ.)",
        tornozelo: "Tornozelo (circ.)",
      },
    },
    patternViewer: {
      seamAllowanceLabel: "margem de costura",
      hemLabel: "bainha",
      pdfButton: (pages) => `PDF (${pages}p)`,
      exportar: "Exportar ▾",
      svgDesc: "Illustrator / Inkscape",
      dxfDesc: "Máquinas de corte / CAD",
      pdfA4Desc: "Imprimir e cortar",
      foldOnBlueLine: "dobrar na linha azul",
      legendCortar: "cortar",
      legendCosturar: "costurar",
      legendDobrar: "dobrar",
      scaleNote: "Visualização em escala 1:1.67 — O PDF será impresso em escala real (1:1) para corte",
      medidasUtilizadas: "Medidas utilizadas",
      dobrarAqui: "DOBRAR AQUI",
      fio: "fio",
      pagina: "Página",
      peca: "Peça",
      margemCosturaLinha: (seam) => `Margem de costura: ${seam}cm (linha pontilhada = cortar, linha sólida = costurar)`,
    },
    fichaTecnica: {
      headerTitle: "Ficha Técnica — Patrofy AI",
      modo: "Modo",
      pdf: "PDF",
      tamanhoBase: "Tamanho base",
      margemCostura: "Margem costura",
      rendimentoTecido: "Rendimento tecido",
      tecidoRecomendado: "Tecido recomendado",
      tabelaMedidas: "Tabela de Medidas (cm)",
      tamanho: "Tamanho",
      partesDoMolde: (count) => `Partes do Molde (${count})`,
      fio: "fio",
      sequenciaMontagem: "Sequência de Montagem",
      alteracoesAplicadas: "Alterações Aplicadas",
      observacoesTecnicas: "Observações Técnicas",
      moldeFallback: "Molde",
      pdfLines: {
        fichaTecnica: (peca) => `FICHA TÉCNICA — ${peca}`,
        tamanhoLinha: (tamanho, tecido, margem) => `Tamanho base: ${tamanho}   |   Tecido: ${tecido}   |   Margem: ${margem}`,
        rendimento: (m) => `Rendimento de tecido: ${m} m`,
        partesDoMolde: "PARTES DO MOLDE:",
        parteItem: (i, nome, qty, fio, w, h) => `${i}. ${nome} — Qty: ${qty}  |  Fio: ${fio}  |  ${w}cm × ${h}cm`,
        sequenciaMontagem: "SEQUÊNCIA DE MONTAGEM:",
        observacoesTecnicas: "OBSERVAÇÕES TÉCNICAS:",
        alteracoesAplicadas: "\nALTERAÇÕES APLICADAS:",
      },
    },
  },
  en: {
    common: {
      entrar: "Sign In",
      cadastrar: "Sign Up",
      carregando: "Loading...",
      cancelar: "Cancel",
      salvar: "Save",
      adicionar: "Add",
      excluir: "Delete",
      voltar: "Back",
      sairDaConta: "Log out",
    },
    landing: {
      free: "Free",
      badge: "AI for Professional Sewing",
      titlePart1: "Professional patterns generated by",
      titlePart2: "AI in seconds.",
      subtitle: "Describe the piece you want and get complete technical instructions — measurements, shape, markings and cutting guidance.",
      cta: "Get started →",
      ctaSub: "100% free, no credit card required.",
      feature1Title: "Speed",
      feature1Desc: "Detailed patterns in seconds, no waiting for the next appointment.",
      feature2Title: "Technical precision",
      feature2Desc: "Professional instructions with measurements, markings and cutting guidance.",
      feature3Title: "Full history",
      feature3Desc: "All your patterns saved and accessible anytime.",
      footer: "© 2024 Patrofy — Powered by LLaMA 3 (Meta) via OpenRouter",
    },
    login: {
      tagline: "AI System for Pattern Generation",
      nome: "Name",
      nomePlaceholder: "Your full name",
      email: "Email",
      senha: "Password",
      aguarde: "Please wait...",
      criarConta: "Create account",
      erroRede: "Network error. Please try again.",
      contaCriada: "Account created! Check your email to confirm your registration.",
      termos: "By continuing, you agree to Patrofy's terms of use.",
    },
    dashboard: {
      novaConversa: "New chat",
      meusMoldes: "My Patterns",
      nenhumMolde: "No patterns saved yet.",
      assistente: "Pattern Assistant",
      portalEspecialista: "Expert Portal",
      painelAdmin: "Admin Panel",
      welcomeMessage: `Hi! I'm **Patrofy AI**, your clothing pattern-making assistant.

Describe the piece you want in free text — with measurements — and I'll generate the complete pattern automatically. Examples:

• **"Straight skirt waist 72 hip 98 length 65"**
• **"Basic blouse bust 92 waist 76 length 58"**
• **"Basic pants waist 74 hip 100 length 100"**

I can also analyze images of garments and generate the pattern from them.
• **Export as PDF** at 1:1 scale for professional sewing

How can I get started?`,
      moldeParametricoFallback: "Parametric pattern",
      moldeGerado: "Pattern generated.",
      analisarPrefix: "Analyze: ",
      gerandoMolde: "Generating pattern with AI…",
      baixarPDF: "Download PDF",
      copiar: "Copy",
      imagemEnviada: "Uploaded image",
      medidasCliente: "Client measurements (cm)",
      gerarMoldeParametricoTitulo: "Generate Parametric Pattern",
      medidasObrigatorias: "Required measurements",
      medidasComplementares: "Additional measurements (optional)",
      imagemReferencia: "Reference image",
      arquivoReferencia: "Reference file",
      gerarMoldeParametricoTooltip: "Generate parametric pattern (real shapes for cutting)",
      anexarImagemTooltip: "Attach image",
      adicionarMedidasTooltip: "Add measurements",
      inputPlaceholderFile: "Describe what you want to do with this file…",
      inputPlaceholderDefault: "Describe the piece: type, size, fabric, style…",
      footerHint: "Enter to send · 🔷 parametric pattern · 📎 image · 📏 measurements",
      erroAoGerar: "Error generating pattern.",
      erroDesconhecido: "Unknown error.",
      erroPrefix: "Error: ",
      moldeGeradoComSucesso: "Pattern generated successfully.",
      fichaTecnicaGeradaPara: (peca) => `Technical spec generated for **${peca}**.`,
      fichaTecnicaSimples: (peca) => `Technical spec: **${peca}**`,
      moldeParametricoGeradoFast: (label, sizeName) => `Parametric pattern generated: **${label}** (${sizeName}).\n\nExport as PDF, SVG or DXF with the **Export** button.`,
      moldeParametricoGeradoManual: (label, sizeName, pieceCount) => `Parametric pattern generated for **${label}** (${sizeName}).\n\n${pieceCount} pieces calculated. View below and click **"Print A4"** to download at real scale.`,
      preencher: (fields) => `Fill in: ${fields}`,
      gerarMolde: (garment) => `Generate Pattern — ${garment}`,
      garmentLabels: {
        saia: "Straight Skirt",
        calca: "Basic Pants",
        blusa: "Basic Blouse",
        "blazer-masc": "Men's Blazer",
        "blazer-fem": "Women's Blazer",
      },
      fieldLabels: {
        cintura: "Waist",
        quadril: "Hip",
        busto: "Bust / Chest",
        comprimento: "Length",
        altura: "Total height",
        mangas: "Sleeve length",
        ombros: "Shoulder width",
        pescoco: "Neck (circ.)",
        dorsoCostas: "Back width",
        profCava: "Armhole depth",
        punho: "Wrist (circ.)",
        bracoCirc: "Arm (circ.)",
        entrepernas: "Inseam",
        cava: "Armhole (circ.)",
        coxa: "Thigh (circ.)",
        joelho: "Knee (circ.)",
        tornozelo: "Ankle (circ.)",
      },
    },
    patternViewer: {
      seamAllowanceLabel: "seam allowance",
      hemLabel: "hem",
      pdfButton: (pages) => `PDF (${pages}p)`,
      exportar: "Export ▾",
      svgDesc: "Illustrator / Inkscape",
      dxfDesc: "Cutting machines / CAD",
      pdfA4Desc: "Print and cut",
      foldOnBlueLine: "fold on the blue line",
      legendCortar: "cut",
      legendCosturar: "sew",
      legendDobrar: "fold",
      scaleNote: "Preview at 1:1.67 scale — the PDF will be printed at real scale (1:1) for cutting",
      medidasUtilizadas: "Measurements used",
      dobrarAqui: "FOLD HERE",
      fio: "grain",
      pagina: "Page",
      peca: "Piece",
      margemCosturaLinha: (seam) => `Seam allowance: ${seam}cm (dashed line = cut, solid line = sew)`,
    },
    fichaTecnica: {
      headerTitle: "Technical Spec — Patrofy AI",
      modo: "Mode",
      pdf: "PDF",
      tamanhoBase: "Base size",
      margemCostura: "Seam allowance",
      rendimentoTecido: "Fabric yield",
      tecidoRecomendado: "Recommended fabric",
      tabelaMedidas: "Measurement Table (cm)",
      tamanho: "Size",
      partesDoMolde: (count) => `Pattern Pieces (${count})`,
      fio: "grain",
      sequenciaMontagem: "Assembly Sequence",
      alteracoesAplicadas: "Applied Changes",
      observacoesTecnicas: "Technical Notes",
      moldeFallback: "Pattern",
      pdfLines: {
        fichaTecnica: (peca) => `TECHNICAL SPEC — ${peca}`,
        tamanhoLinha: (tamanho, tecido, margem) => `Base size: ${tamanho}   |   Fabric: ${tecido}   |   Seam allowance: ${margem}`,
        rendimento: (m) => `Fabric yield: ${m} m`,
        partesDoMolde: "PATTERN PIECES:",
        parteItem: (i, nome, qty, fio, w, h) => `${i}. ${nome} — Qty: ${qty}  |  Grain: ${fio}  |  ${w}cm × ${h}cm`,
        sequenciaMontagem: "ASSEMBLY SEQUENCE:",
        observacoesTecnicas: "TECHNICAL NOTES:",
        alteracoesAplicadas: "\nAPPLIED CHANGES:",
      },
    },
  },
}
