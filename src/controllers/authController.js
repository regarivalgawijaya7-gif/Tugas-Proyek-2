import {
  createSession,
  getPublicUser,
  loginUser,
  logoutSession,
  registerUser
} from "../services/authService.js";
import { parseRequestBody } from "../utils/request.js";
import { sendJson } from "../utils/response.js";

function setSessionCookie(response, token) {
  response.setHeader(
    "Set-Cookie",
    `smartix_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
  );
}

export async function register(request, response) {
  try {
    const body = await parseRequestBody(request);
    const user = await registerUser(body);
    const session = await createSession(user.id);

    setSessionCookie(response, session.token);
    sendJson(response, 201, {
      success: true,
      message: "Registrasi berhasil",
      data: {
        user: getPublicUser(user),
        token: session.token,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    sendJson(response, 400, {
      success: false,
      message: error.message
    });
  }
}

export async function login(request, response) {
  try {
    const body = await parseRequestBody(request);
    const user = await loginUser(body);
    const session = await createSession(user.id);

    setSessionCookie(response, session.token);
    sendJson(response, 200, {
      success: true,
      message: "Login berhasil",
      data: {
        user: getPublicUser(user),
        token: session.token,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    sendJson(response, 401, {
      success: false,
      message: error.message
    });
  }
}

export async function logout(request, response) {
  await logoutSession(request.authToken);
  response.setHeader("Set-Cookie", "smartix_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
  sendJson(response, 200, {
    success: true,
    message: "Logout berhasil"
  });
}

export async function getMe(request, response) {
  sendJson(response, 200, {
    success: true,
    message: "Data user aktif berhasil diambil",
    data: getPublicUser(request.currentUser)
  });
}
