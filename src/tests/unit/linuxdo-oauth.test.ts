import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: mockDb,
}));
vi.mock("@/lib/auth/oauth-config", () => ({
  getOAuthProvider: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    APP_URL: "https://narra.example.com",
  }),
}));

import { findOrCreateOAuthUser } from "@/lib/auth/linuxdo-oauth";

describe("LinuxDo OAuth 用户处理", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("已有 OAuth 绑定时按最早记录更新并返回用户", async () => {
    mockDb.user.findFirst.mockResolvedValue({
      avatarUrl: null,
      credits: 500,
      email: "old@linuxdo.oauth",
      id: "user-1",
      nickname: null,
      role: "USER",
    });
    mockDb.user.update.mockResolvedValue({
      avatarUrl: "https://linux.do/user_avatar/linux.do/tester/120/1.png",
      credits: 500,
      email: "old@linuxdo.oauth",
      id: "user-1",
      nickname: "Tester",
      role: "USER",
    });

    const user = await findOrCreateOAuthUser({
      active: true,
      avatar_url: "/user_avatar/linux.do/tester/{size}/1.png",
      id: 42,
      name: "Tester",
      silenced: false,
      trust_level: 2,
      username: "tester",
    });

    expect(mockDb.user.findFirst).toHaveBeenCalledWith({
      orderBy: { createdAt: "asc" },
      select: {
        avatarUrl: true,
        credits: true,
        email: true,
        id: true,
        nickname: true,
        role: true,
      },
      where: {
        oauthId: "42",
        oauthProvider: "linuxdo",
      },
    });
    expect(mockDb.user.update).toHaveBeenCalledWith({
      data: {
        avatarUrl: "https://linux.do/user_avatar/linux.do/tester/120/1.png",
        nickname: "Tester",
      },
      select: {
        avatarUrl: true,
        credits: true,
        email: true,
        id: true,
        nickname: true,
        role: true,
      },
      where: { id: "user-1" },
    });
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    expect(mockDb.user.create).not.toHaveBeenCalled();
    expect(user.id).toBe("user-1");
  });

  it("占位邮箱已存在时补充 OAuth 绑定", async () => {
    mockDb.user.findFirst.mockResolvedValue(null);
    mockDb.user.findUnique.mockResolvedValue({ id: "user-2" });
    mockDb.user.update.mockResolvedValue({
      avatarUrl: "https://avatar.example.com/2.png",
      credits: 800,
      email: "tester@linuxdo.oauth",
      id: "user-2",
      nickname: "Existing User",
      role: "USER",
    });

    const user = await findOrCreateOAuthUser({
      active: true,
      avatar_url: "https://avatar.example.com/2.png",
      id: 99,
      name: "Tester",
      silenced: false,
      trust_level: 3,
      username: "tester",
    });

    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      select: { id: true },
      where: { email: "tester@linuxdo.oauth" },
    });
    expect(mockDb.user.update).toHaveBeenCalledWith({
      data: {
        avatarUrl: "https://avatar.example.com/2.png",
        oauthId: "99",
        oauthProvider: "linuxdo",
      },
      select: {
        avatarUrl: true,
        credits: true,
        email: true,
        id: true,
        nickname: true,
        role: true,
      },
      where: { id: "user-2" },
    });
    expect(mockDb.user.create).not.toHaveBeenCalled();
    expect(user.id).toBe("user-2");
  });

  it("没有历史账号时创建新用户", async () => {
    mockDb.user.findFirst.mockResolvedValue(null);
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.user.create.mockResolvedValue({
      avatarUrl: null,
      credits: 500,
      email: "tester@linuxdo.oauth",
      id: "user-3",
      nickname: "tester",
      role: "USER",
    });

    const user = await findOrCreateOAuthUser({
      active: true,
      avatar_url: "",
      id: 7,
      name: "",
      silenced: false,
      trust_level: 1,
      username: "tester",
    });

    expect(mockDb.user.create).toHaveBeenCalledWith({
      data: {
        avatarUrl: null,
        credits: 500,
        email: "tester@linuxdo.oauth",
        nickname: "tester",
        oauthId: "7",
        oauthProvider: "linuxdo",
      },
      select: {
        avatarUrl: true,
        credits: true,
        email: true,
        id: true,
        nickname: true,
        role: true,
      },
    });
    expect(user.id).toBe("user-3");
  });
});
