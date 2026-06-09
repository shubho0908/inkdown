type SearchParamsReader = Pick<URLSearchParams, "get" | "has" | "getAll">;

export function readSearchParam(searchParams: SearchParamsReader, name: string): string | null {
  return searchParams.get(name);
}

export function readSearchParamAll(searchParams: SearchParamsReader, name: string): string[] {
  return searchParams.getAll(name);
}

export function hasSearchParam(searchParams: SearchParamsReader, name: string): boolean {
  return searchParams.has(name);
}
