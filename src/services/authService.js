import crypto from "crypto";
import { createId, readDatabase, writeDatabase } from "./databaseService.js";

const sessionDurationMs = 1000 * 60 * 60 * 24;

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

export function getPublicUser(user) {
  if (!user) return null;

  const rawUsername = user.username || user.name || "";
  const displayUsername = user.role === "admin"
    ? rawUsername
    : String(rawUsername).toLowerCase();

  return {
    id: user.id,
    name: displayUsername,
    username: displayUsername,
    email: user.email,
    role: user.role
  };
}

export function getTokenFromRequest(request, url) {
  const authorization = request.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  const queryToken = url?.searchParams?.get("token");
  if (queryToken) return queryToken;

  const cookie = request.headers.cookie || "";
  const tokenMatch = cookie.match(/(?:^|;\s*)smartix_token=([^;]+)/);
  return tokenMatch ? decodeURIComponent(tokenMatch[1]) : "";
}

export async function createSession(userId) {
  const database = await readDatabase();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionDurationMs).toISOString();

  database.sessions = database.sessions.filter(session => {
    return new Date(session.expiresAt).getTime() > Date.now();
  });

  database.sessions.push({
    id: createId("SES", database.sessions),
    userId,
    token,
    createdAt: now.toISOString(),
    expiresAt
  });

  await writeDatabase(database);
  return { token, expiresAt };
}

export async function getUserByToken(token) {
  if (!token) return null;

  const database = await readDatabase();
  const session = database.sessions.find(item => item.token === token);

  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null;

  return database.users.find(user => user.id === session.userId) || null;
}

export async function registerUser({ username, email, password }) {
  const database = await readDatabase();
  const accountUsername = String(username || "").trim().toLowerCase();
  const normalizedUsername = accountUsername.toLowerCase();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!accountUsername || accountUsername.length < 2) {
    throw new Error("Username minimal 2 karakter");
  }

  if (normalizedUsername === "zee") {
    throw new Error("Username ZEE khusus untuk admin");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Email tidak valid");
  }

  if (String(password || "").length < 6) {
    throw new Error("Password minimal 6 karakter");
  }

  const emailExists = database.users.some(user => {
    return String(user.email || "").toLowerCase() === normalizedEmail;
  });

  if (emailExists) {
    throw new Error("Username/email sudah digunakan");
  }

  const usernameExists = database.users.some(user => {
    return String(user.username || user.name || "").toLowerCase() === normalizedUsername;
  });

  if (usernameExists) {
    throw new Error("Username/email sudah digunakan");
  }

  const user = {
    id: createId("USR", database.users),
    name: accountUsername,
    username: accountUsername,
    email: normalizedEmail,
    role: "customer",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  database.users.push(user);
  await writeDatabase(database);

  return user;
}

export async function loginUser({ email, username, identity, password }) {
  const database = await readDatabase();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const passwordHash = hashPassword(password);
  const user = database.users.find(item => {
    const itemEmail = String(item.email || "").toLowerCase();
    return itemEmail === normalizedEmail && item.passwordHash === passwordHash;
  });

  if (!user) {
    throw new Error("Email atau password salah");
  }

  return user;
}

export async function logoutSession(token) {
  const database = await readDatabase();
  database.sessions = database.sessions.filter(session => session.token !== token);
  await writeDatabase(database);
}
