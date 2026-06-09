declare module "bun:sqlite" {
  export class Database {
    constructor(path: string);
  }
}

declare module "@cloudflare/workers-types" {
  export type D1Database = object;
}
