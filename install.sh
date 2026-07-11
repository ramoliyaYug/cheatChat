#!/usr/bin/env bash

set -e

# ─── Colors ───────────────────────────────────────────────────────────────────

PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ─── Banner ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${PURPLE}${BOLD}"
echo "  ██████╗██╗  ██╗███████╗ █████╗ ████████╗"
echo " ██╔════╝██║  ██║██╔════╝██╔══██╗╚══██╔══╝"
echo " ██║     ███████║█████╗  ███████║   ██║   "
echo " ██║     ██╔══██║██╔══╝  ██╔══██║   ██║   "
echo " ╚██████╗██║  ██║███████╗██║  ██║   ██║   "
echo "  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   "
echo " ██████╗██╗  ██╗ █████╗ ████████╗"
echo " ██╔════╝██║  ██║██╔══██╗╚══██╔══╝"
echo " ██║     ███████║███████║   ██║   "
echo " ██║     ██╔══██║██╔══██║   ██║   "
echo " ╚██████╗██║  ██║██║  ██║   ██║   "
echo "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   "
echo -e "${RESET}"
echo -e "  ${BOLD}CheatChat Installer${RESET} ${DIM}v1.0.0${RESET}"
echo -e "  ${CYAN}A minimal terminal chat app powered by AWS${RESET}"
echo ""

# ─── Check for Node.js ───────────────────────────────────────────────────────

if ! command -v node &> /dev/null; then
    echo -e "  ${RED}✗ Node.js is not installed.${RESET}"
    echo -e "  ${DIM}Install it from: https://nodejs.org${RESET}"
    echo ""
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "  ${RED}✗ npm is not installed.${RESET}"
    echo -e "  ${DIM}Install it from: https://nodejs.org${RESET}"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "  ${GREEN}✓${RESET} Node.js ${DIM}${NODE_VERSION}${RESET} detected"
echo ""

# ─── Installation Options ────────────────────────────────────────────────────

echo -e "  ${BOLD}How would you like to install CheatChat?${RESET}"
echo ""
echo -e "  ${PURPLE}1)${RESET} ${BOLD}Full Setup${RESET} ${DIM}— Create ~/.npm-global directory + install CheatChat${RESET}"
echo -e "     ${DIM}Best for first-time setup or if 'npm install -g' gives permission errors${RESET}"
echo ""
echo -e "  ${PURPLE}2)${RESET} ${BOLD}Quick Install${RESET} ${DIM}— Just install CheatChat globally${RESET}"
echo -e "     ${DIM}Use this if you already have global npm packages working${RESET}"
echo ""
echo -e "  ${PURPLE}3)${RESET} ${BOLD}Cancel${RESET}"
echo ""
read -rp "  $(echo -e "${PURPLE}›${RESET}") Pick an option [1/2/3]: " CHOICE </dev/tty

echo ""

case "$CHOICE" in

# ─── Option 1: Full Setup ────────────────────────────────────────────────────

1)
    echo -e "  ${CYAN}▸ Setting up npm global directory...${RESET}"

    mkdir -p "$HOME/.npm-global"
    npm config set prefix "$HOME/.npm-global"

    echo -e "  ${GREEN}✓${RESET} Created ${DIM}~/.npm-global${RESET}"

    # Detect shell profile
    PROFILE="$HOME/.bashrc"

    if [ -f "$HOME/.zshrc" ]; then
        PROFILE="$HOME/.zshrc"
    fi

    LINE='export PATH="$HOME/.npm-global/bin:$PATH"'

    if grep -qxF "$LINE" "$PROFILE" 2>/dev/null; then
        echo -e "  ${GREEN}✓${RESET} PATH already configured in ${DIM}$(basename "$PROFILE")${RESET}"
    else
        echo "$LINE" >> "$PROFILE"
        echo -e "  ${GREEN}✓${RESET} Added PATH to ${DIM}$(basename "$PROFILE")${RESET}"
    fi

    export PATH="$HOME/.npm-global/bin:$PATH"

    echo -e "  ${CYAN}▸ Installing CheatChat...${RESET}"
    echo ""

    npm install -g cheatchat

    echo ""
    echo -e "  ${GREEN}${BOLD}✓ Installation complete!${RESET}"
    echo ""
    echo -e "  ${YELLOW}⚠ Important:${RESET} Run this command to activate the PATH in your current terminal:"
    echo ""
    echo -e "    ${BOLD}source ${PROFILE}${RESET}"
    echo ""
    echo -e "  ${DIM}After that, you can use:${RESET}"
    echo -e "    ${PURPLE}chat signup${RESET}    ${DIM}— Create an account${RESET}"
    echo -e "    ${PURPLE}chat login${RESET}     ${DIM}— Login to your account${RESET}"
    echo -e "    ${PURPLE}chat connect${RESET}   ${DIM}— Start chatting${RESET}"
    echo ""
    ;;

# ─── Option 2: Quick Install ─────────────────────────────────────────────────

2)
    echo -e "  ${CYAN}▸ Installing CheatChat globally...${RESET}"
    echo ""

    npm install -g cheatchat

    echo ""
    echo -e "  ${GREEN}${BOLD}✓ Installation complete!${RESET}"
    echo ""
    echo -e "  ${DIM}You can now use:${RESET}"
    echo -e "    ${PURPLE}chat signup${RESET}    ${DIM}— Create an account${RESET}"
    echo -e "    ${PURPLE}chat login${RESET}     ${DIM}— Login to your account${RESET}"
    echo -e "    ${PURPLE}chat connect${RESET}   ${DIM}— Start chatting${RESET}"
    echo ""
    ;;

# ─── Option 3: Cancel ────────────────────────────────────────────────────────

3)
    echo -e "  ${DIM}Installation cancelled.${RESET}"
    echo ""
    exit 0
    ;;

# ─── Invalid Input ───────────────────────────────────────────────────────────

*)
    echo -e "  ${RED}✗ Invalid option. Please run the installer again.${RESET}"
    echo ""
    exit 1
    ;;

esac
