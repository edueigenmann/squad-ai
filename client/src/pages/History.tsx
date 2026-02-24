import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileCode, Clock, CheckCircle2, XCircle, Circle } from "lucide-react";

export default function History() {
  const [, setLocation] = useLocation();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const statusConfig = {
    pending: { label: "Pendente", icon: Circle, variant: "secondary" as const, color: "text-muted-foreground" },
    running: { label: "Executando", icon: Loader2, variant: "default" as const, color: "text-primary" },
    completed: { label: "Concluído", icon: CheckCircle2, variant: "default" as const, color: "text-green-500" },
    failed: { label: "Falhou", icon: XCircle, variant: "destructive" as const, color: "text-destructive" },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Meus Projetos</h1>
            <p className="text-muted-foreground mt-2">Histórico de projetos gerados pelos agentes de IA</p>
          </div>
          <Button onClick={() => setLocation("/")} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Projects Grid */}
        {!projects || projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <FileCode className="w-16 h-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Nenhum projeto ainda</h3>
                <p className="text-muted-foreground">Crie seu primeiro projeto para começar a gerar código com IA</p>
              </div>
              <Button onClick={() => setLocation("/")} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Projeto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const status = statusConfig[project.status];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                  onClick={() => setLocation(`/project/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                      <Badge variant={status.variant} className="shrink-0 gap-1.5">
                        <StatusIcon className={`w-3 h-3 ${status.color} ${project.status === "running" ? "animate-spin" : ""}`} />
                        {status.label}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{project.featureRequest}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {new Date(project.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    {project.status === "completed" && (
                      <div className="flex items-center gap-2 text-sm">
                        {project.isApproved ? (
                          <Badge variant="default" className="gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Aprovado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1.5">
                            Não aprovado
                          </Badge>
                        )}
                        <span className="text-muted-foreground">{project.iterationCount} iteração(ões)</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {projects && projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Projetos</CardDescription>
                <CardTitle className="text-3xl">{projects.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Concluídos</CardDescription>
                <CardTitle className="text-3xl text-green-500">
                  {projects.filter((p) => p.status === "completed").length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Aprovados</CardDescription>
                <CardTitle className="text-3xl text-primary">
                  {projects.filter((p) => p.isApproved === 1).length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Taxa de Aprovação</CardDescription>
                <CardTitle className="text-3xl">
                  {projects.filter((p) => p.status === "completed").length > 0
                    ? Math.round(
                        (projects.filter((p) => p.isApproved === 1).length /
                          projects.filter((p) => p.status === "completed").length) *
                          100
                      )
                    : 0}
                  %
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
