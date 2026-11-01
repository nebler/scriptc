// Signed zero is disposable only at a wrapping consumer. Missing reads
// poison the whole sum, rather than contributing Math.imul's zero.
function dot(a: Int8Array, b: Int8Array, n: number): number {
  let sum = 17;
  for (let i = 0; i < n; i++) sum = (sum + a[i]! * b[i]!) | 0;
  return sum;
}
function plain(a: Int8Array, b: Int8Array, n: number, start: number): number {
  let sum = start;
  for (let i = 0; i < n; i++) sum += a[i]! * b[i]!;
  return sum;
}
const a = new Int8Array([0, -1, -128, 127, 0, 1]);
const b = new Int8Array([-1, 0, -128, -128, -1, 1]);
for (let n = 0; n <= 8; n++) {
  const sum = plain(a, b, n, 0);
  const negative = plain(a, b, n, -0);
  console.log("dot", n, dot(a, b, n), sum, Object.is(sum, -0), Object.is(negative, -0));
}
for (let i = -1; i <= a.length; i++) {
  const product = a[i]! * b[i]!;
  console.log("zero", i, Object.is(product, -0), 1 / product,
    Object.is(product + 0, -0), Object.is(product - 0, -0),
    (13 + a[i]! * b[i]!) | 0, (13 - a[i]! * b[i]!) >>> 0,
    ((a[i]! * b[i]! - 0) * -3 + 7) ^ 1);
}
// Every integer typed-array width, both in bounds and NaN-coded reads.
const i16 = new Int16Array([0, -1, -32768, 32767]);
const u16 = new Uint16Array([0, 1, 65535, 32768]);
const u8 = new Uint8Array([0, 1, 255, 128]);
const clamp = new Uint8ClampedArray([0, -1, 256, 128]);
const i32 = new Int32Array([0, -1, -2147483648, 2147483647]);
const u32 = new Uint32Array([0, 1, 4294967295, 2147483648]);
for (let i = -1; i <= 4; i++) {
  console.log("widths", i, (i16[i]! * u16[i]! + 2147483647) | 0,
    (u8[i]! * i16[i]! - 1) | 0, (clamp[i]! * i16[i]! + 19) >>> 0,
    (i32[i]! * -1 + 1) | 0, (u32[i]! * -1 + 1) >>> 0,
    (i32[i]! * u16[i]! + u32[i]!) | 0,
    (u32[i]! * i16[i]! - i32[i]!) >>> 0,
    (i32[i]! * i32[i]! + 3) | 0, (u32[i]! * u32[i]! + 3) >>> 0);
  // The inner product is exact but the parent exceeds the safe range.
  console.log("boundary", (i32[i]! * 2097151 + 9007199254740991) | 0,
    (u32[i]! * -2097153 + 7) | 0);
}
// Two invalid operands and a later valid iteration exercise NaN reset.
const many = new Int8Array(1024);
const other = new Int8Array(1024);
for (let i = 0; i < many.length; i++) { many[i] = i; other[i] = 127 - i; }
console.log("long", dot(many, other, 1024), dot(many, other, 1025));
let recovery = 123;
for (let i = -2; i < 4; i++) recovery = (recovery + a[i]! * b[i]!) | 0;
console.log("recovery", recovery);
// Arbitrary Number values, floats, infinities and rounded large products
// must keep JS multiplication and addition before ToInt32.
function numbers(x: number, y: number, z: number): number { return (z + x * y) | 0; }
const xs = [0, -0, -1, 1.5, NaN, Infinity, 3, 94906267];
const ys = [-1, -0, 0, -2.25, 7, 0, 3002399751580331, 94906267];
for (let i = 0; i < xs.length; i++) console.log("number", numbers(xs[i]!, ys[i]!, 17));
const floats = new Float64Array([0, -0, -1.25, NaN, Infinity]);
for (let i = 0; i <= floats.length; i++) console.log("float", (17 + floats[i]! * -3) | 0);
