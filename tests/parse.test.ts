import { AstNode, parse } from "../src/parse";

const $ = (exp: string, ast: AstNode) => test(exp, () => expect(parse(exp)).toEqual(ast));
const x = (exp: string) => test(exp, () => expect(() => parse(exp)).toThrow());

const any = (...list: AstNode[]) => ({ type: "disjunct", list }) as const;
const all = (...list: AstNode[]) => ({ type: "conjunct", list }) as const;
const not = (term: AstNode) => ({ type: "negation", term }) as const;
const v = (name: string) => ({ type: "variable", name }) as const;
const T = { type: "logicval", bool: true } as const;
const F = { type: "logicval", bool: false } as const;

$("T", T);
$("F", F);

$("A", v("A"));
$("ATF", v("ATF"));

$("T | A", any(T, v("A")));
$("T | (F | A)", any(T, F, v("A")));

$("T & A", all(T, v("A")));
$("T & (F & A)", all(T, F, v("A")));

$("!T", not(T));
$("!!A", not(not(v("A"))));

$("A | (B & C)", any(v("A"), all(v("B"), v("C"))));
$("A & (B | C)", all(v("A"), any(v("B"), v("C"))));

$("A & T | (!B & C | !(D & E) & F)", any(all(v("A"), T), all(not(v("B")), v("C")), all(not(all(v("D"), v("E"))), F)));
$("!A & (T | !B | C & (D | E | F))", all(not(v("A")), any(T, not(v("B")), all(v("C"), any(v("D"), v("E"), F)))));

x("TA");

x("(");
x(")");
x(")(");

x("|");
x("&");

x("A || B");
x("A && B");
x("A !! B");

x("!");
x("A!");
