/**
 * Types shared between the Next.js frontend (apps/web) and the Nest.js API
 * (apps/api). Kept framework-agnostic and dependency-free so both an ESM and a
 * CommonJS consumer can use it. Built to CommonJS in dist/.
 */

/** An item as returned by the API (dates serialized as ISO strings over the wire). */
export type Item = {
  id: string;
  title: string;
  createdAt: string;
};

/** Payload accepted by POST /api/items. */
export type CreateItemInput = {
  title: string;
};
