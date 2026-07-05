import { addRealtimeClient } from "../services/realtimeService.js";
import { sendJson } from "../utils/response.js";

export async function openRealtimeStream(request, response) {
  if (!request.currentUser) {
    sendJson(response, 401, {
      success: false,
      message: "RTC membutuhkan login"
    });
    return;
  }

  addRealtimeClient(request, response, request.currentUser);
}
