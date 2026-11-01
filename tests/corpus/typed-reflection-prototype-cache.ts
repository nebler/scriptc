// Repeated prototype reads must preserve identity, live fields and mutations.
function inspect(value: unknown): void {
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const first = Object.getPrototypeOf(value);
  console.log(Object.getPrototypeOf(value) === first, Object.keys(descriptors).join(','));
}
const row = { n: 1, text: 'x' };
inspect(row);
row.n = 2;
inspect(row);
console.log(row.n);
const items = [row];
inspect(items);
items.push({ n: 3, text: 'y' });
inspect(items);
function changePrototype(value: object): void {
  const proto = { marker: true };
  Object.getOwnPropertyDescriptors(value);
  Object.setPrototypeOf(value, proto);
  console.log(Object.getPrototypeOf(value) === proto);
  Object.setPrototypeOf(value, null);
  console.log(Object.getPrototypeOf(value) === null);
}
changePrototype(row);
