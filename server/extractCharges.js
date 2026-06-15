// server/extractCharges.js
// Reads an itemized medical bill (image or PDF) and returns structured charge lines.
// One vision call with a forced tool, so the output is always clean JSON.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const submitCharges = {
  name: "submit_charges",
  description: "Return the header info and itemized line items read from the bill.",
  input_schema: {
    type: "object",
    properties: {
      provider: { type: "string", description: "Provider or facility name, if shown" },
      dateOfService: { type: "string", description: "Date of service in YYYY-MM-DD, if shown" },
      lines: {
        type: "array",
        description: "One entry per charge line on the bill",
        items: {
          type: "object",
          properties: {
            code: { type: "string", description: "CPT/HCPCS code if present, else empty" },
            description: { type: "string", description: "Service description" },
            amountCents: { type: "integer", description: "Charge amount in cents, e.g. 8450 for $84.50" },
          },
          required: ["description", "amountCents"],
        },
      },
    },
    required: ["lines"],
  },
};

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

/**
 * @param {{ base64: string, mediaType: string }} file
 * @returns {Promise<{ provider?: string, dateOfService?: string, lines: Array }>}
 */
export async function extractCharges(file) {
  if (!file?.base64 || !file?.mediaType) {
    throw new Error("file with { base64, mediaType } is required");
  }

  let block;
  if (file.mediaType === "application/pdf") {
    block = { type: "document", source: { type: "base64", media_type: "application/pdf", data: file.base64 } };
  } else if (IMAGE_TYPES.has(file.mediaType)) {
    block = { type: "image", source: { type: "base64", media_type: file.mediaType, data: file.base64 } };
  } else {
    throw new Error(`unsupported media type: ${file.mediaType}`);
  }

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [submitCharges],
    tool_choice: { type: "tool", name: "submit_charges" }, // force structured output
    messages: [
      {
        role: "user",
        content: [
          block,
          {
            type: "text",
            text:
              "This is an itemized medical bill. Extract each charge as a separate line. " +
              "Report amounts in cents ($84.50 -> 8450). Include the CPT/HCPCS code only when it is " +
              "actually printed on the bill. Do not invent lines, codes, or totals that are not shown. " +
              "If the provider name or date of service is visible, include it.",
          },
        ],
      },
    ],
  });

  const call = res.content.find((b) => b.type === "tool_use");
  if (!call) throw new Error("model did not return structured charges");
  return call.input; // { provider, dateOfService, lines }
}
