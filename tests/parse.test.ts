import { AstNode, parse } from "../src/parse";

const $ = (exp: string, ast: AstNode) => test(exp, () => expect(parse(exp)).toEqual(ast));
const _ = (exp: string) => test(exp, () => expect(() => parse(exp)).toThrow());

const any = (...data: AstNode[]) => ({ type: "disjunct", data }) as const;
const all = (...data: AstNode[]) => ({ type: "conjunct", data }) as const;
const not = (data: AstNode) => ({ type: "negation", data }) as const;
const v = (data: string) => ({ type: "variable", data }) as const;
const T = { type: "logicval", data: true } as const;
const F = { type: "logicval", data: false } as const;

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

_("(");
_(")");
_(")(");

_("(()");
_("())");

_("|");
_("&");

_("A || B");
_("A && B");

_("!");
_("A!");
_("!A!");

_("TFA");
_("TAB");

_("T F");
_("A B");
