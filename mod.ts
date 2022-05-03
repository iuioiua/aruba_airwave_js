function getSetCookie(headers: Headers): string {
  return headers.get("set-cookie")!.split(";")[0];
}

export interface ClientInit {
  origin: string;
  username?: string;
  password?: string;
}

export class Client {
  #origin: string;
  #username: string;
  #password: string;
  #cookie?: string;

  constructor({ origin, username, password }: ClientInit) {
    this.#origin = origin;
    this.#username = username ?? "admin";
    this.#password = password ?? "";
  }

  request(path: string, init?: RequestInit): Promise<Response> {
    const request = new Request(this.#origin + path, init);
    request.headers.set("cookie", this.#cookie!);
    return fetch(request);
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
    console.assert(response.status === 302, "Login failed");
    this.#cookie = getSetCookie(response.headers);
  }

  async logout(): Promise<void> {
    const response = await this.request("/LOGOUT", {
      method: "POST",
    });
    await response.body?.cancel();
    console.assert(response.ok, "Logout failed");
    this.#cookie = undefined;
  }
}

export async function request(
  clientInit: ClientInit,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const client = new Client(clientInit);
  await client.login();
  const response = await client.request(path, init);
  await client.logout();
  return response;
}
