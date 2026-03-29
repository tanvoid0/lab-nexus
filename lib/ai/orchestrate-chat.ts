import type { Content, Part, GenerativeModel } from "@google/generative-ai";
import { AI_MAX_TOOL_ROUNDS } from "@/lib/ai/config";
import {
  geminiToolConfig,
  functionDeclarationsForRoles,
  executeRegisteredTool,
} from "@/lib/ai/tools/registry";
import type { ToolContext } from "@/lib/ai/tool-context";
import { geminiRequestSignal, withGeminiRetries } from "@/lib/ai/gemini-client";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type OrchestrateStaffChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

function contentFromTurns(messages: ChatTurn[]): Content[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }] as Part[],
  }));
}

function textFromBlockedResponse(message?: string): string {
  return message?.trim() || "The assistant could not answer (content policy or safety).";
}

export async function orchestrateStaffAssistantChat(
  model: GenerativeModel,
  messages: ChatTurn[],
  ctx: ToolContext,
): Promise<OrchestrateStaffChatResult> {
  if (!messages.length) {
    return { ok: false, error: "No messages." };
  }
  const declarations = functionDeclarationsForRoles(ctx.roles);
  const contents: Content[] = contentFromTurns(messages);
  const signal = geminiRequestSignal();

  try {
    for (let round = 0; round < AI_MAX_TOOL_ROUNDS; round++) {
      const result = await withGeminiRetries(() =>
        model.generateContent(
          {
            contents,
            tools: [{ functionDeclarations: declarations }],
            toolConfig: geminiToolConfig(),
          },
          { signal },
        ),
      );

      const response = result.response;
      const feedback = response.promptFeedback;
      if (feedback?.blockReason) {
        return {
          ok: true,
          reply: textFromBlockedResponse(feedback.blockReason),
        };
      }

      let calls: NonNullable<ReturnType<typeof response.functionCalls>>;
      try {
        calls = response.functionCalls() ?? [];
      } catch {
        return {
          ok: false,
          error: "Assistant response was blocked or incomplete.",
        };
      }

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (!parts?.length) {
        let text = "";
        try {
          text = response.text();
        } catch {
          /* empty */
        }
        if (text.trim()) {
          return { ok: true, reply: text.trim() };
        }
        return {
          ok: false,
          error: "No response from the model.",
        };
      }

      if (calls.length === 0) {
        const text = parts
          .map((p) => ("text" in p && p.text ? p.text : ""))
          .join("")
          .trim();
        if (text) {
          return { ok: true, reply: text };
        }
        try {
          const t = response.text().trim();
          if (t) return { ok: true, reply: t };
        } catch {
          /* fallthrough */
        }
        return { ok: false, error: "Empty assistant reply." };
      }

      contents.push({
        role: "model",
        parts: parts as Part[],
      });

      const responseParts: Part[] = [];
      for (const fc of calls) {
        const name = fc.name;
        const args =
          fc.args && typeof fc.args === "object" && !Array.isArray(fc.args)
            ? (fc.args as object)
            : {};
        const payload = await executeRegisteredTool(name, args, ctx);
        responseParts.push({
          functionResponse: {
            name,
            response: payload as object,
          },
        });
      }

      contents.push({
        role: "user",
        parts: responseParts,
      });
    }

    return {
      ok: false,
      error: "Tool round limit reached — try a simpler question.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Assistant request failed.";
    return { ok: false, error: msg };
  }
}
