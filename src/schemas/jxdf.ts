import { z } from "zod";

// 1. Define the smallest building block: Example Schema
const ExampleSchema = z.object({
    original: z.string({
        required_error: "Example original text is required", // Custom error message
        invalid_type_error: "Example original must be a string",
    }),
    translation: z.string().nullish(), // translation is an optional string
});

// 2. Define Pronunciation Schema
const PronunciationSchema = z
    .object({
        ipa: z.string().nullish(),
        audioUrl: z.string().url({ message: "Invalid audio URL format" }).nullish(), // Validate if it's a valid URL
        // Can add other pronunciation format fields as needed, e.g., sampa: z.string().nullish()
    })
    .strict() // Disallow unrecognized keys in the object
    .nullish(); // The entire pronunciation object is optional

// 3. Define Definition Schema (references ExampleSchema and PronunciationSchema)
const DefinitionSchema = z
    .object({
        text: z.string({
            required_error: "Definition text is required",
            invalid_type_error: "Definition text must be a string",
        }),
        pronunciation: PronunciationSchema, // Apply the PronunciationSchema defined above
        grammar: z.string().nullish(),
        notes: z.array(z.string()).nullish(), // notes is an optional array of strings
        examples: z.array(ExampleSchema).nullish(), // examples is an optional array of ExampleSchema
        seeAlso: z.array(z.string()).nullish(), // seeAlso is an optional array of strings
        tags: z.array(z.string()).nullish(), // tags is an optional array of strings
        etymology: z.string().nullish(), // etymology is an optional string
    })
    .strict(); // Disallow unrecognized keys in the definition object

// 4. Define Article Schema (references DefinitionSchema)
const EntrySchema = z
    .object({
        headwords: z.array(z.string()).nonempty({ message: "Headwords array cannot be empty" }), // Must have at least one headword
        definitions: z.array(DefinitionSchema).nonempty({ message: "Definitions array cannot be empty" }), // Must have at least one definition
    })
    .strict(); // Disallow unrecognized keys in the article object

// 5. Define Metadata Schema
const MetadataSchema = z
    .object({
        title: z.string({ required_error: "Metadata title is required" }),
        sourceLanguage: z
            .string({ required_error: "Source language is required" })
            .min(2, { message: "Source language code must be at least 2 characters" }), // Basic check for BCP 47 format
        targetLanguage: z
            .string({ required_error: "Target language is required" })
            .min(2, { message: "Target language code must be at least 2 characters" }), // Basic check for BCP 47 format
        version: z.string().nullish(),
        description: z.string().nullish(),
        publisher: z.string().nullish(),
        authors: z.array(z.string()).nullish(),
        lastUpdated: z
            .string()
            .datetime({ message: "Invalid datetime format, expected ISO 8601" }) // Validate ISO 8601 datetime format
            .nullish(),
        abbreviations: z
            .record(z.string({ invalid_type_error: "Abbreviation value must be a string" })) // Keys are strings, values are also strings
            .nullish(),
    })
    .strict(); // Disallow unrecognized keys in the metadata object

// 6. Define the final JDXF Schema (references MetadataSchema and ArticleSchema)
const JDXFSchema = z
    .object({
        metadata: MetadataSchema,
        entries: z.array(EntrySchema), // lexicon is an array of ArticleSchema objects
    })
    .strict(); // Disallow unrecognized keys in the root object (besides metadata and lexicon)

export type JDXF = z.infer<typeof JDXFSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type Article = z.infer<typeof EntrySchema>;
export type Definition = z.infer<typeof DefinitionSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type Pronunciation = z.infer<typeof PronunciationSchema>;

// Export Schemas for use
export { JDXFSchema, MetadataSchema, EntrySchema, DefinitionSchema, ExampleSchema, PronunciationSchema };
