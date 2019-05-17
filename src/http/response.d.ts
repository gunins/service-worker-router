import {ServerResponse} from "http";

export function response(resp: ServerResponse, body: Object): string | null;

export function notFound(resp: ServerResponse, error?: string): string | null;

export const STREAM_END: Symbol;
