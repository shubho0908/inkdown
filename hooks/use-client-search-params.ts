"use client";

import { useSearchParams as useNextSearchParams } from "next/navigation";
import { useCallback } from "react";

import {
  hasSearchParam,
  readSearchParam,
  readSearchParamAll,
} from "@/lib/navigation/search-params";

/**
 * Client components must use this hook instead of importing useSearchParams
 * from next/navigation. URLSearchParams methods rely on receiver binding and
 * must never be destructured (e.g. const { get } = useSearchParams()).
 */
export function useClientSearchParams() {
  const searchParams = useNextSearchParams();

  const get = useCallback((name: string) => readSearchParam(searchParams, name), [searchParams]);

  const getAll = useCallback(
    (name: string) => readSearchParamAll(searchParams, name),
    [searchParams],
  );

  const has = useCallback((name: string) => hasSearchParam(searchParams, name), [searchParams]);

  const toString = useCallback(() => searchParams.toString(), [searchParams]);

  return { get, getAll, has, toString };
}
