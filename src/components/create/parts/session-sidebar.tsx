"use client";

// 左侧会话列表侧边栏。完全受控：sessions / activeSessionId 由父组件传入。
import { MessageSquare, PanelLeftClose, SquarePen, Trash2 } from "lucide-react";
import { useMemo } from "react";

import { formatSessionTime } from "../utils";
import type { SessionInfo } from "../types";

type SessionSidebarProps = {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  open: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

export function SessionSidebar({
  sessions,
  activeSessionId,
  open,
  onClose,
  onNewConversation,
  onSwitchSession,
  onDeleteSession,
}: SessionSidebarProps) {
  // 倒序展示：最新会话在最上；用 useMemo 避免每次渲染都构造新数组。
  const displaySessions = useMemo(() => [...sessions].reverse(), [sessions]);
  return (
    <>
      {/* 移动端遮罩：仅在打开时渲染，避免桌面端额外节点。 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative z-40 md:z-0 flex h-full w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-transform duration-200 ease-out`}
      >
        <div className="flex items-center gap-2 p-3 border-b border-[var(--line)]">
          <button
            onClick={onNewConversation}
            className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[var(--accent)]"
          >
            <SquarePen className="size-3.5" />
            新建对话
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--ink-soft)] transition hover:bg-[var(--surface-strong)] md:hidden"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5" style={{ scrollbarWidth: "thin" }}>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageSquare className="size-6 text-[var(--ink-soft)] opacity-30 mb-2" />
              <p className="text-xs text-[var(--ink-soft)]">暂无会话记录</p>
            </div>
          ) : (
            displaySessions.map((session) => (
              <div
                key={session.id}
                className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
                  activeSessionId === session.id
                    ? "bg-[var(--surface-strong)] ring-1 ring-[var(--line)]"
                    : "hover:bg-[var(--surface-strong)]/60"
                }`}
                onClick={() => onSwitchSession(session.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
                    {session.title || "新对话"}
                  </p>
                  <p className="text-[10px] text-[var(--ink-soft)] mt-0.5">
                    {session.generationIds.length} 轮 · {formatSessionTime(session.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`删除会话 ${session.title || "新对话"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="shrink-0 rounded-md p-1 text-[var(--ink-soft)]/40 transition group-hover:text-[var(--ink-soft)] focus:text-[var(--ink-soft)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] hover:bg-rose-50 hover:text-rose-500"
                  title="删除会话"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
