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

function _disjunct(node: DisjunctNode): AstNode {
	const data = node.data.map(_);

	return data.some((a) => a.type === "logicval" && a.data)
		? { type: "logicval", data: true }
		: { type: "disjunct", data: data.flatMap((a) => a.type === "disjunct" ? a.data : a) };
}

function _conjunct(node: ConjunctNode): AstNode {
	const data = node.data.map(_);

	if (data.some((a) => a.type === "logicval" && !a.data)) {
		return { type: "logicval", data: false };
	}

	const dnfs = data.filter((a) => a.type === "disjunct");

	if (!dnfs.length) {
		return { type: "conjunct", data: data.flatMap((a) => a.type === "conjunct" ? a.data : a) };
	}
	const rest = data.filter((a) => a.type !== "disjunct");

	return {
		type: "disjunct",
		data: X(dnfs.map((a) => a.data)).map((x) => ({ type: "conjunct", data: x.concat(rest) })),
	};
}

function _negation(node: NegationNode): AstNode {
	switch (node.data.type) {
		case "negation": {
			return _(node.data.data);
		}
		case "logicval": {
			return { type: "logicval", data: !node.data.data };
		}
		case "variable": {
			return node;
		}
	}

	const data = node.data.data.map((a) => ({ type: "negation" as const, data: _(a) }));

	switch (node.data.type) {
		case "disjunct": {
			return { type: "conjunct", data };
		}
		case "conjunct": {
			return { type: "disjunct", data };
		}
	}
}

const e = "!(A & B) | C";

const $ = (t: AstNode) => JSON.stringify(t, void 0, "  ");
const n = parse(e);

console.log($(n), "\n" + "-".repeat(100));
console.log($(_(n)));
