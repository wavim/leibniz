export interface Token {
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
