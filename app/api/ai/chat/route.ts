import { NextResponse } from "next/server";
import { z } from "zod";
import {
  RATE_WINDOW_MS,
  rateLimitIpOr429,
} from "@/lib/api/rate-limit-http";
import { auth } from "@/auth";
import { LAB_ROLES, assertAnyRole } from "@/lib/auth/roles";
import {
  AI_CHAT_RATE_LIMIT_MESSAGE,
  AI_CHAT_RATE_WINDOW_MS,
  getAiChatMaxPerIpPerWindow,
  getAiChatMaxPerUserPerWindow,
  isAiAssistantEnabled,
} from "@/lib/ai/config";
import {
  getGenerativeModelForStaffAssistant,
} from "@/lib/ai/gemini-client";
import { orchestrateStaffAssistantChat } from "@/lib/ai/orchestrate-chat";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(24_000),
      }),
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  const flood = rateLimitIpOr429(
    req,
    "api:ai:chat:preauth",
    45,
    RATE_WINDOW_MS,
  );
  if (flood) return flood;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertAnyRole(session.user.roles, LAB_ROLES);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAiAssistantEnabled()) {
    return NextResponse.json(
      {
        error:
          "Assistant is not enabled (set GEMINI_API_KEY and ensure AI_ASSISTANT_ENABLED is not false).",
      },
      { status: 503 },
    );
  }

  const ip = await getRequestIp();
  const userKey = `ai:chat:user:${session.user.id}`;
  const ipKey = `ai:chat:ip:${ip}`;
  const windowMs = AI_CHAT_RATE_WINDOW_MS;
  const userLim = rateLimit(userKey, getAiChatMaxPerUserPerWindow(), windowMs);
  if (!userLim.ok) {
    return NextResponse.json(
      {
        error: AI_CHAT_RATE_LIMIT_MESSAGE,
        code: "AI_RATE_LIMIT",
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(userLim.retryAfterMs / 1000)) },
      },
    );
  }
  const ipLim = rateLimit(ipKey, getAiChatMaxPerIpPerWindow(), windowMs);
  if (!ipLim.ok) {
    return NextResponse.json(
      {
        error: AI_CHAT_RATE_LIMIT_MESSAGE,
        code: "AI_RATE_LIMIT",
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(ipLim.retryAfterMs / 1000)) },
      },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from the user." },
      { status: 400 },
    );
  }

  try {
    const model = getGenerativeModelForStaffAssistant();
    const result = await orchestrateStaffAssistantChat(
      model,
      parsed.data.messages,
      {
        userId: session.user.id,
        roles: session.user.roles ?? [],
      },
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ reply: result.reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Assistant error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
