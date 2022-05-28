import { requestOnce } from "./mod.ts";
import { assert } from "./deps.ts";

//** All environmental variables need to be defined */
Deno.test("requestOnce", async () => {
  const response = await requestOnce({
    origin: Deno.env.get("ARUBA_AIRWAVE_ORIGIN")!,
  }, "/user_info.xml");
  assert(response.ok);
  await response.body?.cancel();
});
