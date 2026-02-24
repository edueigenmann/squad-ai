-- ============================================
-- AI Agent Builder - Database Setup Script
-- ============================================
-- Este script cria todas as tabelas necessárias para o AI Agent Builder
-- Execute este script no seu banco de dados MySQL/TiDB

-- ============================================
-- 1. Tabela de Usuários
-- ============================================
-- Armazena informações dos usuários autenticados via Manus OAuth

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE,
  `name` TEXT,
  `email` VARCHAR(320),
  `loginMethod` VARCHAR(64),
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openId` (`openId`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Tabela de Projetos
-- ============================================
-- Armazena os projetos de geração de código criados pelos usuários

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `featureRequest` TEXT NOT NULL,
  `status` ENUM('pending', 'running', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `isApproved` TINYINT(1) NOT NULL DEFAULT 0,
  `iterationCount` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdAt` (`createdAt` DESC),
  CONSTRAINT `fk_projects_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Tabela de Outputs dos Projetos
-- ============================================
-- Armazena os outputs gerados pelos agentes de IA para cada projeto

CREATE TABLE IF NOT EXISTS `project_outputs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `type` ENUM('specification', 'tests', 'implementation', 'review') NOT NULL,
  `content` LONGTEXT NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_projectId` (`projectId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_version` (`version`),
  INDEX `idx_projectId_type` (`projectId`, `type`),
  CONSTRAINT `fk_outputs_projectId` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Informações sobre as Tabelas
-- ============================================

-- TABELA: users
-- Descrição: Gerencia autenticação e perfis de usuários
-- Campos principais:
--   - openId: Identificador único do Manus OAuth
--   - role: Define permissões (user ou admin)
--   - lastSignedIn: Rastreia último acesso

-- TABELA: projects
-- Descrição: Armazena projetos de geração de código
-- Campos principais:
--   - featureRequest: Descrição da funcionalidade solicitada pelo usuário
--   - status: Estado atual (pending, running, completed, failed)
--   - isApproved: Indica se o código passou na revisão final
--   - iterationCount: Número de iterações de revisão executadas

-- TABELA: project_outputs
-- Descrição: Armazena outputs gerados pelos 4 agentes
-- Tipos de output:
--   - specification: Especificação funcional gerada pelo Agente de Especificação
--   - tests: Código de testes pytest gerado pelo Agente de Testes
--   - implementation: Código Python gerado pelo Agente Desenvolvedor
--   - review: Feedback e análise gerado pelo Agente Revisor
-- Campo version: Rastreia iterações quando há múltiplas tentativas

-- ============================================
-- Verificação das Tabelas
-- ============================================

-- Para verificar se as tabelas foram criadas corretamente:
SHOW TABLES;

-- Para ver a estrutura de cada tabela:
DESCRIBE users;
DESCRIBE projects;
DESCRIBE project_outputs;

-- Para verificar os índices:
SHOW INDEX FROM users;
SHOW INDEX FROM projects;
SHOW INDEX FROM project_outputs;

-- ============================================
-- Queries Úteis para Administração
-- ============================================

-- Ver todos os projetos com informações do usuário:
-- SELECT p.*, u.name as userName, u.email 
-- FROM projects p 
-- JOIN users u ON p.userId = u.id 
-- ORDER BY p.createdAt DESC;

-- Ver outputs de um projeto específico:
-- SELECT * FROM project_outputs 
-- WHERE projectId = 1 
-- ORDER BY type, version;

-- Estatísticas gerais:
-- SELECT 
--   COUNT(*) as total_projects,
--   SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
--   SUM(CASE WHEN isApproved = 1 THEN 1 ELSE 0 END) as approved,
--   AVG(iterationCount) as avg_iterations
-- FROM projects;

-- ============================================
-- Limpeza (USE COM CUIDADO!)
-- ============================================

-- Para remover todas as tabelas (CUIDADO: isso apaga todos os dados):
-- DROP TABLE IF EXISTS project_outputs;
-- DROP TABLE IF EXISTS projects;
-- DROP TABLE IF EXISTS users;
