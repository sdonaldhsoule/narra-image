import { resolveGenerationProvider } from "@/lib/providers/resolve-provider";

describe("渠道解析", () => {
  it("内置渠道返回站点配置", () => {
    expect(
      resolveGenerationProvider({
        builtIn: {
          apiKey: "builtin-key",
          baseUrl: "https://provider.example.com/v1",
          model: "gpt-image-1",
        },
        custom: null,
        providerMode: "built_in",
      }),
    ).toEqual({
      apiKey: "builtin-key",
      baseUrl: "https://provider.example.com/v1",
      model: "gpt-image-1",
      providerMode: "built_in",
    });
  });

  it("自填渠道必须同时提供 key 和 baseUrl", () => {
    expect(() =>
      resolveGenerationProvider({
        builtIn: {
          apiKey: "builtin-key",
          baseUrl: "https://provider.example.com/v1",
          model: "gpt-image-1",
        },
        custom: {
          apiKey: "",
          baseUrl: "https://custom.example.com/v1",
          model: "flux-dev",
        },
        providerMode: "custom",
      }),
    ).toThrow("自填渠道配置不完整");
  });
});
