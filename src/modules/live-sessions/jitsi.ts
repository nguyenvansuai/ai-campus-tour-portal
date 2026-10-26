import { createHmac } from "node:crypto";

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export type JitsiUser = { id: string; name: string; email: string; moderator: boolean };

/** JWT HS256 theo chuẩn token auth của Jitsi (Prosody mod_auth_token). */
export function signJitsiToken(input: { appId: string; secret: string; domain: string; room: string; user: JitsiUser; expiresAt: Date; now?: Date }) {
  const now = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    aud: "jitsi",
    iss: input.appId,
    sub: input.domain,
    room: input.room,
    nbf: now - 60,
    exp: Math.floor(input.expiresAt.getTime() / 1000),
    moderator: input.user.moderator,
    context: { user: { id: input.user.id, name: input.user.name, email: input.user.email, moderator: input.user.moderator } },
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createHmac("sha256", input.secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
