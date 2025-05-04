import { command, number, option, optional, string } from "cmd-ts";
import { crop_args, input, resolution, resolve_crop_args } from "./shared.js";
import { chafa, vips } from "../utils/init.js";
import { promisify } from "node:util";
import { crop_image, crop_image_relative } from "../utils/image.js";
import { read_pdf_file, read_pdf_page, read_pdf_page_as_image } from "../utils/pdf.js";
import { writeFile } from "node:fs/promises";

const imageToAnsi = promisify(chafa.imageToAnsi);

export const crop = command({
    name: "crop",
    description: "Test page crop",
    args: {
        input,
        output: option({
            type: optional(string),
            long: "output",
            short: "o",
            description: "output file path",
        }),
        resolution,
        size: option({
            type: number,
            long: "size",
            short: "s",
            defaultValue: () => 100,
            description: "size of the preview area",
        }),
        page_index: option({
            type: number,
            long: "page-index",
            short: "p",
            defaultValue: () => 0,
            description: "page index to crop",
        }),
        ...crop_args,
    },
    handler: async (args) => {
        const { input, resolution, size, page_index, output, ...crop_args } = args;

        const pdf = await read_pdf_file(input);
        const page = await read_pdf_page(pdf, page_index);
        const image = vips.Image.newFromBuffer(await read_pdf_page_as_image(page, resolution));

        const cropped = resolve_crop_args(image, crop_args);

        const top_left = crop_image(cropped, 0, 0, size * 4, size).pngsaveBuffer().buffer;
        const bottom_right = crop_image_relative(
            cropped,
            cropped.width - size * 4,
            cropped.height - size,
        ).pngsaveBuffer().buffer;

        console.log("Top-Left:", "\n", (await imageToAnsi(top_left, {})).ansi);
        console.log("Bottom-Right:", "\n", (await imageToAnsi(bottom_right, {})).ansi);

        output && (await writeFile(output, Buffer.from(cropped.pngsaveBuffer().buffer)));
    },
});
