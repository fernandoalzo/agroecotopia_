function isDecimal(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as any).toNumber === "function" &&
    "s" in value &&
    "e" in value
  );
}

function isPlainObject(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    value.constructor === Object
  );
}

export function deepSerialize<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (isDecimal(value)) {
    return (value as any).toNumber() as any;
  }

  if (value instanceof Date) {
    return value as any;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepSerialize(item)) as any;
  }

  if (typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value as Record<string, any>)) {
      result[key] = deepSerialize((value as Record<string, any>)[key]);
    }
    return result as T;
  }

  return value;
}
