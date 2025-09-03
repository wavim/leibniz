export function interpret(expression: string): AstNode {
	const tokens = lexes(expression);
	const parser = new Parse(tokens);

	return parser.parse();
}

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
	data: string;
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
		// identifier cannot include T/F
		+ `(?<variable>[^${Object.values(lexime).join("")}\\s]+)`,
	"g",
);

// only feasible for unambiguous grammars
function lexes(expression: string): Token[] {
	return [...expression.matchAll(regexp)].map((match) => {
		const gp = match.groups as Record<string, string | undefined>;

		return {
			kind: Object.keys(gp).find((k) => gp[k]) as Token["kind"],
			data: match[0],
		};
	});
}

// <LogicExp> ::= <Disjunct>
// <Disjunct> ::= <Conjunct> ( [disjunct] <Conjunct> )*
// <Conjunct> ::= <Negation> ( [conjunct] <Negation> )*
// <Negation> ::=
// 				| [negation] <Negation>
// 				| <GroupExp>
// <GroupExp> ::=
// 				| [lbracket] <LogicExp> [rbracket]
// 				| <LogicVal>
// 				| <Variable>
// <LogicVal> ::= [truthval] | [falseval]
// <Variable> ::= [variable]

export type AstNode =
	| DisjunctNode
	| ConjunctNode
	| NegationNode
	| LogicValNode
	| VariableNode;

export class DisjunctNode {
	constructor(public data: AstNode[]) {}
}
export class ConjunctNode {
	constructor(public data: AstNode[]) {}
}
export class NegationNode {
	constructor(public data: AstNode) {}
}
export class LogicValNode {
	constructor(public data: boolean) {}
}
export class VariableNode {
	constructor(public data: string) {}
}

class Parse {
	private idx = 0;
	constructor(public tokens: Token[]) {}

	private matches(kind?: Token["kind"]): boolean {
		return this.tokens[this.idx]?.kind === kind;
	}
	private consume(): Token {
		return this.tokens[this.idx++];
	}

	parse(): AstNode {
		const LogicExp = this.LogicExp();

		if (this.idx !== this.tokens.length) {
			throw new Error("unexpected end");
		}

		return LogicExp;
	}

	private LogicExp(): AstNode {
		return this.Disjunct();
	}

	private Disjunct(): AstNode {
		const children = [this.Conjunct()];

		while (this.matches("disjunct") && this.consume()) {
			children.push(this.Conjunct());
		}

		return children.length === 1 ? children[0] : new DisjunctNode(children);
	}

	private Conjunct(): AstNode {
		const children = [this.Negation()];

		while (this.matches("conjunct") && this.consume()) {
			children.push(this.Negation());
		}

		return children.length === 1 ? children[0] : new ConjunctNode(children);
	}

	private Negation(): AstNode {
		let level = 0;

		while (this.matches("negation") && this.consume()) {
			level++;
		}

		let Negation = this.GroupExp();

		for (let i = 0; i < level; i++) {
			Negation = new NegationNode(Negation);
		}

		return Negation;
	}

	private GroupExp(): AstNode {
		const token = this.consume();

		switch (token?.kind) {
			case "lbracket": {
				const LogicExp = this.LogicExp();

				if (!this.matches("rbracket")) {
					throw new Error(`expected rbracket`);
				}
				this.consume();

				return LogicExp;
			}
			case "truthval": {
				return new LogicValNode(true);
			}
			case "falseval": {
				return new LogicValNode(false);
			}
			case "variable": {
				return new VariableNode(token.data);
			}
		}

		throw new Error(`unexpected ${token?.kind ?? "end"}`);
	}
}
