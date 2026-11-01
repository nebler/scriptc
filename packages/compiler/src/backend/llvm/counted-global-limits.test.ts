import { expect, test } from "vitest";
import { BOOL, F64, type IrExpr, type IrGlobal, type IrLocal, type IrStmt } from "../../ir/ir.js";
import { matchIntegerCountedForLoop } from "../../ir/integer-loops.js";
import { countedGlobalLocals } from "./counted-global-limits.js";
const loc = { file: "globals.ts", start: 0, end: 0 };
const num = (value: number): IrExpr => ({ kind: "numLit", value, type: F64, loc });
const ref = (localId: string): IrExpr => ({ kind: "varRef", localId, type: F64, loc });
const global: IrGlobal = { id: "limit", name: "limit", type: F64, mutable: false };
const locals = new Map<string, IrLocal>([["i", { id: "i", name: "i", type: F64, mutable: true }]]);
function loop(
  body: IrStmt[] = [
    {
      kind: "exprStmt",
      expr: { kind: "libCall", fn: "math.imul", args: [ref("i"), num(1)], type: F64, loc },
      loc,
    },
  ],
): IrStmt & { kind: "for" } {
  return {
    kind: "for",
    loc,
    init: { kind: "varDecl", localId: "i", init: num(0), loc },
    cond: { kind: "bin", op: "<", left: ref("i"), right: ref("limit"), type: BOOL, loc },
    update: {
      kind: "assign",
      localId: "i",
      value: { kind: "bin", op: "+", left: ref("i"), right: num(1), type: F64, loc },
      loc,
    },
    body,
  };
}
test("a global limit uses a guarded runtime endpoint, never a literal", () => {
  const s = loop();
  expect(matchIntegerCountedForLoop(s, locals)).toBeNull();
  const match = matchIntegerCountedForLoop(s, countedGlobalLocals(s, locals, [global]));
  expect(match?.limitGuarded).toBe(true);
  expect(match?.limit).toEqual(ref("limit"));
});
test("mutable and initialization-checked globals stay excluded", () => {
  for (const extra of [{ mutable: true }, { tdz: true as const }, { initFlag: "ready" }])
    expect(countedGlobalLocals(loop(), locals, [{ ...global, ...extra }]).has("limit")).toBe(false);
});
test("calls that could reenter initialization stay excluded", () => {
  const s = loop([
    { kind: "exprStmt", expr: { kind: "call", callee: "callback", args: [], type: F64, loc }, loc },
  ]);
  expect(countedGlobalLocals(s, locals, [global])).toBe(locals);
});
test("a write to the limit cannot become a counted loop", () => {
  const s = loop([{ kind: "assign", localId: "limit", value: num(0), loc }]);
  expect(matchIntegerCountedForLoop(s, countedGlobalLocals(s, locals, [global]))).toBeNull();
});
