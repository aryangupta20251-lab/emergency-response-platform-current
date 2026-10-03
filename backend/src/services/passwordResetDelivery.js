import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";

export async function deliverPasswordReset({ recipient, token, expiresAt }) {
  if (env.passwordResetDelivery === "disabled") {
    throw httpError(503, "Password reset is not configured. Contact an administrator.");
  }

  const resetUrl = new URL(env.passwordResetUrl);
  resetUrl.searchParams.set("token", token);

  if (env.passwordResetDelivery === "console") {
    console.info("[Development password reset] " + resetUrl.toString());
    return;
  }

  let response;
  try {
    response = await fetch(env.passwordResetWebhookUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.passwordResetWebhookToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        resetUrl: resetUrl.toString(),
        expiresAt,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw httpError(503, "Password reset delivery is temporarily unavailable.");
  }

  if (!response.ok) {
    throw httpError(503, "Password reset delivery is temporarily unavailable.");
  }
}
