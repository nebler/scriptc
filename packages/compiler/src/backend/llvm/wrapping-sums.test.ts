import { expect, test } from "vitest";
import { F64, type IrExpr } from "../../ir/ir.js";
import type { LlvmEmitterContext } from "./expr-context.js";
import { emitWrappingSum, integerOrNaNRange, markWrappingOperands } from "./wrapping-sums.js";

const loc = { file: "wrapping-sums.ts", start: 0, end: 0 };
const num = (value: number): IrExpr => ({ kind: "numLit", value, type: F64, loc });
const bin = (op: "+" | "-" | "*", left: IrExpr, right: IrExpr): IrExpr & { kind: "bin" } => ({
  kind: "bin",
  op,
  left,
  right,
  type: F64,
  loc,
});
function fixture() {
  const lines: string[] = [];
  let temp = 0;
  const ranges = new Map<IrExpr, { min: number; max: number }>();
  const host = {
    B: { tmp: () => `%t${temp++}`, line: (line: string) => lines.push(line) },
    integerRanges: ranges,
    integerOrNaNLocals: new Map(),
    wrappingSums: new Set(),
  } as unknown as LlvmEmitterContext;
  return { host, lines, ranges };
}

test("a parent wrapping sum accepts an exact product that may be negative zero", () => {
  for (const op of ["+", "-", "*"] as const) {
    const { host, lines, ranges } = fixture();
    const x = num(0),
      y = num(-1);
    ranges.set(x, { min: -128, max: 127 });
    ranges.set(y, { min: -128, max: 127 });
    const product = bin("*", x, y);
    const parent = bin(op, num(17), product);
    markWrappingOperands(host, parent);
    expect(integerOrNaNRange(host, product)).toBeNull();
    const result = emitWrappingSum(
      host,
      parent,
      { name: "17.0", type: F64 },
      { name: "%product", type: F64, uint32: "%bits", ordered: "%valid" },
      { name: "17", type: "i32", signed: true, range: { min: 17, max: 17 } },
      null,
    );
    expect(result).toBeDefined();
    expect(lines.join("\n")).toMatch(/(?:add|sub|mul) i32/);
    expect(lines.join("\n")).toContain("%bits");
    expect(result?.ordered).toBe("%valid");
  }
});

test("wrapping range proofs reject rounded products and inexact enclosing sums", () => {
  for (const product of [
    bin("*", num(3), num(3002399751580331)),
    bin("*", num(-2147483648), num(-2147483648)),
  ]) {
    const { host, lines } = fixture();
    const sum = bin("+", num(17), product);
    markWrappingOperands(host, sum);
    expect(
      emitWrappingSum(
        host,
        sum,
        { name: "17.0", type: F64 },
        { name: "%product", type: F64, uint32: "%bits" },
        null,
        null,
      ),
    ).toBeUndefined();
    expect(lines).toEqual([]);
  }
  const { host, ranges } = fixture();
  const sum = bin("+", num(9007199254740991), bin("*", num(-2), num(0)));
  ranges.set(sum.right, { min: 0, max: 2 });
  markWrappingOperands(host, sum);
  expect(
    emitWrappingSum(
      host,
      sum,
      { name: "%large", type: F64 },
      { name: "%product", type: F64 },
      null,
      null,
    ),
  ).toBeUndefined();
});
