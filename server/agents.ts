/**
 * AI Agents Module
 * Implements the 4 specialized agents for code generation:
 * 1. Specification Agent
 * 2. Testing Agent
 * 3. Developer Agent
 * 4. Reviewer Agent
 */

import { invokeLLM } from "./_core/llm";

export type AgentStatus = {
  currentAgent: "specification" | "testing" | "development" | "review" | "idle";
  iteration: number;
  maxIterations: number;
  message: string;
  progress: number; // 0-100
};

export type AgentResult = {
  specification: string;
  tests: string;
  implementation: string;
  review: string;
  isApproved: boolean;
  iterationCount: number;
};

type StatusCallback = (status: AgentStatus) => void;

/**
 * Specification Agent
 * Creates detailed functional specifications from feature requests
 */
async function specificationAgent(featureRequest: string, onStatus?: StatusCallback): Promise<string> {
  onStatus?.({
    currentAgent: "specification",
    iteration: 0,
    maxIterations: 1,
    message: "Criando especificação funcional detalhada...",
    progress: 10,
  });

  const prompt = `Você é um Analista de Requisitos Sênior experiente.

Solicitação do usuário:
${featureRequest}

Crie uma especificação funcional COMPLETA e DETALHADA que inclua:

1. **Título da Feature**
2. **Descrição Geral**
3. **User Stories** (formato: Como [usuário], eu quero [objetivo] para que [benefício])
4. **Critérios de Aceitação** (formato Dado-Quando-Então)
5. **Regras de Negócio**
6. **Casos Extremos**
7. **Estrutura de Dados** (entrada e saída)

A especificação deve ser clara o suficiente para que um desenvolvedor possa implementar
sem ambiguidades e um testador possa criar testes completos.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um especialista em análise de requisitos e especificações funcionais." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const specification = typeof content === "string" ? content : "";

  onStatus?.({
    currentAgent: "specification",
    iteration: 0,
    maxIterations: 1,
    message: "Especificação criada com sucesso!",
    progress: 25,
  });

  return specification;
}

/**
 * Testing Agent
 * Creates automated tests based on the specification
 */
async function testingAgent(specification: string, onStatus?: StatusCallback): Promise<string> {
  onStatus?.({
    currentAgent: "testing",
    iteration: 0,
    maxIterations: 1,
    message: "Gerando testes automatizados...",
    progress: 30,
  });

  const prompt = `Você é um Engenheiro de QA Especialista em Automação e TDD.

Especificação Funcional:
${specification}

Crie um arquivo de teste COMPLETO em Python usando pytest que:
1. Teste CADA critério de aceitação da especificação
2. Inclua testes para casos de sucesso, erro e extremos
3. Use nomenclatura descritiva (test_<funcionalidade>_<cenário>)
4. Adicione docstrings explicando o que cada teste valida
5. Organize os testes em classes se apropriado

IMPORTANTE: 
- Assuma que o módulo a ser testado se chama "feature_module"
- Assuma que a função/classe principal se chama "feature_function" ou "FeatureClass"
- Os testes devem FALHAR inicialmente (TDD - Red phase)
- Retorne APENAS o código Python do arquivo de teste, sem explicações adicionais`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um especialista em testes automatizados e TDD." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  let testsCode = typeof content === "string" ? content : "";

  // Remove markdown code blocks if present
  if (testsCode.startsWith("```python")) {
    testsCode = testsCode.split("```python")[1]?.split("```")[0]?.trim() || testsCode;
  } else if (testsCode.startsWith("```")) {
    testsCode = testsCode.split("```")[1]?.split("```")[0]?.trim() || testsCode;
  }

  onStatus?.({
    currentAgent: "testing",
    iteration: 0,
    maxIterations: 1,
    message: "Testes criados com sucesso!",
    progress: 50,
  });

  return testsCode;
}

/**
 * Developer Agent
 * Implements code that passes the tests
 */
async function developerAgent(
  specification: string,
  testsCode: string,
  iteration: number,
  feedback?: string,
  onStatus?: StatusCallback
): Promise<string> {
  onStatus?.({
    currentAgent: "development",
    iteration,
    maxIterations: 3,
    message: `Implementando código (Tentativa ${iteration + 1}/3)...`,
    progress: 55 + iteration * 10,
  });

  const feedbackSection = feedback
    ? `
FEEDBACK DA REVISÃO ANTERIOR:
${feedback}

IMPORTANTE: Corrija os problemas apontados na revisão anterior!
`
    : "";

  const prompt = `Você é um Engenheiro de Software Pleno experiente.

Especificação Funcional:
${specification}

Testes que devem passar:
\`\`\`python
${testsCode}
\`\`\`

${feedbackSection}

Implemente o código Python COMPLETO que:
1. Faça TODOS os testes passarem
2. Siga boas práticas (SOLID, código limpo)
3. Inclua docstrings completas
4. Use type hints
5. Trate todos os casos de erro identificados nos testes

IMPORTANTE:
- Retorne APENAS o código Python do módulo de implementação
- Não inclua os testes no código de implementação
- O código deve ser production-ready
- Retorne sem explicações adicionais, apenas o código`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um desenvolvedor Python experiente focado em qualidade." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  let implementationCode = typeof content === "string" ? content : "";

  // Remove markdown code blocks if present
  if (implementationCode.startsWith("```python")) {
    implementationCode = implementationCode.split("```python")[1]?.split("```")[0]?.trim() || implementationCode;
  } else if (implementationCode.startsWith("```")) {
    implementationCode = implementationCode.split("```")[1]?.split("```")[0]?.trim() || implementationCode;
  }

  onStatus?.({
    currentAgent: "development",
    iteration,
    maxIterations: 3,
    message: `Código implementado (Tentativa ${iteration + 1}/3)`,
    progress: 60 + iteration * 10,
  });

  return implementationCode;
}

/**
 * Reviewer Agent
 * Analyzes code and provides feedback
 */
async function reviewerAgent(
  specification: string,
  testsCode: string,
  implementationCode: string,
  iteration: number,
  onStatus?: StatusCallback
): Promise<{ feedback: string; isApproved: boolean }> {
  onStatus?.({
    currentAgent: "review",
    iteration,
    maxIterations: 3,
    message: "Analisando código e executando revisão...",
    progress: 75 + iteration * 5,
  });

  const prompt = `Você é um Engenheiro de Qualidade Sênior extremamente detalhista.

Especificação Funcional:
${specification}

Código Implementado:
\`\`\`python
${implementationCode}
\`\`\`

Testes:
\`\`\`python
${testsCode}
\`\`\`

Sua tarefa é fazer uma revisão CRÍTICA e COMPLETA do código. Analise:

1. **Conformidade com a Especificação:** O código implementa todos os requisitos?
2. **Qualidade do Código:** O código segue boas práticas? Está bem documentado?
3. **Casos Extremos:** Todos os casos extremos são tratados?
4. **Completude:** O código parece completo e production-ready?

Forneça sua análise no seguinte formato:

**DECISÃO:** [APROVADO ou REPROVADO]

**JUSTIFICATIVA:**
[Explique sua decisão de forma clara e objetiva]

**PROBLEMAS ENCONTRADOS:** (se REPROVADO)
1. [Problema específico e acionável]
2. [Outro problema]

**FEEDBACK PARA O DESENVOLVEDOR:** (se REPROVADO)
[Instruções claras e específicas sobre o que precisa ser corrigido]

Seja rigoroso mas construtivo. Seu feedback deve permitir que o desenvolvedor
corrija os problemas na próxima iteração.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Você é um revisor de código rigoroso e construtivo." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  const reviewFeedback = typeof content === "string" ? content : "";

  // Determine if approved
  const isApproved =
    reviewFeedback.includes("DECISÃO:** APROVADO") ||
    reviewFeedback.includes("DECISÃO: APROVADO") ||
    reviewFeedback.includes("**APROVADO**");

  onStatus?.({
    currentAgent: "review",
    iteration,
    maxIterations: 3,
    message: isApproved ? "✅ Código aprovado!" : "❌ Código reprovado - Feedback gerado",
    progress: 80 + iteration * 5,
  });

  return {
    feedback: reviewFeedback,
    isApproved,
  };
}

/**
 * Main execution function that orchestrates all agents
 */
export async function executeAgents(featureRequest: string, onStatus?: StatusCallback): Promise<AgentResult> {
  const maxIterations = 3;
  let specification = "";
  let testsCode = "";
  let implementationCode = "";
  let reviewFeedback = "";
  let isApproved = false;
  let iterationCount = 0;

  try {
    // Step 1: Specification
    specification = await specificationAgent(featureRequest, onStatus);

    // Step 2: Testing
    testsCode = await testingAgent(specification, onStatus);

    // Step 3: Development + Review Loop
    for (let i = 0; i < maxIterations; i++) {
      iterationCount = i + 1;

      // Development
      implementationCode = await developerAgent(
        specification,
        testsCode,
        i,
        i > 0 ? reviewFeedback : undefined,
        onStatus
      );

      // Review
      const review = await reviewerAgent(specification, testsCode, implementationCode, i, onStatus);
      reviewFeedback = review.feedback;
      isApproved = review.isApproved;

      if (isApproved) {
        onStatus?.({
          currentAgent: "idle",
          iteration: i,
          maxIterations,
          message: "✅ Código aprovado! Processo concluído com sucesso.",
          progress: 100,
        });
        break;
      }

      if (i === maxIterations - 1) {
        onStatus?.({
          currentAgent: "idle",
          iteration: i,
          maxIterations,
          message: `⚠️ Limite de ${maxIterations} tentativas atingido. Processo finalizado.`,
          progress: 100,
        });
      }
    }

    return {
      specification,
      tests: testsCode,
      implementation: implementationCode,
      review: reviewFeedback,
      isApproved,
      iterationCount,
    };
  } catch (error) {
    onStatus?.({
      currentAgent: "idle",
      iteration: iterationCount,
      maxIterations,
      message: `❌ Erro durante execução: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      progress: 0,
    });

    throw error;
  }
}
