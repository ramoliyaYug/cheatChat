import chalk from "chalk";

// ─── Brand Colors ────────────────────────────────────────────────────────────

export const brand = chalk.hex("#6C63FF");        // Primary purple
export const brandBold = chalk.hex("#6C63FF").bold;
export const accent = chalk.hex("#00D9FF");        // Cyan accent
export const accentBold = chalk.hex("#00D9FF").bold;
export const success = chalk.hex("#00E676");       // Green
export const warning = chalk.hex("#FFD600");       // Yellow
export const danger = chalk.hex("#FF5252");        // Red
export const muted = chalk.hex("#888888");         // Gray
export const subtle = chalk.hex("#555555");        // Darker gray
export const white = chalk.white;
export const whiteBold = chalk.white.bold;
export const dim = chalk.dim;

// ─── Message Colors ─────────────────────────────────────────────────────────

export const globalTag = chalk.bgHex("#6C63FF").white.bold;
export const privateTag = chalk.bgHex("#FF6B6B").white.bold;
export const systemTag = chalk.bgHex("#FFD600").black.bold;
export const errorTag = chalk.bgHex("#FF5252").white.bold;

export const senderSelf = chalk.hex("#00E676").bold;
export const senderOther = chalk.hex("#00D9FF").bold;
export const timestamp = chalk.hex("#666666");
export const messageText = chalk.white;

// ─── UI Elements ─────────────────────────────────────────────────────────────

export const separator = chalk.hex("#333333");
export const prompt = chalk.hex("#6C63FF").bold;
export const inputArrow = chalk.hex("#6C63FF")("›");
