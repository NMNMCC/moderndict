import { z } from "zod";

export const Scanning = <E extends z.ZodTypeAny>(entry: E) =>
    z.object({
        entries: z.array(entry).describe("Dictionary entries extracted from the scanned page"),
        incomplete_entries: z
            .array(z.string().describe("The headword of the incomplete entry"))
            .nullish()
            .describe(
                "Sometimes some entries may be split across multiple pages, and this array contains the headwords of those entries. Once the entry is complete, it will be added to the `entries` array and removed from this array.",
            ),
    });

export type Scanning = z.infer<ReturnType<typeof Scanning>>;
