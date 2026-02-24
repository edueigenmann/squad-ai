import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export default function CreateProject() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      console.log("[CreateProject] Projeto criado com sucesso:", data);
      toast.success("Projeto criado com sucesso!");
      setLocation(`/project/${data.projectId}`);
    },
    onError: (error) => {
      console.error("[CreateProject] Erro ao criar projeto:", error);
      toast.error(error.message || "Erro ao criar projeto");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CreateProject] handleSubmit chamado");
    console.log("[CreateProject] Título:", title);
    console.log("[CreateProject] Descrição (tamanho):", featureRequest.length, "caracteres");
    
    if (!title.trim() || !featureRequest.trim()) {
      console.warn("[CreateProject] Campos vazios");
      toast.error("Preencha todos os campos");
      return;
    }
    
    if (featureRequest.length < 10) {
      console.warn("[CreateProject] Descrição muito curta");
      toast.error("A descrição deve ter pelo menos 10 caracteres");
      return;
    }
    
    console.log("[CreateProject] Chamando mutation...");
    createMutation.mutate({ title, featureRequest });
  };

  const exampleRequests = [
    {
      title: "Validador de CPF",
      request: `Implementar uma função chamada validar_cpf que verifica se um CPF é válido.

Requisitos:
- A função deve aceitar uma string como entrada
- O CPF pode estar formatado (com pontos e traço) ou não
- Um CPF válido deve ter exatamente 11 dígitos numéricos
- A função deve calcular os dois dígitos verificadores
- Deve retornar True se o CPF for válido, False caso contrário

Regras de Negócio:
- CPFs com todos os dígitos iguais (como 111.111.111-11) são inválidos
- O cálculo dos dígitos verificadores segue o algoritmo oficial

Tratamento de Erros:
- Se a entrada não for uma string, deve lançar TypeError
- Se não tiver 11 dígitos, retornar False`,
    },
    {
      title: "Calculadora de Fatorial",
      request: `Implementar uma função que calcula o fatorial de um número inteiro não-negativo.

Requisitos:
- A função deve aceitar um número inteiro n
- Deve retornar o fatorial de n (n!)
- Deve validar que n é não-negativo
- Deve lançar ValueError se n for negativo
- Deve tratar o caso especial: 0! = 1`,
    },
  ];

  const loadExample = (example: typeof exampleRequests[0]) => {
    setTitle(example.title);
    setFeatureRequest(example.request);
    toast.success("Exemplo carregado!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Sistema Multi-Agente de IA
            </div>
            <h1 className="text-4xl font-bold tracking-tight">AI Agent Builder</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transforme suas ideias em código funcional através de agentes de IA especializados que trabalham em
              sequência: Especificação → Testes → Desenvolvimento → Revisão
            </p>
          </div>

          {/* Main Form */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Criar Novo Projeto</CardTitle>
              <CardDescription>
                Descreva a funcionalidade que você deseja implementar. Quanto mais detalhes, melhor será o resultado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Projeto</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Validador de CPF"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={createMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featureRequest">Descrição da Funcionalidade</Label>
                  <Textarea
                    id="featureRequest"
                    placeholder={`Descreva em detalhes o que você quer implementar:

- Qual é a função/classe principal?
- Quais são os requisitos?
- Como deve tratar erros?
- Quais são os casos especiais?

Exemplo:
Implementar uma função que calcula o fatorial de um número...`}
                    value={featureRequest}
                    onChange={(e) => setFeatureRequest(e.target.value)}
                    disabled={createMutation.isPending}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 10 caracteres. Use markdown para formatação se desejar.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando projeto...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Código com IA
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Examples */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Exemplos Rápidos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {exampleRequests.map((example, idx) => (
                <Card key={idx} className="cursor-pointer hover:border-primary transition-colors" onClick={() => loadExample(example)}>
                  <CardHeader>
                    <CardTitle className="text-base">{example.title}</CardTitle>
                    <CardDescription className="line-clamp-3 text-xs">{example.request}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
