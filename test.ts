import { expect, test, describe } from "@jest/globals";

import { Int32Value, MethodKind, StringValue } from "@bufbuild/protobuf";
import {
  createRouterTransport,
  Code,
  ConnectError,
  createPromiseClient,
} from "@bufbuild/connect";

const testService = {
  typeName: "TestService",
  methods: {
    unary: {
      name: "Unary",
      I: Int32Value,
      O: StringValue,
      kind: MethodKind.Unary,
    },
  },
} as const;

function unary(): StringValue {
  throw new ConnectError("I have no words anymore.", Code.ResourceExhausted);
}

describe("client", () => {
  test("unary", async () => {
    const client = createPromiseClient(
      testService,
      createRouterTransport((router) => {
        router.rpc(testService, testService.methods.unary, unary);
      })
    );
    await expect(
      async () => await client.unary({ value: 123 })
    ).rejects.toThrow("[resource_exhausted] I have no words anymore.");
  });
});