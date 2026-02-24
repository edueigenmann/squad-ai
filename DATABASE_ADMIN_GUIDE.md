# Guia de Administração do Banco de Dados - AI Agent Builder

## 📋 Visão Geral

O AI Agent Builder utiliza um banco de dados MySQL/TiDB com 3 tabelas principais:

1. **users** - Gerenciamento de usuários e autenticação
2. **projects** - Projetos de geração de código
3. **project_outputs** - Outputs gerados pelos agentes de IA

---

## 🚀 Instalação Manual do Banco de Dados

### Opção 1: Usando o Script SQL Fornecido

```bash
# Se você tem acesso ao MySQL CLI
mysql -u seu_usuario -p seu_banco < database_setup.sql

# Ou via TiDB Cloud Console
# Copie e cole o conteúdo de database_setup.sql no SQL Editor
```

### Opção 2: Executar Comandos Individualmente

Conecte-se ao seu banco e execute os comandos do arquivo `database_setup.sql` um por um.

---

## 🔑 Informações de Conexão

O projeto usa a variável de ambiente `DATABASE_URL` para conectar ao banco:

```env
DATABASE_URL=mysql://usuario:senha@host:porta/nome_banco
```

**Exemplo para TiDB Cloud:**
```env
DATABASE_URL=mysql://usuario.root:senha@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/ai_agent_builder?ssl={"rejectUnauthorized":true}
```

**Exemplo para MySQL Local:**
```env
DATABASE_URL=mysql://root:senha@localhost:3306/ai_agent_builder
```

---

## 📊 Estrutura das Tabelas

### Tabela: `users`

Armazena informações dos usuários autenticados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK) | ID único do usuário |
| openId | VARCHAR(64) | ID do Manus OAuth (único) |
| name | TEXT | Nome do usuário |
| email | VARCHAR(320) | Email do usuário |
| loginMethod | VARCHAR(64) | Método de login usado |
| role | ENUM | Papel do usuário (user, admin) |
| createdAt | TIMESTAMP | Data de criação |
| updatedAt | TIMESTAMP | Data de atualização |
| lastSignedIn | TIMESTAMP | Último login |

### Tabela: `projects`

Armazena os projetos de geração de código.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK) | ID único do projeto |
| userId | INT (FK) | ID do usuário criador |
| title | VARCHAR(255) | Título do projeto |
| featureRequest | TEXT | Descrição da funcionalidade |
| status | ENUM | Status (pending, running, completed, failed) |
| isApproved | TINYINT(1) | Se foi aprovado na revisão |
| iterationCount | INT | Número de iterações executadas |
| createdAt | TIMESTAMP | Data de criação |
| updatedAt | TIMESTAMP | Data de atualização |

### Tabela: `project_outputs`

Armazena os outputs gerados pelos 4 agentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK) | ID único do output |
| projectId | INT (FK) | ID do projeto |
| type | ENUM | Tipo (specification, tests, implementation, review) |
| content | LONGTEXT | Conteúdo gerado pelo agente |
| version | INT | Versão/iteração do output |
| createdAt | TIMESTAMP | Data de criação |

---

## 🔍 Queries Úteis para Administração

### Monitoramento Geral

```sql
-- Ver estatísticas gerais do sistema
SELECT 
  COUNT(*) as total_projetos,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as concluidos,
  SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as em_execucao,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as falhas,
  SUM(CASE WHEN isApproved = 1 THEN 1 ELSE 0 END) as aprovados,
  ROUND(AVG(iterationCount), 2) as media_iteracoes
FROM projects;
```

### Listar Projetos Recentes

```sql
-- Ver últimos 10 projetos com informações do usuário
SELECT 
  p.id,
  p.title,
  p.status,
  p.isApproved,
  p.iterationCount,
  u.name as usuario,
  u.email,
  p.createdAt
FROM projects p
JOIN users u ON p.userId = u.id
ORDER BY p.createdAt DESC
LIMIT 10;
```

### Ver Outputs de um Projeto

```sql
-- Ver todos os outputs de um projeto específico
SELECT 
  type,
  version,
  LENGTH(content) as tamanho_bytes,
  createdAt
FROM project_outputs
WHERE projectId = 1
ORDER BY type, version;
```

### Encontrar Projetos com Problemas

```sql
-- Projetos que falharam
SELECT p.*, u.email
FROM projects p
JOIN users u ON p.userId = u.id
WHERE p.status = 'failed'
ORDER BY p.updatedAt DESC;

-- Projetos que não foram aprovados após 3 iterações
SELECT p.*, u.email
FROM projects p
JOIN users u ON p.userId = u.id
WHERE p.status = 'completed' 
  AND p.isApproved = 0 
  AND p.iterationCount >= 3;
```

### Análise de Usuários

```sql
-- Usuários mais ativos
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(p.id) as total_projetos,
  SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as concluidos
FROM users u
LEFT JOIN projects p ON u.id = p.userId
GROUP BY u.id
ORDER BY total_projetos DESC;
```

---

## 🛠️ Manutenção do Banco

### Backup

```bash
# Backup completo
mysqldump -u usuario -p nome_banco > backup_$(date +%Y%m%d).sql

# Backup apenas da estrutura (sem dados)
mysqldump -u usuario -p --no-data nome_banco > schema_backup.sql

# Backup apenas dos dados
mysqldump -u usuario -p --no-create-info nome_banco > data_backup.sql
```

### Restauração

```bash
# Restaurar backup
mysql -u usuario -p nome_banco < backup_20260216.sql
```

### Limpeza de Dados Antigos

```sql
-- CUIDADO: Isso remove dados permanentemente!

-- Remover projetos antigos (mais de 6 meses)
DELETE FROM projects 
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- Remover outputs órfãos (sem projeto associado)
DELETE FROM project_outputs 
WHERE projectId NOT IN (SELECT id FROM projects);
```

### Otimização

```sql
-- Analisar tabelas para otimização
ANALYZE TABLE users, projects, project_outputs;

-- Otimizar tabelas (desfragmentação)
OPTIMIZE TABLE users, projects, project_outputs;

-- Ver tamanho das tabelas
SELECT 
  table_name AS 'Tabela',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Tamanho (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'ai_agent_builder'
ORDER BY (data_length + index_length) DESC;
```

---

## 🔐 Segurança

### Criar Usuário Somente Leitura

```sql
-- Criar usuário para consultas (sem permissão de modificação)
CREATE USER 'readonly'@'%' IDENTIFIED BY 'senha_segura';
GRANT SELECT ON ai_agent_builder.* TO 'readonly'@'%';
FLUSH PRIVILEGES;
```

### Criar Usuário Administrativo

```sql
-- Criar usuário com permissões completas
CREATE USER 'admin_app'@'%' IDENTIFIED BY 'senha_muito_segura';
GRANT ALL PRIVILEGES ON ai_agent_builder.* TO 'admin_app'@'%';
FLUSH PRIVILEGES;
```

---

## 📈 Monitoramento de Performance

### Queries Lentas

```sql
-- Verificar queries lentas (MySQL)
SELECT * FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;
```

### Índices Não Utilizados

```sql
-- Ver estatísticas de uso de índices
SELECT 
  table_name,
  index_name,
  cardinality
FROM information_schema.statistics
WHERE table_schema = 'ai_agent_builder'
ORDER BY table_name, index_name;
```

---

## ⚠️ Troubleshooting

### Problema: Conexão Recusada

**Solução:**
1. Verifique se o banco está rodando
2. Confirme o `DATABASE_URL` no arquivo `.env`
3. Verifique firewall e permissões de rede

### Problema: Tabelas Não Existem

**Solução:**
```bash
# Execute o script de setup
mysql -u usuario -p nome_banco < database_setup.sql

# Ou use o Drizzle
cd /home/ubuntu/ai-agent-builder
pnpm db:push
```

### Problema: Dados Corrompidos

**Solução:**
```sql
-- Verificar integridade
CHECK TABLE users, projects, project_outputs;

-- Reparar se necessário
REPAIR TABLE users, projects, project_outputs;
```

---

## 📞 Informações Adicionais

- **ORM Usado:** Drizzle ORM
- **Migrações:** Gerenciadas pelo Drizzle Kit
- **Schema Source:** `/home/ubuntu/ai-agent-builder/drizzle/schema.ts`

Para mais informações sobre o Drizzle ORM: https://orm.drizzle.team/
