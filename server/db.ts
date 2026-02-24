import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, projects, projectOutputs, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PROJECT QUERIES
// ============================================================================

export async function createProject(data: {
  userId: number;
  title: string;
  featureRequest: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  return result[0].insertId;
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0];
}

export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function updateProjectStatus(projectId: number, status: "pending" | "running" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({ status, updatedAt: new Date() }).where(eq(projects.id, projectId));
}

export async function updateProjectCompletion(projectId: number, data: {
  status: "completed" | "failed";
  iterationCount: number;
  isApproved: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({
    status: data.status,
    iterationCount: data.iterationCount,
    isApproved: data.isApproved ? 1 : 0,
    updatedAt: new Date(),
  }).where(eq(projects.id, projectId));
}

// ============================================================================
// PROJECT OUTPUT QUERIES
// ============================================================================

export async function saveProjectOutput(data: {
  projectId: number;
  type: "specification" | "tests" | "implementation" | "review";
  content: string;
  version: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(projectOutputs).values(data);
}

export async function getProjectOutputs(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projectOutputs).where(eq(projectOutputs.projectId, projectId)).orderBy(desc(projectOutputs.createdAt));
}

export async function getLatestProjectOutputs(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get the latest version for each type
  const outputs = await db.select().from(projectOutputs).where(eq(projectOutputs.projectId, projectId));
  
  const latestByType: Record<string, typeof outputs[0]> = {};
  
  for (const output of outputs) {
    const existing = latestByType[output.type];
    if (!existing || output.version > existing.version) {
      latestByType[output.type] = output;
    }
  }
  
  return Object.values(latestByType);
}
