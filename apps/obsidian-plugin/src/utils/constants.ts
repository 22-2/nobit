import { type NobitSettings } from "../settings";
import manifest from "../../manifest.json";

export const DEFAULT_SETTINGS: NobitSettings = {
    logLevel: "debug",
};

export const APP_NAME = manifest.name || "Nobit";

export const VIEW_TYPES = {
    BOARD: "board-view",
    BOARD_TREE: "board-tree-view",
    THREAD: "thread-view",
    LIVE_CHAT: "live-chat-view",
    WRITE: "write-view",
} as const;

export const VIEW_ICONS = {
    BBS: "message-circle",
    BOARD_TREE: "list-tree",
    THREAD: "messages-square",
    LIVE_CHAT: "zap",
    WRITE: "pencil",
} as const;
