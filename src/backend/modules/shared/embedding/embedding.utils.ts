export function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const map = new Map(items.map(i => [i.id, i]));
  return ids.map(id => map.get(id)).filter((x): x is T => x !== undefined);
}
