import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { LlmFunctionTool, LlmProviderPort } from "../../ports/outbound/llmProviderPort";
import { OpenAiProvider } from "../../adapters/outbound/openai/openAiProvider";
import createHttpError from "http-errors";
import { IaConfiguracaoRepositoryPort } from "../../ports/outbound/iaConfiguracaoRepositoryPort";
import { iaConfiguracaoRepository } from "../../repositories/ia/iaConfiguracaoRepository";
import { iaConversaRepository } from "../../repositories/ia/iaConversaRepository";
import { IaConversaRepositoryPort } from "../../ports/outbound/iaConversaRepositoryPort";
import { SecretCipher, secretCipher } from "../../adapters/outbound/secrets/secretCipher";

type GastoRepository = Pick<typeof gastoRepository, "listarGastosPorResponsavelId">;

function serializeGasto(gasto: any) {
  const categoria = gasto.categoriaDescricao ?? gasto.categoria?.descricao ?? null;

  if (Array.isArray(gasto.lancamentosBase) && gasto.lancamentosBase.length > 0) {
    return gasto.lancamentosBase.map((parcela: any) => ({
      descricao: `${gasto.descricao} - parcela ${parcela.numeroParcela}/${gasto.numeroParcelas}`,
      tipo: gasto.tipo,
      status: parcela.status,
      valor: Number(parcela.valorParcela),
      competencia: parcela.competencia,
      dataVencimento: parcela.dataVencimentoParcela,
      dataPagamento: parcela.dataPagamentoParcela ?? null,
      categoriaId: gasto.categoriaId ?? null,
      categoria,
    }));
  }

  return [{
    descricao: gasto.descricao,
    tipo: gasto.tipo,
    status: gasto.status,
    valor: Number(gasto.valor),
    competencia: gasto.competencia,
    dataVencimento: gasto.dataVencimento,
    dataPagamento: gasto.dataPagamento ?? null,
    categoriaId: gasto.categoriaId ?? null,
    categoria,
  }];
}

const financialTools: LlmFunctionTool[] = [
  {
    type: "function",
    name: "resumo_financeiro",
    description: "Calcula totais de receitas, despesas, pagos e pendentes dos registros do usuario no periodo informado pela data de vencimento.",
    parameters: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial no formato YYYY-MM-DD." },
        ate: { type: "string", description: "Data final no formato YYYY-MM-DD." },
      },
      required: [],
      additionalProperties: false,
    },
    // Os filtros sao opcionais; a validacao final acontece antes da execucao.
    strict: false,
  },
  {
    type: "function",
    name: "listar_gastos",
    description: "Lista gastos do usuario, podendo filtrar por periodo de vencimento, status e tipo. Nunca informe usuarioId.",
    parameters: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial YYYY-MM-DD." },
        ate: { type: "string", description: "Data final YYYY-MM-DD." },
        status: { type: "string", enum: ["pendente", "pago", "atrasado", "cancelado"] },
        tipo: { type: "string", enum: ["receita", "despesa"] },
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
    description: "Agrupa as despesas do usuario por categoria e ordena pelo maior valor no periodo de vencimento informado.",
    parameters: {
      type: "object",
      properties: {
        de: { type: "string", description: "Data inicial YYYY-MM-DD." },
        ate: { type: "string", description: "Data final YYYY-MM-DD." },
        limite: { type: "integer", minimum: 1, maximum: 10 },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
];

function parseArguments(argumentsJson: string) {
  const parsed = JSON.parse(argumentsJson) as Record<string, any>;
  const dateFields = ["de", "ate"];

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
  ) {}

  async configurar(usuarioId: string, apiKey: string, modelo = "gpt-4.1-mini") {
    const chave = apiKey.trim();

    if (!chave.startsWith("sk-") || chave.length < 20) {
      throw createHttpError(422, "Informe uma chave de API OpenAI valida.");
    }

    const criptografada = this.cipher.encrypt(chave);
    const configuracao = await this.configuracoes.salvar({
      usuarioId,
      provedor: "openai",
      modelo,
      chaveCriptografada: criptografada.value,
      iv: criptografada.iv,
      authTag: criptografada.authTag,
    });

    return {
      configurada: true,
      provedor: configuracao.provedor,
      modelo: configuracao.modelo,
      atualizadaEm: configuracao.updatedAt,
    };
  }

  async status(usuarioId: string) {
    const configuracao = await this.configuracoes.buscarPorUsuarioId(usuarioId);

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
    const configuracao = await this.configuracoes.buscarPorUsuarioId(usuarioId);

    if (!configuracao) {
      throw createHttpError(422, "Configure sua chave da OpenAI antes de realizar uma consulta.");
    }

    if (configuracao.provedor !== "openai") {
      throw createHttpError(422, "O provedor configurado nao e suportado.");
    }

    const chave = this.cipher.decrypt(configuracao.chaveCriptografada, configuracao.iv, configuracao.authTag);
    const provider = this.providerFactory(chave, configuracao.modelo);
    const gastos = await this.gastos.listarGastosPorResponsavelId(usuarioId);
    const registrosDoUsuario = gastos.filter((gasto) => gasto.responsavelId === usuarioId);
    const registros = registrosDoUsuario.flatMap(serializeGasto);

    if (!provider.responderComFuncoes) {
      throw createHttpError(503, "O provedor configurado nao suporta consultas por funcoes.");
    }

    const resposta = await provider.responderComFuncoes({
      question: pergunta,
      tools: financialTools,
      execute: async (name, argumentsJson) => {
        const args = parseArguments(argumentsJson);

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
    };
  }
}

export const iaService = new IaService();
