interface Token {
	kind:
		| "variable"
		| "truthval"
		| "falseval"
		| "lbracket"
		| "rbracket"
		| "negation"
		| "conjunct"
		| "disjunct";
	raw: string;
	pos: number;
}

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
		// reserve CAP for logical constants
		+ `(?<variable>[^ A-Z${Object.values(lexime).join("")}]+)`,
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

// <LogicExp> ::= <Disjunct>

// <Disjunct> ::= <Conjunct> ( [disjunct] <Conjunct> )*

// <Conjunct> ::= <Negation> ( [conjunct] <Negation> )*

// <Negation> ::= [negation] <Negation> | <BaseAtom>

// <BaseAtom> ::= <LogicVal> | <Variable> | [lbracket] <LogicExp> [rbracket]

// <LogicVal> ::= [truthval] | [falseval]

// <Variable> ::= [variable]

export class LogParser {
	constructor(public tokens: Token[]) {}
	private idx = 0;

	private matches(kind: Token["kind"]): boolean {
		return this.tokens[this.idx].kind === kind;
	}
	private consume(kind: Token["kind"]): Token {
		const next = this.tokens[this.idx];

		if (next.kind !== kind) {
			throw new Error(`expected ${kind}, received ${next.kind}`);
		}
		this.idx++;

		return next;
	}
}

// tests
// const tokens = lexes("!a & (b | a)");
// const parser = new LogParser(tokens);
