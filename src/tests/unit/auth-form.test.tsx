import { render, screen } from "@testing-library/react";

import { AuthForm } from "@/components/marketing/auth-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("注册表单", () => {
  it("支持预填邀请码，方便公开领取后直接注册", () => {
    render(<AuthForm mode="register" initialInviteCode="ABCD1234" />);

    expect(screen.getByDisplayValue("ABCD1234")).toBeInTheDocument();
  });
});
