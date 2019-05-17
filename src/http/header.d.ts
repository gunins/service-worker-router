import {ServerResponse, IncomingMessage, OutgoingHttpHeaders} from "http";


declare type responseAction = (req: IncomingMessage, resp: ServerResponse, cb: () => void) => void

export function addHeader(header: OutgoingHttpHeaders): responseAction;

export const jsonHeader: responseAction;
export const htmlHeader: responseAction;

