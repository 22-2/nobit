import { type NobitSettings } from "../settings";
import manifest from "../../manifest.json";

export const DEFAULT_SETTINGS: NobitSettings = {
    logLevel: "debug",
};

export const APP_NAME = manifest.name || "Nobit";
