"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { revokeAllSessionsAction, revokeMySessionAction, revokeRoleAction, setUserStatusAction, type ManageState } from "../actions";

const initial: ManageState = { status: "idle", message: "" };

function Feedback({ state }: { state: ManageState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
      {state.message}
    </p>
  );
}

export function UserStatusButton({ userId, status }: { userId: string; status: "active" | "suspended" }) {
  const [state, action, pending] = useActionState(setUserStatusAction, initial);
  const next = status === "active" ? "suspended" : "active";
  return (
    <form
      action={action}
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        if (next === "suspended" && !confirm("Khóa tài khoản này và đăng xuất khỏi mọi thiết bị?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={next} />
      <Button type="submit" variant="outline" disabled={pending}>
        {next === "suspended" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function RevokeRoleButton({ assignmentId, label }: { assignmentId: string; label: string }) {
  const [state, action, pending] = useActionState(revokeRoleAction, initial);
  return (
    <form
      action={action}
      className="flex flex-col items-end gap-1"
      onSubmit={(event) => {
        if (!confirm(`Thu hồi vai trò ${label}?`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button type="submit" variant="link" className="text-destructive" disabled={pending}>
        Thu hồi
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function RevokeAllSessionsButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(revokeAllSessionsAction, initial);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="outline" disabled={pending}>
        Đăng xuất khỏi mọi thiết bị
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function RevokeMySessionButton({ sessionId }: { sessionId: string }) {
  const [state, action, pending] = useActionState(revokeMySessionAction, initial);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" variant="link" className="text-destructive" disabled={pending}>
        Đăng xuất
      </Button>
      <Feedback state={state} />
    </form>
  );
}
