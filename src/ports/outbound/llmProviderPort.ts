export type LlmRequest = {
  question: string;
  context: string;
};

export type LlmFunctionTool = {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict: true;
};

export type LlmFunctionRequest = {
  question: string;
  tools: LlmFunctionTool[];
  execute: (name: string, argumentsJson: string) => Promise<unknown>;
};

export interface LlmProviderPort {
  responder(request: LlmRequest): Promise<string>;
  responderComFuncoes?(request: LlmFunctionRequest): Promise<string>;
}
