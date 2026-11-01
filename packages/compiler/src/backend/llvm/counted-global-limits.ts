import type { IrExpr, IrGlobal, IrLocal, IrStmt } from "../../ir/ir.js";
import { everyExprChild, everyStmtChild } from "../../ir/traverse.js";

/** Immutable numeric globals remain runtime loads in libraries. Admit them
 * as counted-loop limits only in arithmetic bodies that cannot reenter the
 * library initializer. Never substitute their initializer literals. */
export function countedGlobalLocals(
  loop: IrStmt & { kind: "for" },
  locals: ReadonlyMap<string, IrLocal>,
  globals: readonly IrGlobal[],
): ReadonlyMap<string, IrLocal> {
  const expr = (e: IrExpr): boolean => {
    switch (e.kind) {
      case "numLit":
      case "varRef":
      case "bin":
      case "unary":
        break;
      case "bytesIntrinsic":
        if (e.method !== "get" && e.method !== "length") return false;
        break;
      case "libCall":
        if (e.fn !== "math.imul") return false;
        break;
      default:
        return false;
    }
    return everyExprChild(e, expr, stmt);
  };
  const stmt = (s: IrStmt): boolean => {
    if (s.kind !== "assign" && s.kind !== "varDecl" && s.kind !== "block" && s.kind !== "exprStmt")
      return false;
    return everyStmtChild(s, expr, stmt);
  };
  if (!loop.body.every(stmt)) return locals;
  const result = new Map(locals);
  for (const global of globals)
    if (
      !global.mutable &&
      !global.tdz &&
      global.initFlag === undefined &&
      global.type.kind === "f64"
    )
      result.set(global.id, global);
  return result;
}
