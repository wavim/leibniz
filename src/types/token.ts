export interface Token {
	kind:
		| "variable"
		| "lbracket"
		| "rbracket"
		| "negation"
		| "conjunct"
		| "disjunct";
	raw: string;
	pos: number;
}
