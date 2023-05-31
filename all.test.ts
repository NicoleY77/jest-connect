import { describe, expect, it, jest } from "@jest/globals";
import {
  Code,
  ConnectError,
  createPromiseClient,
  createRouterTransport,
  PromiseClient,
  ServiceImpl,
} from "@bufbuild/connect";
import { ElizaService } from "./gen/eliza_connect";
import {
  IntroduceRequest,
  IntroduceResponse,
  SayRequest,
  SayResponse,
} from "./gen/eliza_pb";
​
// The function we want to test.
// In practice, this function would live in another file.
async function talk(client: PromiseClient<typeof ElizaService>) {
  const said: string[] = [];
  for await (const r of client.introduce({ name: "Joe" })) {
    said.push(r.sentence);
  }
  return said;
}
​
// In practice, this class would live in another file.
class Eliza implements ServiceImpl<typeof ElizaService> {
  async say(req: SayRequest): Promise<SayResponse> {
    return new SayResponse({ sentence: req.sentence });
  }
​
  async *introduce(req: IntroduceRequest) {
    yield new IntroduceResponse({ sentence: `Hey ${req.name}` });
    yield new IntroduceResponse({ sentence: `How do you do?` });
  }
​
  async *converse() {
    throw new ConnectError("not implemented", Code.Unimplemented);
  }
}
​
describe("talk()", function () {
  const eliza = new Eliza();
​
  it("should return what eliza said", async function () {
    const client = createPromiseClient(
      ElizaService,
      createRouterTransport((router) => router.service(ElizaService, eliza))
    );
    const said = await talk(client);
    expect(said.length).toBe(2);
  });
​
  it("should raise an error if eliza is out of words", async function () {
    jest
      .spyOn(eliza, "introduce")
      .mockImplementation(async function* (_req: IntroduceRequest) {
        throw new ConnectError("out of words", Code.ResourceExhausted);
      });
    const client = createPromiseClient(
      ElizaService,
      createRouterTransport((router) => router.service(ElizaService, eliza))
    );
    await expect(async () => await talk(client)).rejects.toThrow(
      "[resource_exhausted] out of words"
    );
  });
});