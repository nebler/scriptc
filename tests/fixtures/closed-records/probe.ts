function hide(v: unknown): void {
  Object.defineProperty(v, "hidden", { value: 2 });
}
function proto(v: unknown): void {
  Object.setPrototypeOf(v, null);
}
function symbol(v: unknown): void {
  Object.defineProperty(v, Symbol("hidden"), { value: 2 });
}
function getter(v: unknown): void {
  Object.defineProperty(v, "n", {
    get() {
      return 7;
    },
    enumerable: true,
    configurable: true,
  });
}
function extra(v: any): void {
  v.extra = 3;
}
let output = "";
function inspect(label: string, v: unknown): void {
  output +=
    label +
    " " +
    JSON.stringify(Object.getOwnPropertyNames(v)) +
    " " +
    Object.getOwnPropertySymbols(v).length +
    " " +
    (Object.getPrototypeOf(v) === null) +
    "\n";
  const d = Object.getOwnPropertyDescriptor(v, "n");
  output += label + " " + (d ? typeof d.get : "absent") + " " + JSON.stringify(v) + "\n";
}
export function run(): string {
  output = "";
  const h = { n: 1 };
  hide(h);
  inspect("hidden", h);
  const p = { n: 1 };
  proto(p);
  inspect("prototype", p);
  const s = { n: 1 };
  symbol(s);
  inspect("symbol", s);
  const g = { n: 1 };
  getter(g);
  inspect("getter", g);
  const e = { n: 1 };
  extra(e);
  inspect("extra", e);
  const a: number[] = [];
  a.length = 1;
  inspect("holes", a);
  const as = [1];
  symbol(as);
  inspect("array-symbol", as);
  inspect("negative-zero", { n: -0 });
  return output;
}
