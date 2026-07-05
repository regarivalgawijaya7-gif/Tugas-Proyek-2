import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.join(__dirname, "../../data/database.json");
const defaultPasswordHash = crypto.createHash("sha256").update("password123").digest("hex");
const adminPasswordHash = crypto.createHash("sha256").update("ZEE241112979").digest("hex");
const fixedAdminAccount = {
  id: "USR001",
  name: "ZEE",
  username: "ZEE",
  email: "ZEE@gmail.com",
  role: "admin",
  passwordHash: adminPasswordHash
};

function normalizeDatabaseShape(database) {
  let changed = false;

  if (!Array.isArray(database.users)) {
    database.users = [];
    changed = true;
  }

  if (!Array.isArray(database.sessions)) {
    database.sessions = [];
    changed = true;
  }

  if (!Array.isArray(database.events)) {
    database.events = [];
    changed = true;
  }

  if (!Array.isArray(database.tickets)) {
    database.tickets = [];
    changed = true;
  }

  const withoutLegacyDemoCustomer = database.users.filter(user => user.id !== "USR002");
  if (withoutLegacyDemoCustomer.length !== database.users.length) {
    database.users = withoutLegacyDemoCustomer;
    changed = true;
  }

  database.users = database.users.map(user => {
    if (user.id === fixedAdminAccount.id) {
      const normalizedAdmin = {
        ...user,
        ...fixedAdminAccount
      };

      if (JSON.stringify(normalizedAdmin) !== JSON.stringify(user)) {
        changed = true;
      }

      return normalizedAdmin;
    }

    if (user.role === "admin") {
      changed = true;
      return {
        ...user,
        role: "customer"
      };
    }

    const normalizedUsername = user.role === "customer"
      ? String(user.username || user.name || "").toLowerCase()
      : user.username || user.name;

    if (user.passwordHash && user.username === normalizedUsername) return user;

    changed = true;
    return {
      ...user,
      username: normalizedUsername,
      passwordHash: user.passwordHash || defaultPasswordHash
    };
  });

  return { database, changed };
}

export async function readDatabase() {
  const rawData = await readFile(databasePath, "utf8");
  const parsedData = JSON.parse(rawData);
  const { database, changed } = normalizeDatabaseShape(parsedData);

  if (changed) {
    await writeDatabase(database);
  }

  return database;
}

export async function writeDatabase(data) {
  const jsonData = JSON.stringify(data, null, 2);
  await writeFile(databasePath, jsonData);
}

export function createId(prefix, collection) {
  const nextNumber = collection.length + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}
