import boxen from "boxen";
import { brand, accent, muted, whiteBold } from "./color.js";
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from "../utils/constants.js";

// ─── ASCII Art Logo ──────────────────────────────────────────────────────────

const LOGO = `
 ██████╗██╗  ██╗███████╗ █████╗ ████████╗
██╔════╝██║  ██║██╔════╝██╔══██╗╚══██╔══╝
██║     ███████║█████╗  ███████║   ██║   
██║     ██╔══██║██╔══╝  ██╔══██║   ██║   
╚██████╗██║  ██║███████╗██║  ██║   ██║   
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   
 ██████╗██╗  ██╗ █████╗ ████████╗
██╔════╝██║  ██║██╔══██╗╚══██╔══╝
██║     ███████║███████║   ██║   
██║     ██╔══██║██╔══██║   ██║   
╚██████╗██║  ██║██║  ██║   ██║   
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝`;

/**
 * Display the welcome banner.
 */
export function showBanner() {
  const logo = brand(LOGO);
  const tagline = `\n  ${whiteBold(APP_NAME)} ${muted(`v${APP_VERSION}`)}`;
  const desc = `  ${accent(APP_DESCRIPTION)}`;

  const box = boxen(`${logo}\n${tagline}\n${desc}`, {
    padding: { top: 0, bottom: 1, left: 2, right: 2 },
    borderColor: "#6C63FF",
    borderStyle: "round",
    dimBorder: false,
  });

  console.log(box);
  console.log();
}

/**
 * Display a compact header for chat mode.
 */
export function showChatHeader(username, mode, target) {
  const modeLabel = mode === "global"
    ? accent("🌍 Global Chat")
    : accent(`🔒 DM → ${whiteBold(target)}`);

  const box = boxen(
    `${whiteBold(APP_NAME)} ${muted("•")} ${muted("logged in as")} ${brand(username)} ${muted("•")} ${modeLabel}`,
    {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: "#6C63FF",
      borderStyle: "round",
    }
  );

  console.log(box);
}
