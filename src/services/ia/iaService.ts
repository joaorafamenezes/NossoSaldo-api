import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { LlmFunctionTool, LlmProviderPort } from "../../ports/outbound/llmProviderPort";
import { OpenAiProvider } from "../../adapters/outbound/openai/openAiProvider";
import createHttpError from "http-errors";
import { IaConfiguracaoRepositoryPort } from "../../ports/outbound/iaConfiguracaoRepositoryPort";
import { iaConfiguracaoRepository } from "../../repositories/ia/iaConfiguracaoRepository";
import { iaConversaRepository } from "../../repositories/ia/iaConversaRepository";
import { IaConversaRepositoryPort } from "../../ports/outbound/iaConversaRepositoryPort";
import { SecretCipher, secretCipher } from "../../adapters/outbound/secrets/secretCipher";
import { gastoService as defaultGastoService } from "../gasto/gastoService";
import { categoriaService as defaultCategoriaService } from "../categoria/categoriaService";
import { cartaoCreditoService as defaultCartaoCreditoService } from "../cartaoCredito/cartaoCreditoService";
import { faturaCartaoService as defaultFaturaCartaoService } from "../faturaCartao/faturaCartaoService";

type GastoRepository = Pick<typeof gastoRepository, "listarGastosPorResponsavelId"> & {
  buscarGastoPorId?: (id: string) => Promise<any>;
};

function serializeGasto(gasto: any) {
  const categoria = gasto.categoriaDescricao ?? gasto.categoria?.descricao ?? null;
  const cartaoCredito = gasto.cartaoCreditoDescricao ?? null;
  const responsavel = gasto.responsavelNome ?? gasto.responsavel?.nome ?? null;
  const responsavelId = gasto.responsavelId ?? null;
  const faturaCartao = {
    competencia: gasto.faturaCartaoCompetencia ?? null,
    status: gasto.faturaCartaoStatus ?? null,
  };

  if (Array.isArray(gasto.lancamentosBase) && gasto.lancamentosBase.length > 0) {
    return gasto.lancamentosBase.map((parcela: any) => ({
      id: parcela.id,
      gastoId: gasto.id,
      descricao: `${gasto.descricao} - parcela ${parcela.numeroParcela}/${gasto.numeroParcelas}`,
      tipo: gasto.tipo,
      status: parcela.status,
      valor: Number(parcela.valorParcela),
      competencia: parcela.competencia,
      dataVencimento: parcela.dataVencimentoParcela,
      dataPagamento: parcela.dataPagamentoParcela ?? null,
      categoriaId: gasto.categoriaId ?? null,
      categoria,
      responsavel,
      responsavelId,
      cartaoCredito,
      faturaCartao: {
        competencia: parcela.faturaCartaoCompetencia ?? faturaCartao.competencia,
        status: parcela.faturaCartaoStatus ?? faturaCartao.status,
      },
    }));
  }

  return [{
    id: gasto.id,
    gastoId: gasto.id,
    descricao: gasto.descricao,
    tipo: gasto.tipo,
    status: gasto.status,
    valor: Number(gasto.valor),
    competencia: gasto.competencia,
    dataVencimento: gasto.dataVencimento,
    dataPagamento: gasto.dataPagamento ?? null,
    categoriaId: gasto.categoriaId ?? null,
    categoria,
    responsavel,
    responsavelId,
    cartaoCredito,
    faturaCartao,
  }];
}

const financialTools: LlmFunctionTool[] = [
  // --- Consultas ---
  {
    type: "function",
    name: "resumo_financeiro",
    description: "Calcula totais de receitas, despesas, pagos e pendentes dos registros do usuario e da conta conjunta (quando existente) no periodo informado pela data de vencimento.",
    parameters: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial no formato YYYY-MM-DD." },
        ate: { type: "string", description: "Data final no formato YYYY-MM-DD." },
        responsavel: { type: "string", description: "Nome ou parte do nome da pessoa responsavel pelo gasto (ex: Cinthia, Joao) para consultar totais de um membro do casal ou comparar." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "listar_gastos",
    description: "Lista gastos e despesas do usuario e da conta conjunta (quando existente), podendo filtrar por periodo de vencimento, status, tipo, nome do cartao e nome do responsavel (ex: Cinthia, Joao).",
    parameters: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial YYYY-MM-DD." },
        ate: { type: "string", description: "Data final YYYY-MM-DD." },
        status: { type: "string", enum: ["pendente", "pago", "atrasado", "cancelado"] },
        tipo: { type: "string", enum: ["receita", "despesa"] },
        cartao: { type: "string", description: "Parte do nome do cartao de credito, como Nubank." },
        responsavel: { type: "string", description: "Nome ou parte do nome do responsavel pelo lancamento (ex: Cinthia, Joao) para consultar compras do parceiro ou individuais na conta conjunta." },
        limite: { type: "integer", minimum: 1, maximum: 50 },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "top_categorias",
    description: "Agrupa as despesas por categoria e ordena pelo maior valor no periodo de vencimento informado.",
    parameters: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial YYYY-MM-DD." },
        ate: { type: "string", description: "Data final YYYY-MM-DD." },
        responsavel: { type: "string", description: "Nome ou parte do nome do responsavel pelo gasto." },
        limite: { type: "integer", minimum: 1, maximum: 10 },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },

  // --- Operações de Gastos & Receitas ---
  {
    type: "function",
    name: "criar_gasto",
    description: "Cria e cadastra um novo gasto ou receita para o usuario no NossoSaldo. Permite compras a vista ou parceladas e vinculacao a cartao de credito ou categoria.",
    parameters: {
      type: "object",
      properties: {
        descricao: { type: "string", description: "Nome ou descricao do gasto/receita, ex: Supermercado Carrefour, Conta de Luz, Almoço." },
        valor: { type: "number", description: "Valor monetario em reais (ex: 150.50 ou 50)." },
        tipo: { type: "string", enum: ["despesa", "receita"], description: "Tipo do lancamento (padrao: despesa)." },
        dataVencimento: { type: "string", description: "Data de vencimento ou compra no formato YYYY-MM-DD. Se nao especificada, use a data de hoje." },
        categoria: { type: "string", description: "Nome ou termo da categoria, ex: Alimentacao, Supermercado, Transporte, Moradia." },
        cartao: { type: "string", description: "Nome do cartao de credito caso a compra tenha sido no cartao, ex: Nubank, Inter." },
        numeroParcelas: { type: "integer", minimum: 1, maximum: 48, description: "Quantidade de parcelas se for compra parcelada (padrao: 1)." },
        observacao: { type: "string", description: "Observacao adicional opcional." },
      },
      required: ["descricao", "valor"],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "alterar_gasto",
    description: "Altera ou edita dados de um gasto existente (descricao, valor, data de vencimento ou categoria).",
    parameters: {
      type: "object",
      properties: {
        gastoId: { type: "string", description: "ID do gasto se conhecido." },
        buscaDescricao: { type: "string", description: "Nome ou parte da descricao do gasto a ser alterado, ex: Farmacia." },
        novoValor: { type: "number", description: "Novo valor em reais." },
        novaDescricao: { type: "string", description: "Nova descricao ou nome do gasto." },
        novaDataVencimento: { type: "string", description: "Nova data de vencimento no formato YYYY-MM-DD." },
        novaCategoria: { type: "string", description: "Novo nome da categoria para reclassificar o gasto." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "pagar_gasto",
    description: "Realiza o pagamento e liquidacao de um gasto pendente.",
    parameters: {
      type: "object",
      properties: {
        gastoId: { type: "string", description: "ID do gasto a ser pago." },
        buscaDescricao: { type: "string", description: "Nome ou parte da descricao do gasto a ser pago, ex: Luz, Internet." },
        dataPagamento: { type: "string", description: "Data do pagamento no formato YYYY-MM-DD (padrao: data de hoje)." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "desfazer_pagamento_gasto",
    description: "Desfaz o pagamento de um gasto previamente quitado, retornando-o ao status pendente.",
    parameters: {
      type: "object",
      properties: {
        gastoId: { type: "string", description: "ID do gasto." },
        buscaDescricao: { type: "string", description: "Nome ou parte da descricao do gasto cujo pagamento sera desfeito." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "excluir_gasto",
    description: "Exclui permanentemente um gasto do usuario.",
    parameters: {
      type: "object",
      properties: {
        gastoId: { type: "string", description: "ID do gasto." },
        buscaDescricao: { type: "string", description: "Nome ou parte da descricao do gasto a excluir." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },

  // --- Operações de Categorias ---
  {
    type: "function",
    name: "listar_categorias",
    description: "Lista todas as categorias disponiveis no sistema para classificacao de gastos.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "criar_categoria",
    description: "Cria uma nova categoria para organizar gastos e receitas no NossoSaldo.",
    parameters: {
      type: "object",
      properties: {
        descricao: { type: "string", description: "Nome da nova categoria, ex: Pets, Educacao, Hobbies." },
        cor: { type: "string", description: "Codigo de cor hexadecimal, ex: #10B981." },
        icone: { type: "string", description: "Nome do icone Lucide, ex: Dog, Book, Sparkles." },
      },
      required: ["descricao"],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "alterar_categoria",
    description: "Altera o nome, cor ou icone de uma categoria existente.",
    parameters: {
      type: "object",
      properties: {
        categoriaId: { type: "string", description: "ID da categoria." },
        nomeAtual: { type: "string", description: "Nome atual da categoria a alterar, ex: Viagens." },
        novaDescricao: { type: "string", description: "Novo nome da categoria, ex: Ferias & Viagens." },
        novaCor: { type: "string", description: "Nova cor hexadecimal." },
        novoIcone: { type: "string", description: "Novo icone." },
      },
      required: ["novaDescricao"],
      additionalProperties: false,
    },
    strict: false,
  },

  // --- Operações de Cartões de Crédito & Faturas ---
  {
    type: "function",
    name: "consultar_cartoes",
    description: "Consulta todos os cartoes de credito cadastrados do usuario, limites, dia de fechamento e dia de vencimento.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "consultar_faturas_cartao",
    description: "Consulta as faturas de cartao de credito por periodo ou status (aberta, fechada, paga, futura).",
    parameters: {
      type: "object",
      properties: {
        cartao: { type: "string", description: "Nome ou parte do nome do cartao de credito (ex: Nubank)." },
        status: { type: "string", enum: ["aberta", "fechada", "paga", "futura"] },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "consultar_gastos_fatura",
    description: "Consulta todos os lancamentos e compras detalhadas pertencentes a uma fatura especifica de cartao de credito.",
    parameters: {
      type: "object",
      properties: {
        faturaId: { type: "string", description: "ID da fatura." },
        cartao: { type: "string", description: "Nome do cartao de credito." },
        competencia: { type: "string", description: "Competencia no formato YYYY-MM (ex: 2026-08 ou 2026-09)." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "pagar_fatura_cartao",
    description: "Efetua o pagamento total de uma fatura de cartao de credito, quitando a fatura e todas as suas despesas/parcelas filhotes.",
    parameters: {
      type: "object",
      properties: {
        faturaId: { type: "string", description: "ID da fatura." },
        cartao: { type: "string", description: "Nome do cartao de credito." },
        competencia: { type: "string", description: "Competencia YYYY-MM da fatura a pagar (ex: 2026-08)." },
        dataPagamento: { type: "string", description: "Data de pagamento no formato YYYY-MM-DD (padrao: hoje)." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "reabrir_fatura_cartao",
    description: "Reabre uma fatura de cartao de credito que estava fechada ou paga, desfazendo o fechamento ou quitacao transacionalmente.",
    parameters: {
      type: "object",
      properties: {
        faturaId: { type: "string", description: "ID da fatura." },
        cartao: { type: "string", description: "Nome do cartao de credito." },
        competencia: { type: "string", description: "Competencia YYYY-MM da fatura a reabrir." },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
];

const nossoSaldoTerms = [
  "gasto", "despesa", "receita", "pagamento", "parcela", "fatura", "cartao", "cartão", "categoria",
  "saldo", "conta", "financeir", "vencimento", "pendente", "atrasad", "pago", "registro",
  "orcamento", "orçamento", "econom", "total", "quanto", "mes", "mês", "ano", "cadastr", "cri",
  "adicion", "alter", "mud", "edit", "pag", "quit", "desfaz", "reabr", "exclu", "delet", "remov",
  "compr", "mercado", "supermercado", "farmacia", "farmácia", "luz", "agua", "água", "internet",
  "salario", "salário", "valor", "reais", "r$", "limite", "fechamento", "resumo", "relatorio",
  "relatório", "opcao", "opção", "primeir", "segund", "terceir", "detalhe", "extrato",
];

const blockedExternalTerms = [
  "internet", "pesquise", "pesquisa na web", "noticia", "notícias", "clima", "cotacao", "cotaçao",
  "tempo hoje", "futebol", "politica", "política", "programacao", "programação", "codigo", "código", "senha",
  "api key", "chave da api", "ignore as instrucoes", "ignore as instruções", "prompt do sistema",
];

function validateQuestionScope(pergunta: string, hasActiveHistory = false) {
  const normalized = pergunta.trim().toLocaleLowerCase("pt-BR");

  if (normalized.length < 1) {
    throw createHttpError(422, "Informe uma pergunta ou solicitacao sobre seus dados financeiros no NossoSaldo.");
  }

  if (blockedExternalTerms.some((term) => normalized.includes(term))) {
    throw createHttpError(422, "Posso ajudar apenas com informacoes e acoes financeiras disponiveis na sua conta do NossoSaldo.");
  }

  // Se o usuário está em uma conversa contínua já iniciada, aceitamos respostas curtas e de contexto (ex: "1", "primeiro", "sim", "faça isso")
  if (hasActiveHistory) {
    return;
  }

  if (normalized.length < 3) {
    throw createHttpError(422, "Informe uma pergunta ou solicitacao sobre seus dados financeiros no NossoSaldo.");
  }

  if (!nossoSaldoTerms.some((term) => normalized.includes(term))) {
    throw createHttpError(422, "Posso ajudar apenas com informacoes e acoes financeiras disponiveis na sua conta do NossoSaldo.");
  }
}

function parseArguments(argumentsJson: string) {
  const parsed = JSON.parse(argumentsJson) as Record<string, any>;
  const dateFields = ["de", "ate", "dataVencimento", "novaDataVencimento", "dataPagamento"];

  for (const field of dateFields) {
    if (parsed[field] !== undefined && (typeof parsed[field] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(parsed[field]))) {
      throw new Error(`O argumento '${field}' deve estar no formato YYYY-MM-DD.`);
    }
  }

  if (parsed.de && parsed.ate && parsed.de > parsed.ate) {
    throw new Error("O periodo informado e invalido.");
  }

  return parsed;
}

function dateOnly(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function filterRecords(records: any[], args: Record<string, any>) {
  return records.filter((record) => {
    const dueDate = dateOnly(record.dataVencimento);
    if (args.de && (!dueDate || dueDate < args.de)) return false;
    if (args.ate && (!dueDate || dueDate > args.ate)) return false;
    if (args.status && record.status !== args.status) return false;
    if (args.tipo && record.tipo !== args.tipo) return false;
    if (args.cartao && !String(record.cartaoCredito ?? "").toLocaleLowerCase("pt-BR").includes(String(args.cartao).toLocaleLowerCase("pt-BR"))) return false;
    if (args.responsavel && !String(record.responsavel ?? "").toLocaleLowerCase("pt-BR").includes(String(args.responsavel).toLocaleLowerCase("pt-BR"))) return false;
    return true;
  });
}

export class IaService {
  constructor(
    private readonly gastos: GastoRepository = gastoRepository,
    private readonly providerFactory: (apiKey: string, model: string) => LlmProviderPort = (apiKey, model) => new OpenAiProvider(apiKey, model),
    private readonly configuracoes: IaConfiguracaoRepositoryPort = iaConfiguracaoRepository,
    private readonly cipher: SecretCipher = secretCipher,
    private readonly conversas: IaConversaRepositoryPort = iaConversaRepository,
    private readonly gastoServ: typeof defaultGastoService = defaultGastoService,
    private readonly categoriaServ: typeof defaultCategoriaService = defaultCategoriaService,
    private readonly cartaoServ: typeof defaultCartaoCreditoService = defaultCartaoCreditoService,
    private readonly faturaServ: typeof defaultFaturaCartaoService = defaultFaturaCartaoService,
  ) {}

  private async resolverCategoria(termo?: string) {
    if (!termo) return null;
    try {
      const categorias = await this.categoriaServ.buscarTodasCategorias();
      const termoLower = termo.toLowerCase().trim();
      return (
        categorias.find((c: any) => c.id === termo || c.descricao.toLowerCase() === termoLower) ||
        categorias.find((c: any) => c.descricao.toLowerCase().includes(termoLower)) ||
        null
      );
    } catch {
      return null;
    }
  }

  private async resolverCartao(usuarioId: string, termo?: string) {
    if (!termo) return null;
    try {
      const cartoes = await this.cartaoServ.listarCartoesCreditoPorUsuario(usuarioId);
      const termoLower = termo.toLowerCase().trim();
      return (
        cartoes.find((c: any) => c.id === termo || c.descricao.toLowerCase() === termoLower) ||
        cartoes.find((c: any) => c.descricao.toLowerCase().includes(termoLower)) ||
        null
      );
    } catch {
      return null;
    }
  }

  private async resolverGasto(usuarioId: string, gastoId?: string, buscaDescricao?: string) {
    if (gastoId) {
      if (typeof this.gastos.buscarGastoPorId === "function") {
        const gasto = await this.gastos.buscarGastoPorId(gastoId);
        if (gasto) return gasto;
      }
    }

    if (buscaDescricao && typeof this.gastos.listarGastosPorResponsavelId === "function") {
      const todos = await this.gastos.listarGastosPorResponsavelId(usuarioId);
      const termo = buscaDescricao.toLowerCase().trim();
      const candidatos = todos.filter((g: any) => g.descricao.toLowerCase().includes(termo));
      if (candidatos.length > 0) {
        return candidatos[0];
      }
    }

    return null;
  }

  private async resolverFatura(usuarioId: string, faturaId?: string, cartaoTermo?: string, competencia?: string) {
    if (faturaId) {
      try {
        const extrato = await this.faturaServ.buscarExtratoFatura(faturaId, usuarioId);
        if (extrato) return extrato;
      } catch {}
    }

    try {
      const faturas = await this.faturaServ.listarFaturasPorUsuario(usuarioId);
      const cartao = await this.resolverCartao(usuarioId, cartaoTermo);

      let filtradas = faturas;
      if (cartao) {
        filtradas = filtradas.filter((f: any) => f.cartaoCreditoId === cartao.id);
      }
      if (competencia) {
        filtradas = filtradas.filter((f: any) => {
          const compDate = new Date(f.competencia);
          const compStr = `${compDate.getUTCFullYear()}-${String(compDate.getUTCMonth() + 1).padStart(2, "0")}`;
          return compStr === competencia || f.competencia === competencia;
        });
      }
      return filtradas.length > 0 ? filtradas[0] : null;
    } catch {
      return null;
    }
  }

  async configurar(usuarioId: string, apiKey: string, modelo = "gpt-4.1-mini", provedor = "openai") {
    const chave = apiKey ? apiKey.trim() : "";
    const existente = this.configuracoes.buscarPorUsuarioId ? await this.configuracoes.buscarPorUsuarioId(usuarioId) : null;

    let chaveCriptografada: string;
    let iv: string;
    let authTag: string;

    if (chave === "__KEEP_CURRENT_KEY__" || (!chave && existente)) {
      if (!existente) {
        throw createHttpError(422, "Informe uma chave de API valida.");
      }
      chaveCriptografada = existente.chaveCriptografada;
      iv = existente.iv;
      authTag = existente.authTag;
    } else {
      if (chave.length < 10) {
        throw createHttpError(422, "Informe uma chave de API valida.");
      }
      const criptografada = this.cipher.encrypt(chave);
      chaveCriptografada = criptografada.value;
      iv = criptografada.iv;
      authTag = criptografada.authTag;
    }

    const configuracao = await this.configuracoes.salvar({
      usuarioId,
      provedor: provedor || "openai",
      modelo: modelo || "gpt-4.1-mini",
      chaveCriptografada,
      iv,
      authTag,
    });

    return {
      configurada: true,
      provedor: configuracao.provedor,
      modelo: configuracao.modelo,
      atualizadaEm: configuracao.updatedAt,
    };
  }

  async status(usuarioId: string) {
    const configuracao = this.configuracoes.buscarConfiguracaoAtiva
      ? await this.configuracoes.buscarConfiguracaoAtiva(usuarioId)
      : await this.configuracoes.buscarPorUsuarioId(usuarioId);

    return configuracao
      ? { configurada: true, provedor: configuracao.provedor, modelo: configuracao.modelo, atualizadaEm: configuracao.updatedAt }
      : { configurada: false };
  }

  async removerConfiguracao(usuarioId: string) {
    await this.configuracoes.removerPorUsuarioId(usuarioId);
    return { configurada: false };
  }

  async listarHistorico(usuarioId: string) {
    return this.conversas.listarPorUsuarioId(usuarioId, 50);
  }

  async removerHistorico(usuarioId: string) {
    await this.conversas.removerPorUsuarioId(usuarioId);
    return { removido: true };
  }

  async consultar(pergunta: string, usuarioId: string) {
    let historicoRecente: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (this.conversas && this.conversas.listarPorUsuarioId) {
      try {
        const ultimasConversas = await this.conversas.listarPorUsuarioId(usuarioId, 6);
        historicoRecente = [...ultimasConversas].reverse().flatMap((c) => [
          { role: "user" as const, content: c.pergunta },
          { role: "assistant" as const, content: c.resposta },
        ]);
      } catch {
        historicoRecente = [];
      }
    }

    validateQuestionScope(pergunta, historicoRecente.length > 0);

    const configuracao = this.configuracoes.buscarConfiguracaoAtiva
      ? await this.configuracoes.buscarConfiguracaoAtiva(usuarioId)
      : await this.configuracoes.buscarPorUsuarioId(usuarioId);

    if (!configuracao) {
      throw createHttpError(422, "Configure sua chave de IA antes de realizar uma consulta.");
    }

    if (configuracao.provedor !== "openai") {
      throw createHttpError(422, "O provedor configurado nao e suportado.");
    }

    const chave = this.cipher.decrypt(configuracao.chaveCriptografada, configuracao.iv, configuracao.authTag);
    const provider = this.providerFactory(chave, configuracao.modelo);
    const gastos = await this.gastos.listarGastosPorResponsavelId(usuarioId);
    const registros = gastos.flatMap(serializeGasto);

    if (!provider.responderComFuncoes) {
      throw createHttpError(503, "O provedor configurado nao suporta consultas por funcoes.");
    }

    let acaoRealizada: { tipo: string; payload?: any } | null = null;

    const resposta = await provider.responderComFuncoes({
      question: pergunta,
      history: historicoRecente,
      tools: financialTools,
      execute: async (name, argumentsJson) => {
        const args = parseArguments(argumentsJson);

        // --- 1. Consultas ---
        if (name === "listar_gastos") {
          const limite = typeof args.limite === "number" ? Math.min(Math.max(args.limite, 1), 50) : 50;
          return filterRecords(registros, args).slice(0, limite);
        }

        if (name === "resumo_financeiro") {
          const filtrados = filterRecords(registros, args).filter((record) => record.status !== "cancelado");
          return filtrados.reduce((resumo: Record<string, any>, record) => {
            resumo.quantidade += 1;
            resumo[record.tipo] += record.valor;
            resumo[record.status] = (resumo[record.status] ?? 0) + record.valor;
            return resumo;
          }, { quantidade: 0, receita: 0, despesa: 0, pago: 0, pendente: 0, atrasado: 0 });
        }

        if (name === "top_categorias") {
          const limite = typeof args.limite === "number" ? Math.min(Math.max(args.limite, 1), 10) : 10;
          const agrupado = new Map<string, { categoria: string; valor: number; quantidade: number }>();

          for (const record of filterRecords(registros, { ...args, tipo: "despesa" }).filter((item) => item.status !== "cancelado")) {
            const categoria = record.categoria ?? record.categoriaId ?? "Sem categoria";
            const atual = agrupado.get(categoria) ?? { categoria, valor: 0, quantidade: 0 };
            atual.valor += record.valor;
            atual.quantidade += 1;
            agrupado.set(categoria, atual);
          }

          return Array.from(agrupado.values()).sort((a, b) => b.valor - a.valor).slice(0, limite);
        }

        // --- 2. Criação e Mutação de Gastos ---
        if (name === "criar_gasto") {
          const cat = await this.resolverCategoria(args.categoria);
          const cartao = await this.resolverCartao(usuarioId, args.cartao);
          const dataVencimento = args.dataVencimento ? new Date(args.dataVencimento) : new Date();
          const competencia = new Date(Date.UTC(dataVencimento.getUTCFullYear(), dataVencimento.getUTCMonth(), 1));
          const numParcelas = typeof args.numeroParcelas === "number" ? Math.max(1, args.numeroParcelas) : 1;

          const created = await this.gastoServ.criarGastoUsuarioLogado({
            descricao: args.descricao,
            tipo: args.tipo || "despesa",
            status: "pendente",
            origemLancamento: numParcelas > 1 ? "parcelado" : "unico",
            numeroParcelas: numParcelas,
            naoCompartilhar: false,
            valor: Number(args.valor),
            competencia,
            dataVencimento,
            observacao: args.observacao ?? undefined,
            categoriaId: cat?.id || (await this.resolverCategoria("Geral"))?.id,
            cartaoCreditoId: cartao?.id ?? undefined,
            responsavelId: usuarioId,
          });

          acaoRealizada = { tipo: "gasto_criado", payload: created };
          return {
            sucesso: true,
            mensagem: `Gasto '${args.descricao}' de R$ ${Number(args.valor).toFixed(2)} cadastrado com sucesso.`,
            gasto: created,
          };
        }

        if (name === "alterar_gasto") {
          const gasto = await this.resolverGasto(usuarioId, args.gastoId, args.buscaDescricao);
          if (!gasto) {
            return { erro: "Nao foi encontrado nenhum gasto com os dados informados para alteracao." };
          }

          const alteracoes: any = {};
          if (args.novaDescricao) alteracoes.descricao = args.novaDescricao;
          if (args.novoValor) alteracoes.valor = Number(args.novoValor);
          if (args.novaDataVencimento) {
            alteracoes.dataVencimento = new Date(args.novaDataVencimento);
            alteracoes.competencia = new Date(Date.UTC(alteracoes.dataVencimento.getUTCFullYear(), alteracoes.dataVencimento.getUTCMonth(), 1));
          }
          if (args.novaCategoria) {
            const cat = await this.resolverCategoria(args.novaCategoria);
            if (cat) alteracoes.categoriaId = cat.id;
          }

          const updated = await this.gastoServ.atualizarGasto(gasto.id, alteracoes, usuarioId);
          acaoRealizada = { tipo: "gasto_alterado", payload: updated };
          return {
            sucesso: true,
            mensagem: `Gasto '${gasto.descricao}' atualizado com sucesso.`,
            gastoAtualizado: updated,
          };
        }

        if (name === "pagar_gasto") {
          const gasto = await this.resolverGasto(usuarioId, args.gastoId, args.buscaDescricao);
          if (!gasto) {
            return { erro: "Gasto nao encontrado para realizar o pagamento." };
          }

          const dataPagamento = args.dataPagamento ? new Date(args.dataPagamento) : new Date();
          const pago = await this.gastoServ.pagarGasto(gasto.id, { dataPagamento }, usuarioId);
          acaoRealizada = { tipo: "gasto_pago", payload: pago };
          return {
            sucesso: true,
            mensagem: `Gasto '${gasto.descricao}' de R$ ${Number(gasto.valor).toFixed(2)} marcado como pago.`,
            gasto: pago,
          };
        }

        if (name === "desfazer_pagamento_gasto") {
          const gasto = await this.resolverGasto(usuarioId, args.gastoId, args.buscaDescricao);
          if (!gasto) {
            return { erro: "Gasto nao encontrado para desfazer pagamento." };
          }

          const reaberto = await this.gastoServ.reabrirGasto(gasto.id, usuarioId);
          acaoRealizada = { tipo: "pagamento_desfeito", payload: reaberto };
          return {
            sucesso: true,
            mensagem: `Pagamento do gasto '${gasto.descricao}' desfeito. Status alterado para pendente.`,
            gasto: reaberto,
          };
        }

        if (name === "excluir_gasto") {
          const gasto = await this.resolverGasto(usuarioId, args.gastoId, args.buscaDescricao);
          if (!gasto) {
            return { erro: "Gasto nao encontrado para exclusao." };
          }

          await this.gastoServ.deletarGasto(gasto.id, usuarioId);
          acaoRealizada = { tipo: "gasto_excluido", payload: { id: gasto.id, descricao: gasto.descricao } };
          return {
            sucesso: true,
            mensagem: `Gasto '${gasto.descricao}' excluido com sucesso.`,
          };
        }

        // --- 3. Categorias ---
        if (name === "listar_categorias") {
          const categorias = await this.categoriaServ.buscarTodasCategorias();
          return categorias.map((c: any) => ({ id: c.id, descricao: c.descricao, cor: c.cor, icone: c.iconName || c.icone }));
        }

        if (name === "criar_categoria") {
          const cat = await this.categoriaServ.criarCategoria({
            descricao: args.descricao,
            cor: args.cor || "#10B981",
            iconName: args.icone || args.iconName || "Folder",
          });
          acaoRealizada = { tipo: "categoria_criada", payload: cat };
          return {
            sucesso: true,
            mensagem: `Categoria '${cat.descricao}' criada com sucesso.`,
            categoria: cat,
          };
        }

        if (name === "alterar_categoria") {
          const cat = await this.resolverCategoria(args.categoriaId || args.nomeAtual);
          if (!cat) {
            return { erro: "Categoria nao encontrada para alteracao." };
          }

          const updated = await this.categoriaServ.atualizarCategoria(cat.id, {
            descricao: args.novaDescricao || cat.descricao,
            cor: args.novaCor || cat.cor,
            iconName: args.novoIcone || args.novoIconName || (cat as any).iconName || "Folder",
          });
          acaoRealizada = { tipo: "categoria_alterada", payload: updated };
          return {
            sucesso: true,
            mensagem: `Categoria renomeada para '${updated.descricao}'.`,
            categoria: updated,
          };
        }

        // --- 4. Cartões de Crédito & Faturas ---
        if (name === "consultar_cartoes") {
          const cartoes = await this.cartaoServ.listarCartoesCreditoPorUsuario(usuarioId);
          return cartoes.map((c: any) => ({
            id: c.id,
            descricao: c.descricao,
            limite: Number(c.limite),
            diaFechamento: c.diaFechamento,
            diaVencimento: c.diaVencimento,
            cor: c.cor,
            ultimosDigitos: c.ultimosDigitos,
          }));
        }

        if (name === "consultar_faturas_cartao") {
          let faturas = await this.faturaServ.listarFaturasPorUsuario(usuarioId);
          if (args.cartao) {
            const cartao = await this.resolverCartao(usuarioId, args.cartao);
            if (cartao) faturas = faturas.filter((f: any) => f.cartaoCreditoId === cartao.id);
          }
          if (args.status) {
            faturas = faturas.filter((f: any) => f.status === args.status);
          }

          return faturas.map((f: any) => ({
            id: f.id,
            cartao: f.cartaoCredito?.descricao,
            competencia: f.competencia,
            valorTotal: Number(f.valorTotal),
            status: f.status,
            dataFechamento: f.dataFechamento,
            dataVencimento: f.dataVencimento,
          }));
        }

        if (name === "consultar_gastos_fatura") {
          const fatura = await this.resolverFatura(usuarioId, args.faturaId, args.cartao, args.competencia);
          if (!fatura) {
            return { erro: "Fatura do cartao nao encontrada." };
          }

          const extrato = await this.faturaServ.buscarExtratoFatura(fatura.id, usuarioId);
          return extrato;
        }

        if (name === "pagar_fatura_cartao") {
          const fatura = await this.resolverFatura(usuarioId, args.faturaId, args.cartao, args.competencia);
          if (!fatura) {
            return { erro: "Fatura nao encontrada para pagamento." };
          }

          const dataPagamento = args.dataPagamento ? new Date(args.dataPagamento) : new Date();
          const paga = await this.faturaServ.pagarFatura(fatura.id, { dataPagamento }, usuarioId);
          acaoRealizada = { tipo: "fatura_paga", payload: paga };
          return {
            sucesso: true,
            mensagem: `Fatura paga com sucesso. Valor total: R$ ${Number(fatura.valorTotal).toFixed(2)}.`,
            fatura: paga,
          };
        }

        if (name === "reabrir_fatura_cartao") {
          const fatura = await this.resolverFatura(usuarioId, args.faturaId, args.cartao, args.competencia);
          if (!fatura) {
            return { erro: "Fatura nao encontrada para reabertura." };
          }

          const reaberta = await this.faturaServ.reabrirFatura(fatura.id, usuarioId);
          acaoRealizada = { tipo: "fatura_reaberta", payload: reaberta };
          return {
            sucesso: true,
            mensagem: "Fatura reaberta com sucesso. Todos os lancamentos foram retornados para pendente.",
            fatura: reaberta,
          };
        }

        throw new Error("Funcao financeira nao autorizada.");
      },
    });

    const historico = await this.conversas.criar({
      usuarioId,
      pergunta,
      resposta,
      provedor: "openai",
      modelo: configuracao.modelo,
    });

    return {
      resposta,
      provedor: "openai",
      modelo: configuracao.modelo,
      historicoId: historico.id,
      criadaEm: historico.createdAt,
      acaoRealizada,
    };
  }
}

export const iaService = new IaService();
