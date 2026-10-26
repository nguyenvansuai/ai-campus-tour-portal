"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteStaffAction, type InviteStaffState } from "../actions";
import { ROLE_LABELS, SCOPE_LABELS } from "../labels";
import type { Role, ScopeType } from "../policy";

const initialState: InviteStaffState = { status: "idle", message: "" };
const SCOPED: Role[] = ["school_manager", "teacher"];
const selectClass = "h-12 w-full rounded-lg border border-border bg-background px-3 text-base";

export function InviteStaffForm({ roles }: { roles: Role[] }) {
  const [state, formAction, pending] = useActionState(inviteStaffAction, initialState);
  const [role, setRole] = useState<Role>(roles.includes("mentor") ? "mentor" : roles[0]!);
  const scoped = SCOPED.includes(role);
  const scopeTypes: ScopeType[] = role === "school_manager" ? ["school"] : ["school", "faculty", "class"];

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email người được mời</Label>
        <Input id="email" name="email" type="email" autoComplete="off" required />
        {state.fieldErrors?.email ? <p className="text-sm text-destructive">{state.fieldErrors.email}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Vai trò</Label>
        <select id="role" name="role" className={selectClass} value={role} onChange={(event) => setRole(event.target.value as Role)}>
          {roles.map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      {scoped ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="scopeType">Phạm vi</Label>
            <select id="scopeType" name="scopeType" className={selectClass} defaultValue="school" key={role}>
              {scopeTypes.map((value) => (
                <option key={value} value={value}>
                  {SCOPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="scopeId">Mã trường / khoa / lớp</Label>
            <Input id="scopeId" name="scopeId" required />
            <p className="text-xs text-muted-foreground">Tạm nhập mã; sẽ đổi thành ô chọn khi có module quản lý trường.</p>
            {state.fieldErrors?.scopeId ? <p className="text-sm text-destructive">{state.fieldErrors.scopeId}</p> : null}
          </div>
        </>
      ) : (
        <input type="hidden" name="scopeType" value="global" />
      )}
      {state.message ? (
        <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-green-700"}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Đang gửi…" : "Gửi lời mời"}
      </Button>
    </form>
  );
}
