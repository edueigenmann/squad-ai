import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Circle, Download, Loader2, XCircle } from "lucide-react";
import { Streamdown } from "streamdown";

type TabValue = "specification" | "tests" | "implementation" | "review";

export default function ProjectExecution() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState<TabValue>("specification");

  const { data, isLoading, refetch } = trpc.projects.getById.useQuery(
    { projectId },
    { enabled: projectId > 0, refetchInterval: 2000 }
  );

  const executeMutation = trpc.projects.execute.useMutation({
    onSuccess: () => {
      toast.success("Execução concluída!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao executar projeto");
      refetch();
    },
  });

  const handleExecute = () => {
    executeMutation.mutate({ projectId });
  };

  const handleDownload = (type: string, content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} baixado!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Projeto não encontrado</CardTitle>
            <CardDescription>O projeto solicitado não existe.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { project, outputs } = data;
  const specOutput = outputs.find((o) => o.type === "specification");
  const testsOutput = outputs.find((o) => o.type === "tests");
  const implOutput = outputs.find((o) => o.type === "implementation");
  const reviewOutput = outputs.find((o) => o.type === "review");

  const availableTabs = useMemo<TabValue[]>(() => {
    const tabs: TabValue[] = [];
    if (specOutput) tabs.push("specification");
    if (testsOutput) tabs.push("tests");
    if (implOutput) tabs.push("implementation");
    if (reviewOutput) tabs.push("review");
    return tabs;
  }, [specOutput, testsOutput, implOutput, reviewOutput]);

  useEffect(() => {
    if (!availableTabs.length) return;
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  const statusConfig = {
    pending: { label: "Pendente", icon: Circle, color: "text-muted-foreground" },
    running: { label: "Executando", icon: Loader2, color: "text-primary animate-spin" },
    completed: { label: "Concluído", icon: CheckCircle2, color: "text-green-500" },
    failed: { label: "Falhou", icon: XCircle, color: "text-destructive" },
  };

  const currentStatus = statusConfig[project.status];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/history")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="text-sm text-muted-foreground">
                Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={project.status === "completed" ? "default" : "secondary"} className="gap-2">
              <currentStatus.icon className={`w-4 h-4 ${currentStatus.color}`} />
              {currentStatus.label}
            </Badge>
            {project.status === "pending" && (
              <Button onClick={handleExecute} disabled={executeMutation.isPending}>
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  "Iniciar Geração"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Status Progress */}
        {project.status === "running" && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">Execução em Andamento</CardTitle>
              <CardDescription>Os agentes estão trabalhando no seu projeto...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={66} className="h-2" />
              <div className="grid grid-cols-4 gap-4 text-center">
                {["Especificação", "Testes", "Desenvolvimento", "Revisão"].map((step, idx) => (
                  <div key={step} className="space-y-2">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                      idx <= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {idx <= 1 ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <p className="text-xs font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Request */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitação Original</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">{project.featureRequest}</pre>
          </CardContent>
        </Card>

        {/* Results Tabs */}
        {outputs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados Gerados</CardTitle>
              <CardDescription>
                {project.isApproved ? "✅ Código aprovado na revisão" : "⚠️ Código gerado mas não aprovado"} • {project.iterationCount} iteração(ões)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="specification" disabled={!specOutput}>
                    Especificação
                  </TabsTrigger>
                  <TabsTrigger value="tests" disabled={!testsOutput}>
                    Testes
                  </TabsTrigger>
                  <TabsTrigger value="implementation" disabled={!implOutput}>
                    Implementação
                  </TabsTrigger>
                  <TabsTrigger value="review" disabled={!reviewOutput}>
                    Revisão
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="specification" className="space-y-4">
                  {specOutput ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload("specification", specOutput.content, "especificacao.md")}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <Streamdown>{specOutput.content}</Streamdown>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ainda não disponível.</p>
                  )}
                </TabsContent>

                <TabsContent value="tests" className="space-y-4">
                  {testsOutput ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload("tests", testsOutput.content, "test_feature.py")}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm">{testsOutput.content}</code>
                      </pre>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ainda não disponível.</p>
                  )}
                </TabsContent>

                <TabsContent value="implementation" className="space-y-4">
                  {implOutput ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload("implementation", implOutput.content, "feature_module.py")}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code className="text-sm">{implOutput.content}</code>
                      </pre>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ainda não disponível.</p>
                  )}
                </TabsContent>

                <TabsContent value="review" className="space-y-4">
                  {reviewOutput ? (
                    <>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload("review", reviewOutput.content, "revisao.md")}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <Streamdown>{reviewOutput.content}</Streamdown>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ainda não disponível.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
