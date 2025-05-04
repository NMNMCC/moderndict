import * as pdf from "./pdf.js";
import type Vips from "wasm-vips";
import { chafa, vips } from "./init.js";
import { promisify } from "node:util";

const imageToAnsi = promisify(chafa.imageToAnsi);

export const crop_image = (
    image: Vips.Image,
    x: number = 0,
    y: number = 0,
    width: number = image.width,
    height: number = image.height,
) => {
    const cropped = image.crop(
        Math.max(0, Math.min(x, image.width)),
        Math.max(0, Math.min(y, image.height)),
        Math.max(1, Math.min(width, image.width)),
        Math.max(1, Math.min(height, image.height)),
    );
    return cropped;
};

export const crop_image_relative = (
    image: Vips.Image,
    top_left_x: number = 0,
    top_left_y: number = 0,
    bottom_right_x: number = 0,
    bottom_right_y: number = 0,
) =>
    crop_image(
        image,
        top_left_x,
        top_left_y,
        image.width - (top_left_x + bottom_right_x),
        image.height - (top_left_y + bottom_right_y),
    );

export const optimize_image = (image_buffer: Buffer): Buffer => {
    const image = vips.Image.newFromBuffer(image_buffer);
    const buffer = Buffer.from(image.webpsaveBuffer({ Q: 50 }));
    image.delete();
    return buffer;
};

export const read_image_as_data_url = (image_buffer: Buffer) =>
    `data:image/webp;base64,${optimize_image(image_buffer).toString("base64")}`;

export const test = async () => {
    const image = await pdf.read_pdf_page_as_image(
        await pdf.read_pdf_page(await pdf.read_pdf_file("data/duden.pdf"), 0),
        300,
    );
    const cropped = crop_image_relative(vips.Image.newFromBuffer(image), 300, 300, 300, 300);
    const { ansi } = await imageToAnsi(cropped.pngsaveBuffer().buffer, {});
    console.log(ansi);
};
