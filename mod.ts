import { assert } from "./deps.ts";

/** Turns a set-cookie header into a useable cookie header value */
function getSetCookie(headers: Headers): string {
  return headers.get("set-cookie")!
    .split(", ")
    .flatMap((cookie) => cookie.split("; ")[0])
    .join("; ");
}

export interface ClientInit {
  host: string;
  username?: string;
  password?: string;
}

export class Client {
  #username: string;
  #password: string;
  #baseURL: string;
  #cookie?: string;

  constructor(init: ClientInit) {
    this.#username = init.username ??
      Deno.env.get("ARUBA_AIRWAVE_USERNAME") ?? "admin";
    this.#password = init.password ??
      Deno.env.get("ARUBA_AIRWAVE_PASSWORD") ?? "";
    this.#baseURL = "https://" + init.host;
  }

  async request(path: string, init?: RequestInit): Promise<Response> {
    const request = new Request(this.#baseURL + path, init);
    request.headers.set("cookie", this.#cookie!);
    return await fetch(request);
  }

  async login(): Promise<void> {
    const body = new FormData();
    body.set("destination", "/");
    body.set("credential_0", this.#username);
    body.set("credential_1", this.#password);
    const response = await this.request("/LOGIN", {
      method: "POST",
      body,
      redirect: "manual",
    });
    await response.body?.cancel();
    assert(response.status === 302, "Login failed");
    this.#cookie = getSetCookie(response.headers);
  }

  async logout(): Promise<void> {
    const response = await this.request("/LOGOUT", {
      method: "POST",
    });
    await response.body?.cancel();
    assert(response.ok, "Logout failed");
    this.#cookie = undefined;
  }

  async requestOnce(path: string, init?: RequestInit): Promise<Response> {
    await this.login();
    const response = await this.request(path, init);
    await this.logout();
    return response;
  }
}

export async function requestOnce(
  clientInit: ClientInit,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const client = new Client(clientInit);
  return await client.requestOnce(path, init);
}
