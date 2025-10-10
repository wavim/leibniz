export function parse(exp: string): AstNode {
	return new Parser(tokens(exp)).tree();
}

export interface Token {
	type:
		| "variable"
		| "truthval"
		| "falseval"
		| "lbracket"
		| "rbracket"
		| "negation"
		| "conjunct"
		| "disjunct";
	text: string;
}
const regex =
	/(?<disjunct>\|)|(?<conjunct>&)|(?<negation>!)|(?<lbracket>\()|(?<rbracket>\))|(?<truthval>T(?=$|[()!&|\s]))|(?<falseval>F(?=$|[()!&|\s]))|(?<variable>[^()!&|\s]+)/g;

export function tokens(exp: string): Token[] {
	return [...exp.matchAll(regex)].map((match) => {
		const gp = match.groups as Record<string, string | undefined>;

		return {
			type: Object.keys(gp).find((k) => gp[k]) as Token["type"],
			text: match[0],
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
	list: AstNode[];
}
export interface ConjunctNode {
	type: "conjunct";
	list: AstNode[];
}
export interface NegationNode {
	type: "negation";
	term: AstNode;
}
export interface LogicValNode {
	type: "logicval";
	bool: boolean;
}
export interface VariableNode {
	type: "variable";
	name: string;
}

class Parser {
	constructor(public tokens: Token[]) {}

	private pos = 0;

	private matches(kind?: Token["type"]): boolean {
		return this.tokens[this.pos]?.type === kind;
	}
	private consume(): Token {
		return this.tokens[this.pos++];
	}

	tree(): AstNode {
		const node = this.Disjunct();

		if (this.pos !== this.tokens.length) {
			throw new Error(`unexpected ${this.consume().type}`);
		}
		return node;
	}

	private Disjunct(): AstNode {
		const list = [this.Conjunct()];

		while (this.matches("disjunct") && this.consume()) {
			const node = this.Conjunct();

			if (node.type === "disjunct") {
				list.push(...node.list);
			} else {
				list.push(node);
			}
		}
		return list.length > 1 ? { type: "disjunct", list } : list[0];
	}

	private Conjunct(): AstNode {
		const list = [this.Negation()];

		while (this.matches("conjunct") && this.consume()) {
			const node = this.Negation();

			if (node.type === "conjunct") {
				list.push(...node.list);
			} else {
				list.push(node);
			}
		}
		return list.length > 1 ? { type: "conjunct", list } : list[0];
	}

	private Negation(): AstNode {
		let nest = 0;

		while (this.matches("negation") && this.consume()) {
			nest++;
		}

		let term = this.GroupExp();

		for (let i = 0; i < nest; i++) {
			term = { type: "negation", term };
		}
		return term;
	}

	private GroupExp(): AstNode {
		const token = this.consume();

		switch (token?.type) {
			case "variable":
				return { type: "variable", name: token.text };
			case "truthval":
				return { type: "logicval", bool: true };
			case "falseval":
				return { type: "logicval", bool: false };
			case "lbracket":
				const node = this.Disjunct();

				if (!this.matches("rbracket")) {
					throw new Error("unexpected end");
				}
				this.consume();

				return node;
		}
		throw new Error(`unexpected ${token?.type ?? "end"}`);
	}
}
