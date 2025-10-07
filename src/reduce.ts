import { AstNode, ConjunctNode, DisjunctNode, NegationNode, parse } from "./parse";

function X<SE>(sets: SE[][]): SE[][] {
	return sets.reduce<SE[][]>((x, s) => x.flatMap((p) => s.map((e) => [...p, e])), [[]]);
}

function _(node: AstNode): AstNode {
	switch (node.type) {
		case "disjunct": {
			return _disjunct(node);
		}
		case "conjunct": {
			return _conjunct(node);
		}
		case "negation": {
			return _negation(node);
		}
	}
	return node;
}

// TODO: all this mess is unbearable

function _disjunct(node: DisjunctNode): AstNode {
	const list = node.list.map(_).flatMap((a) => a.type === "disjunct" ? a.list : a);

	return list.some((a) => a.type === "logicval" && a.bool)
		? { type: "logicval", bool: true }
		: { type: "disjunct", list };
}

function _conjunct(node: ConjunctNode): AstNode {
	const list = node.list.map(_).flatMap((a) => a.type === "conjunct" ? a.list : a);

	if (list.some((a) => a.type === "logicval" && !a.bool)) {
		return { type: "logicval", bool: false };
	}

	const dnfs = list.filter((a) => a.type === "disjunct");

	if (!dnfs.length) {
		return { type: "conjunct", list };
	}
	const rest = list.filter((a) => a.type !== "disjunct");

	return {
		type: "disjunct",
		list: X(dnfs.map((a) => a.list)).map((x) => ({ type: "conjunct", list: x.concat(rest) })),
	};
}

function _negation(node: NegationNode): AstNode {
	switch (node.term.type) {
		case "negation": {
			return _(node.term.term);
		}
		case "logicval": {
			return { type: "logicval", bool: !node.term.bool };
		}
		case "variable": {
			return node;
		}
	}

	const list = node.term.list.map((a) => _negation({ type: "negation" as const, term: a }));

	switch (node.term.type) {
		case "disjunct": {
			return { type: "conjunct", list };
		}
		case "conjunct": {
			return { type: "disjunct", list };
		}
	}
}

const e = "a & (b | T) & (c | F)";

const $ = (t: AstNode) => JSON.stringify(t, void 0, "  ");
const n = parse(e);

console.log($(n), "\n" + "-".repeat(50));
console.log($(_(n)));
