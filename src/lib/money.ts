export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function dueDaysFromTerms(terms: string) {
  const match = terms.match(/(\d+)/);
  if (terms.toLowerCase().includes("receipt")) return 0;
  return match ? Number(match[1]) : 30;
}
