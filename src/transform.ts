import {
	AstNode,
	ConjunctNode,
	DisjunctNode,
	NegationNode,
} from "./interpret"; // use matcher

// implement a pattern matcher class instead
function normalize(tree: AstNode): AstNode {
	if (tree instanceof NegationNode) {
		if (tree.data instanceof NegationNode) {
			return normalize(tree.data.data);
		}

		if (tree.data instanceof ConjunctNode) {
			return new DisjunctNode(
				tree.data.data.map((n) => new NegationNode(normalize(n))),
			);
		}

		if (tree.data instanceof DisjunctNode) {
			return new ConjunctNode(
				tree.data.data.map((n) => new NegationNode(normalize(n))),
			);
		}

		return tree;
	}

	if (tree instanceof ConjunctNode) {
		// only handles 2 cases (1 with canoc form)
		if (tree.data[1] instanceof DisjunctNode) {
			return new DisjunctNode([
				new ConjunctNode([
					normalize(tree.data[0]),
					normalize(tree.data[1].data[0]),
				]),
				new ConjunctNode([
					normalize(tree.data[0]),
					normalize(tree.data[1].data[1]),
				]),
			]);
		}
		if (tree.data[0] instanceof DisjunctNode) {
			return new DisjunctNode([
				new ConjunctNode([
					normalize(tree.data[0].data[0]),
					normalize(tree.data[1]),
				]),
				new ConjunctNode([
					normalize(tree.data[0].data[1]),
					normalize(tree.data[1]),
				]),
			]);
		}
	}

	return tree;
}
