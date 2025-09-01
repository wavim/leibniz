import { Token } from "./types/token";

const lexime = {
	truthval: "T",
	falseval: "F",
	lbracket: "(",
	rbracket: ")",
	negation: "!",
	conjunct: "&",
	disjunct: "|",
} as const satisfies Record<Exclude<Token["kind"], "variable">, string>;

const regexp = RegExp(
	Object.entries(lexime).map(([kind, raw]) => `(?<${kind}>\\${raw})`).join("|")
		+ "|"
		+ `(?<variable>[^ ${Object.values(lexime).join("")}]+)`,
	"g",
);

// only feasible for unambiguous grammars
function lexes(expression: string): Token[] {
	return [...expression.matchAll(regexp)].map((match) => {
		const selectors = match.groups as Record<Token["kind"], string | undefined>;

		return {
			kind: Object.keys(selectors).find((k) => selectors[k]) as Token["kind"],
			raw: match[0],
			pos: match.index,
		};
	});
}
