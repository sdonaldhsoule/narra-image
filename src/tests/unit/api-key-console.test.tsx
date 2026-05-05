import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApiKeyConsole } from "@/components/api/api-key-console";

describe("API 控制台", () => {
  it("调用示例使用 OpenAI 兼容 Base URL", () => {
    render(
      <ApiKeyConsole
        apiBaseUrl="https://narra.example.com"
        apiConfig={{
          isEnabled: true,
          requestsPerDay: 500,
          requestsPerMinute: 20,
        }}
        apiKeys={[]}
      />,
    );

    expect(screen.getByText("https://narra.example.com/v1")).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/narra\.example\.com\/v1\/images\/generations/))
      .toBeInTheDocument();
    expect(screen.getByText(/https:\/\/narra\.example\.com\/v1\/chat\/completions/))
      .toBeInTheDocument();
    expect(screen.queryByText(/your-domain/)).not.toBeInTheDocument();
  });
});
