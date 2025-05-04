import { Scanning } from "../schemas/scanning.js";
import { OpenAI } from "openai";
import { read_image_as_data_url } from "../utils/image.js";
import { concat } from "../utils/concat.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const scan_config = ({
    schema,
    model,
    image,
    prev,
    prev_image,
}: {
    model: string;
    schema: z.ZodTypeAny;
    image: Buffer;
    prev?: Scanning | undefined;
    prev_image?: Buffer | undefined;
}) => {
    const is_incomplete = prev?.incomplete_entries && prev.incomplete_entries.length > 0 && prev_image;
    const result: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
        model,
        messages: [
            {
                role: "system",
                content: [
                    {
                        type: "text",
                        text:
                            `You are an experienced lexicography expert. Please analyze the following scanned dictionary page and give it in the specified structured format.\n` +
                            (is_incomplete
                                ? `Some entries on the previous page are not included because they span multiple pages. Please include them together with the entries on current page. The headwords of these entries are: ${JSON.stringify(prev.incomplete_entries?.join(", "))}`
                                : ""),
                    },
                ],
            },
            {
                role: "user",
                content: concat(
                    is_incomplete
                        ? [
                              {
                                  type: "text" as const,
                                  text: `Here is the previous page:`,
                              },
                              {
                                  type: "image_url" as const,
                                  image_url: {
                                      url: read_image_as_data_url(prev_image),
                                      detail: "high",
                                  },
                              },
                          ]
                        : undefined,
                    [
                        {
                            type: "text" as const,
                            text: "Here is current page:",
                        },
                        {
                            type: "image_url" as const,
                            image_url: {
                                url: read_image_as_data_url(image),
                                detail: "high",
                            },
                        },
                    ] satisfies OpenAI.Chat.Completions.ChatCompletionContentPart[],
                ),
            },
        ],
        temperature: 0,
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "scanning",
                schema: zodToJsonSchema(Scanning(schema)),
            },
        },
    };

    return result;
};
