# AI Agent Builder - TODO

## Backend - Database & Schema
- [x] Criar tabela `projects` com campos (id, userId, title, featureRequest, status, createdAt, updatedAt)
- [x] Criar tabela `project_outputs` com campos (id, projectId, type, content, createdAt)
- [x] Implementar helpers de banco de dados para CRUD de projetos
- [x] Implementar helpers para salvar outputs dos agentes

## Backend - Agentes de IA
- [x] Implementar Agente de Especificação (gera especificação funcional)
- [x] Implementar Agente de Testes (gera código de testes pytest)
- [x] Implementar Agente Desenvolvedor (implementa código que passa nos testes)
- [x] Implementar Agente Revisor (analisa código e fornece feedback)
- [x] Criar sistema de streaming de status em tempo real
- [x] Implementar ciclo de revisão (até 3 tentativas)

## Backend - API tRPC
- [x] Criar rota `projects.create` para criar novo projeto
- [x] Criar rota `projects.list` para listar projetos do usuário
- [x] Criar rota `projects.getById` para obter detalhes de um projeto
- [x] Criar rota `projects.execute` com streaming para executar agentes
- [x] Criar rota `projects.download` para baixar arquivos gerados

## Frontend - Interface de Entrada
- [x] Criar página principal com formulário de feature request
- [x] Implementar editor de texto multilinha com validação
- [x] Adicionar botão para iniciar geração
- [x] Implementar feedback visual de carregamento

## Frontend - Visualização em Tempo Real
- [x] Criar componente de status mostrando agente atual
- [x] Implementar barra de progresso de iterações
- [x] Criar área de logs em tempo real
- [x] Adicionar indicadores visuais para cada etapa (Spec → Tests → Dev → Review)

## Frontend - Painel de Resultados
- [x] Criar componente com abas para diferentes outputs
- [x] Aba de Especificação com markdown renderizado
- [x] Aba de Testes com syntax highlighting
- [x] Aba de Implementação com syntax highlighting
- [x] Aba de Revisão com feedback detalhado
- [x] Botões de download para cada arquivo

## Frontend - Histórico de Projetos
- [x] Criar página de histórico com listagem de projetos
- [x] Implementar cards de projeto com título, data e status
- [x] Adicionar filtros por status (concluído, em andamento, falhou)
- [x] Implementar visualização detalhada de projeto anterior
- [x] Adicionar opção de reutilizar feature request

## Sistema de Download
- [x] Implementar geração de arquivos .md para especificação
- [x] Implementar geração de arquivos .py para testes
- [x] Implementar geração de arquivos .py para implementação
- [x] Implementar geração de arquivos .md para revisão
- [ ] Adicionar botão de download em lote (ZIP)

## Design & UX
- [x] Definir paleta de cores (tema tech/developer)
- [x] Escolher tipografia adequada (monospace para código)
- [x] Criar layout responsivo
- [x] Adicionar animações de transição entre estados
- [x] Implementar estados vazios (sem projetos, sem resultados)

## Testes & Deploy
- [x] Testar fluxo completo de geração
- [x] Testar sistema de streaming
- [x] Testar downloads de arquivos
- [x] Validar persistência no banco de dados
- [x] Criar checkpoint final
