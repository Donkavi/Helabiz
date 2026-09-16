import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";
import mongoose from "mongoose";

/**
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * connection pool on every reload. The connection promise is cached on the
 * global object so exactly one pool exists per process.
 */
declare global {
  var __helabizMongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
  var __helabizMemoryUri: Promise<string> | undefined;
  var __helabizMemoryServer: { stop: () => Promise<boolean> } | undefined;
}

const cached = global.__helabizMongoose ?? { conn: null, promise: null };
global.__helabizMongoose = cached;

/**
 * The embedded database lives in the OS temp directory, keyed by project path,
 * rather than inside the repo: the bundler's file tracer walks the project and
 * chokes on WiredTiger's lock files. Data still survives restarts.
 * `npm run db:reset` deletes it.
 */
export const DEV_DATA_DIR = path.join(
  os.tmpdir(),
  `helabiz-db-${crypto.createHash("sha1").update(process.cwd()).digest("hex").slice(0, 10)}`,
);
const URI_FILE = path.join(DEV_DATA_DIR, "mongo-uri");

async function canConnect(uri: string) {
  try {
    const probe = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 1500 }).asPromise();
    await probe.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Development convenience: with no MONGODB_URI configured, start an embedded
 * MongoDB, so `npm run dev` works with no setup and seeded demo data survives
 * restarts.
 *
 * Only one process can hold the data directory, so the running instance
 * advertises its URI in a `mongo-uri` file beside it. A second process (usually
 * `npm run seed` alongside `npm run dev`) reuses that instead of failing on the
 * lock. Production always requires a real connection string.
 */
async function developmentFallbackUri(): Promise<string> {
  global.__helabizMemoryUri ??= (async () => {
    fs.mkdirSync(DEV_DATA_DIR, { recursive: true });

    if (fs.existsSync(URI_FILE)) {
      const existing = fs.readFileSync(URI_FILE, "utf8").trim();
      if (existing && (await canConnect(existing))) {
        console.info("[helabiz] Reusing the embedded MongoDB already running for this project.");
        return existing;
      }
      fs.rmSync(URI_FILE, { force: true }); // stale: the owning process is gone
    }

    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create({
      instance: { dbPath: DEV_DATA_DIR, storageEngine: "wiredTiger", dbName: "helabiz" },
    });

    const uri = server.getUri("helabiz");
    global.__helabizMemoryServer = server;
    fs.writeFileSync(URI_FILE, uri);

    const cleanup = () => {
      try {
        fs.rmSync(URI_FILE, { force: true });
      } catch {
        /* the file may already be gone */
      }
    };
    process.once("exit", cleanup);
    process.once("SIGINT", () => {
      cleanup();
      process.exit(0);
    });

    console.info("[helabiz] MONGODB_URI is not set — started an embedded MongoDB for development.");
    return uri;
  })();

  return global.__helabizMemoryUri;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      let uri = process.env.MONGODB_URI;

      if (!uri) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("MONGODB_URI is not set. Point it at your MongoDB instance before deploying.");
        }
        uri = await developmentFallbackUri();
      }

      mongoose.set("strictQuery", true);
      return mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB || "helabiz",
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      });
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}

/**
 * Closes the connection and, if this process owns the embedded MongoDB, shuts
 * it down cleanly. Scripts must call this instead of `process.exit()`: killing
 * mongod abruptly loses writes it has not yet checkpointed to disk.
 */
export async function shutdownDB() {
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;

  const server = global.__helabizMemoryServer;
  if (server) {
    await server.stop();
    global.__helabizMemoryServer = undefined;
    global.__helabizMemoryUri = undefined;
    try {
      fs.rmSync(URI_FILE, { force: true });
    } catch {
      /* already gone */
    }
  }
}

/** Converts Mongoose documents to plain JSON safe to pass to Client Components. */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
