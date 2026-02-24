import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createProject,
  getProjectById,
  getProjectsByUserId,
  updateProjectStatus,
  updateProjectCompletion,
  saveProjectOutput,
  getLatestProjectOutputs,
} from "./db";
import { executeAgents } from "./agents";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  projects: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "Título é obrigatório"),
        featureRequest: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const projectId = await createProject({
          userId: ctx.user.id,
          title: input.title,
          featureRequest: input.featureRequest,
        });
        return { projectId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getProjectsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
        
        const outputs = await getLatestProjectOutputs(input.projectId);
        return { project, outputs };
      }),

    execute: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const project = await getProjectById(input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });

        // Update status to running
        await updateProjectStatus(input.projectId, "running");

        try {
          // Execute agents
          const result = await executeAgents(project.featureRequest);

          // Save outputs
          await saveProjectOutput({
            projectId: input.projectId,
            type: "specification",
            content: result.specification,
            version: 1,
          });
          await saveProjectOutput({
            projectId: input.projectId,
            type: "tests",
            content: result.tests,
            version: 1,
          });
          await saveProjectOutput({
            projectId: input.projectId,
            type: "implementation",
            content: result.implementation,
            version: result.iterationCount,
          });
          await saveProjectOutput({
            projectId: input.projectId,
            type: "review",
            content: result.review,
            version: result.iterationCount,
          });

          // Update project completion
          await updateProjectCompletion(input.projectId, {
            status: "completed",
            iterationCount: result.iterationCount,
            isApproved: result.isApproved,
          });

          return { success: true, result };
        } catch (error) {
          await updateProjectStatus(input.projectId, "failed");
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Erro ao executar agentes",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
