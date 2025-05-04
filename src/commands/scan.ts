import { command, option, optional, string, number, flag } from "cmd-ts";
import OpenAI from "openai";
import { ProxyAgent } from "proxy-agent";
import { Scanning as ScanningSchema } from "../schemas/scanning.js";
import { crop_args, input, output, resolution } from "./shared.js";
import { scan_config } from "../configs/scan.js";
import { range } from "../utils/range.js";
import { read_pdf_file, read_pdf_page, read_pdf_page_as_image } from "../utils/pdf.js";
import { JSONFilePreset } from "lowdb/node";
import { drop } from "../utils/drop.js";
import { z } from "zod";
import { EntrySchema, JDXFSchema } from "../schemas/jxdf.js";
import Vips from "wasm-vips";
import { vips } from "../utils/init.js";

export const scan = command({
    name: "scan",
    description: "Scan dictionary",
    args: {
        api_key: option({
            type: optional(string),
            long: "api-key",
            short: "k",
            defaultValue: () => process.env["API_KEY"],
        }),
        base_url: option({
            type: optional(string),
            long: "base-url",
            short: "u",
            defaultValue: () => process.env["BASE_URL"],
        }),
        model: option({
            type: string,
            long: "model",
            short: "m",
        }),
        input,
        output,
        metadata: option({
            type: optional(string),
            long: "metadata",
            short: "M",
            description: "metadata of the dictionary, in JSON format",
        }),
        // schema: option({
        //     type: optional(string),
        //     long: "schema",
        //     short: "s",
        //     description: "a zod schema module to use for scanning, should export a Entry schema",
        // }),
        page_first: option({
            type: optional(number),
            long: "page-first",
            short: "f",
            description: "page index to start scanning from, starts from 0",
        }),
        page_last: option({
            type: optional(number),
            long: "page-last",
            short: "l",
            description: "page index to end scanning at, starts from 0",
        }),
        resolution,
        ...crop_args,
        verbose: flag({
            long: "verbose",
            short: "v",
            description: "verbose mode",
            defaultValue: () => false,
        }),
    },
    handler: async ({
        api_key,
        base_url,
        input,
        output,
        model,
        // schema,
        metadata,
        page_first,
        page_last,
        resolution,
        verbose,
    }) => {
        if (!api_key) throw new Error("API key is required");
        if (!base_url) throw new Error("Base URL is required");

        const print = verbose ? console.log : drop;

        print("Loading PDF...");
        const pdf = await read_pdf_file(input);
        print(`PDF ${pdf.getMetaData("title")} loaded: ${pdf.countPages()} pages`);

        print("Loading schema...");
        const Entry = EntrySchema;
        print("Schema loaded:", Entry);
        const Dictionary = JDXFSchema;
        const Scanning = ScanningSchema(Entry);

        print("Loading database...");
        const db = await JSONFilePreset<z.infer<typeof Dictionary>>(output, {
            metadata: metadata ? JSON.parse(metadata) : {},
            entries: [],
        });
        print("Database loaded");

        print("Loading OpenAI client...");
        const client = new OpenAI({
            apiKey: api_key,
            baseURL: base_url,
            httpAgent: new ProxyAgent(),
        });
        print("OpenAI client loaded");

        let last: z.infer<typeof Scanning> | undefined;
        let last_image: Vips.Image | undefined;

        print("Scanning pages...");
        for (const page_index of range(page_first ?? 0, page_last ?? pdf.countPages() - 1)) {
            print(`Scanning page ${page_index}...`);

            print("Reading page...");
            const page = await read_pdf_page(pdf, page_index);
            print("Page read");

            print("Reading page as image...");
            const image = vips.Image.newFromBuffer(await read_pdf_page_as_image(page, resolution));
            print("Page as image read");

            print("Generating config...");
            const config = scan_config({
                schema: Entry,
                model,
                image,
                prev: last,
                prev_image: last_image,
            });
            print("Config generated:", config);

            try {
                print(`Parsing page ${page_index}...`);
                const res = await client.beta.chat.completions.parse({ ...config });

                const current: z.infer<typeof Scanning> = res.choices[0]?.message.parsed as any;
                print("Parsed:", current);

                last = current;
                last_image?.delete();
                last_image = image;

                await db.update((dict) => {
                    dict.entries.push(...current.entries);
                    return dict;
                });

                print(`Page ${page_index} scanned`);
            } catch (err) {
                console.error(err);
                print(`Error scanning page ${page_index}`);
            }
        }
    },
});
