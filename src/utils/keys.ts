import { Platform, type Hotkey, type Instruction } from "obsidian";

export const MOD = Platform.isMacOS ? "Cmd" : "Ctrl";
export const ALT = Platform.isMacOS ? "Option" : "Alt";

export function createInstructions(hotkeysByCommand: {
	[key: string]: Hotkey[];
}): Instruction[] {
	return Object.keys(hotkeysByCommand)
		.filter((x) => hotkeysByCommand[x].length > 0)
		.map((x) => createInstruction(x, hotkeysByCommand[x][0]))
		.filter((x) => x !== null) as Instruction[];
}

export function createInstruction(
	commandName: string,
	hotkey?: Hotkey
): Instruction | null {
	if (!hotkey) {
		return null;
	}
	const mods = hotkey.modifiers
		.map((x) => (x === "Mod" ? MOD : x === "Alt" ? ALT : x))
		.join(" ");
	const key =
		hotkey.key === "Enter"
			? "↵"
			: hotkey.key === "ArrowUp"
			? "↑"
			: hotkey.key === "ArrowDown"
			? "↓"
			: hotkey.key === "Escape"
			? "ESC"
			: hotkey.key;
	const command = mods ? `[${mods} ${key}]` : `[${key}]`;
	return { command, purpose: commandName };
}
