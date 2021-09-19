import { handleHttpRequest } from "./http.ts";
import { handleWs } from "./ws.ts";
import { acceptWebSocket } from "./deps.ts";
import { internalMethods } from "./ws_internal_methods.ts";
import { createRpcResponseObject } from "./creation.ts";

import type { WebSocket } from "./deps.ts";
import type { JsonValue } from "../json_rpc_types.ts";

export type Methods = {
  [method: string]: (...arg: any) => JsonValue | Promise<JsonValue>;
};
export type Options = {
  // Add headers to the default header '{"content-type" : "application/json"}':
  headers?: Headers;
  // include or don't include server side error messages in response:
  publicErrorStack?: boolean;
  // enable 'subscribe', 'emit' and 'unsubscribe' (only ws):
  enableInternalMethods?: boolean;
  // defaults to http:
  proto?: "ws" | "http";
  // Enable CORS via the "Access-Control-Allow-Origin" header (only http):
  cors?: boolean;
  // The server can pass additional arguments to the rpc methods:
  additionalArguments?: {
    // e.g. `args: {db : new Db()}`, where 'db' will be the named parameter:
    args: Record<string, any>;
    methods?: (keyof Methods)[];
    allMethods?: boolean;
  }[];
  // for jwt verification (only http):
  auth?: {
    key?: CryptoKey;
    methods?: (keyof Methods)[];
    allMethods?: boolean;
  };
};

export async function respond(
  methods: Methods,
  req: Request,
  {
    headers = new Headers(),
    publicErrorStack = false,
    enableInternalMethods = false,
    proto = "http",
    cors = false,
    additionalArguments = [],
    auth = {},
  }: Options = {},
) {
  switch (proto) {
    case "http":
      const response = await handleHttpRequest(
        req,
        methods,
        {
          headers,
          publicErrorStack,
          enableInternalMethods,
          additionalArguments,
          proto,
          cors,
          auth,
        },
        req.headers.get("Authorization"),
      );
      return response;
      break;
    // case "ws":
    // const { conn, r: bufReader, w: bufWriter, headers: reqHeaders } = req;
    // return acceptWebSocket({
    // conn,
    // bufReader,
    // bufWriter,
    // headers: reqHeaders,
    // })
    // .then((socket: WebSocket) => {
    // const methodsAndIdsStore = new Map();
    // if (enableInternalMethods) {
    // return handleWs(
    // {
    // socket,
    // methods: { ...methods, ...internalMethods },
    // options: {
    // headers,
    // publicErrorStack,
    // enableInternalMethods,
    // additionalArguments: [...additionalArguments, {
    // args: { methodsAndIdsStore },
    // methods: ["subscribe", "unsubscribe"],
    // }],
    // proto,
    // cors,
    // auth,
    // },
    // },
    // );
    // } else {
    // return handleWs(
    // {
    // socket,
    // methods,
    // options: {
    // headers,
    // publicErrorStack,
    // enableInternalMethods,
    // additionalArguments,
    // proto,
    // cors,
    // auth,
    // },
    // },
    // );
    // }
    // })
    // .catch(async (err) => {
    // console.error(`Failed to accept websocket: ${err}`);
    // await req.respond({ status: 400 });
    // return err;
    // });
    // break;
    default:
      throw new TypeError(`The protocol '${proto}' is not supported.`);
  }
}
