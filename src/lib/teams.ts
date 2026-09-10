/**
 * Posts a shout-out to a Teams channel via an Incoming Webhook URL, mirroring
 * the optional-env-var/graceful-no-op pattern used for Resend elsewhere in
 * this app. Never throws — a Teams outage or missing config should never
 * block a shout-out from saving.
 */
export async function postShoutoutToTeams(input: { fromName: string; toName: string; message: string }) {
  const url = process.env.TEAMS_SHOUTOUTS_WEBHOOK_URL;
  if (!url) {
    console.log(
      `[teams] webhook not configured — would have posted: ${input.fromName} → ${input.toName}: ${input.message}`
    );
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎉 **${input.fromName}** shouted out **${input.toName}**: ${input.message}`,
      }),
    });
  } catch (err) {
    console.error("[teams] failed to post shoutout", err);
  }
}
