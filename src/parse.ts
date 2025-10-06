export function parseExp(expression: string): AstNode {
	const tokens = lexes(expression);
	const parser = new Parse(tokens);

	return parser.tree();
}

interface Token {
	type:
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

export const lexime = {
	truthval: "T",
	falseval: "F",
	lbracket: "(",
	rbracket: ")",
	negation: "!",
	conjunct: "&",
	disjunct: "|",
} as const satisfies Record<Exclude<Token["type"], "variable">, string>;

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
			type: Object.keys(gp).find((k) => gp[k]) as Token["type"],
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

export interface DisjunctNode {
	type: "disjunct";
	data: AstNode[];
}
export interface ConjunctNode {
	type: "conjunct";
	data: AstNode[];
}
export interface NegationNode {
	type: "negation";
	data: AstNode;
}
export interface LogicValNode {
	type: "logicval";
	data: boolean;
}
export interface VariableNode {
	type: "variable";
	data: string;
}

class Parse {
	private idx = 0;
	constructor(public tokens: Token[]) {}

	private matches(kind?: Token["type"]): boolean {
		return this.tokens[this.idx]?.type === kind;
	}
	private consume(): Token {
		return this.tokens[this.idx++];
	}

	tree(): AstNode {
		const data = this.Disjunct();

		if (this.idx !== this.tokens.length) {
			throw new Error("unexpected end");
		}
		return data;
	}

	private Disjunct(): AstNode {
		const data = [this.Conjunct()];

		while (this.matches("disjunct") && this.consume()) {
			const node = this.Conjunct();

			if (node.type === "disjunct") {
				data.push(...node.data);
			} else {
				data.push(node);
			}
		}
		return data.length > 1 ? { type: "disjunct", data } : data[0];
	}

	private Conjunct(): AstNode {
		const data = [this.Negation()];

		while (this.matches("conjunct") && this.consume()) {
			const node = this.Negation();

			if (node.type === "conjunct") {
				data.push(...node.data);
			} else {
				data.push(node);
			}
		}
		return data.length > 1 ? { type: "conjunct", data } : data[0];
	}

	private Negation(): AstNode {
		let level = 0;

		while (this.matches("negation") && this.consume()) {
			level++;
		}

		let data = this.GroupExp();

		for (let i = 0; i < level; i++) {
			data = { type: "negation", data };
		}
		return data;
	}

	private GroupExp(): AstNode {
		const token = this.consume();

		switch (token?.type) {
			case "lbracket": {
				const data = this.Disjunct();

				if (!this.matches("rbracket")) {
					throw new Error(`expected rbracket`);
				}
				this.consume();

				return data;
			}
			case "truthval": {
				return { type: "logicval", data: true };
			}
			case "falseval": {
				return { type: "logicval", data: false };
			}
			case "variable": {
				return token as VariableNode;
			}
		}
		throw new Error(`unexpected ${token?.type ?? "end"}`);
	}
}
