const dimensions = 17;
const fractional = 3.5;
const negative = -2;
const invalid = NaN;
function dot(a: Int8Array, b: Int8Array): number {
  let sum = 0;
  for (let i = 0; i < dimensions; i++) sum = (sum + Math.imul(a[i], b[i])) | 0;
  return sum;
}
function bounds(): void {
  let a = 0, b = 0, c = 0;
  for (let i = 0; i < fractional; i++) a += Math.imul(i, 1);
  for (let i = 0; i < negative; i++) b += Math.imul(i, 1);
  for (let i = 0; i < invalid; i++) c += Math.imul(i, 1);
  console.log(a, b, c);
}
console.log(dot(new Int8Array([127, -128, 3]), new Int8Array([127, -128, -4])));
console.log(dot(new Int8Array(17).fill(-128), new Int8Array(17).fill(127)));
bounds();
