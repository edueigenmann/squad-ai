/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export * from "./_core/errors";

export type UserRole = "user" | "admin";
export type ProjectStatus = "pending" | "running" | "completed" | "failed";
export type ProjectOutputType = "specification" | "tests" | "implementation" | "review";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: UserRole;
  lastSignedIn?: Date;
};

export type Project = {
  id: number;
  userId: number;
  title: string;
  featureRequest: string;
  status: ProjectStatus;
  iterationCount: number;
  isApproved: number;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertProject = {
  userId: number;
  title: string;
  featureRequest: string;
};

export type ProjectOutput = {
  id: number;
  projectId: number;
  type: ProjectOutputType;
  content: string;
  version: number;
  createdAt: Date;
};

export type InsertProjectOutput = {
  projectId: number;
  type: ProjectOutputType;
  content: string;
  version: number;
};
