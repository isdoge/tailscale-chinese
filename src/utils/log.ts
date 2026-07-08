const LOG_PREFIX = "[tailscale-chinese]";

export function log(message: string, extra?: unknown) {
  if (typeof extra === "undefined") {
    console.info(LOG_PREFIX, message);
    return;
  }

  console.info(LOG_PREFIX, message, extra);
}
