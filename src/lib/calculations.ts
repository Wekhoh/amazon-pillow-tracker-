export type Phase =
	| "pre-launch"
	| "D0-7"
	| "D8-21"
	| "D22-45"
	| "D46-90"
	| "D91-180";

export function getPhase(dayNum: number): Phase {
	if (dayNum < 0) return "pre-launch";
	if (dayNum <= 7) return "D0-7";
	if (dayNum <= 21) return "D8-21";
	if (dayNum <= 45) return "D22-45";
	if (dayNum <= 90) return "D46-90";
	return "D91-180";
}
