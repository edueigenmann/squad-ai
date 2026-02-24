import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("projects router", () => {
  describe("projects.create", () => {
    it("should create a new project with valid input", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.projects.create({
        title: "Test Project",
        featureRequest: "This is a test feature request with more than 10 characters",
      });

      expect(result).toHaveProperty("projectId");
      expect(typeof result.projectId).toBe("number");
      expect(result.projectId).toBeGreaterThan(0);
    });

    it("should reject empty title", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.projects.create({
          title: "",
          featureRequest: "Valid feature request",
        })
      ).rejects.toThrow();
    });

    it("should reject short feature request", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.projects.create({
          title: "Test",
          featureRequest: "Short",
        })
      ).rejects.toThrow();
    });
  });

  describe("projects.list", () => {
    it("should return array of projects for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a project first
      await caller.projects.create({
        title: "Test Project",
        featureRequest: "This is a test feature request",
      });

      const projects = await caller.projects.list();

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toHaveProperty("id");
      expect(projects[0]).toHaveProperty("title");
      expect(projects[0]).toHaveProperty("status");
    });
  });

  describe("projects.getById", () => {
    it("should return project with outputs", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a project
      const { projectId } = await caller.projects.create({
        title: "Test Project",
        featureRequest: "Test feature request for getById",
      });

      const result = await caller.projects.getById({ projectId });

      expect(result).toHaveProperty("project");
      expect(result).toHaveProperty("outputs");
      expect(result.project.id).toBe(projectId);
      expect(Array.isArray(result.outputs)).toBe(true);
    });

    it("should throw error for non-existent project", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.projects.getById({ projectId: 999999 })).rejects.toThrow("Projeto não encontrado");
    });
  });

  describe("database helpers", () => {
    it("should create and retrieve project", async () => {
      const projectId = await db.createProject({
        userId: 1,
        title: "DB Test Project",
        featureRequest: "Testing database operations",
      });

      expect(projectId).toBeGreaterThan(0);

      const project = await db.getProjectById(projectId);
      expect(project).toBeDefined();
      expect(project?.title).toBe("DB Test Project");
      expect(project?.status).toBe("pending");
    });

    it("should update project status", async () => {
      const projectId = await db.createProject({
        userId: 1,
        title: "Status Test",
        featureRequest: "Testing status updates",
      });

      await db.updateProjectStatus(projectId, "running");
      const project = await db.getProjectById(projectId);
      expect(project?.status).toBe("running");
    });

    it("should save and retrieve project outputs", async () => {
      const projectId = await db.createProject({
        userId: 1,
        title: "Output Test",
        featureRequest: "Testing outputs",
      });

      await db.saveProjectOutput({
        projectId,
        type: "specification",
        content: "Test specification content",
        version: 1,
      });

      const outputs = await db.getProjectOutputs(projectId);
      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs[0]?.type).toBe("specification");
      expect(outputs[0]?.content).toBe("Test specification content");
    });
  });
});
