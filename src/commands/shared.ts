import { option, optional, number, string } from "cmd-ts";
import { crop_image, crop_image_relative } from "../utils/image.js";
import type Vips from "wasm-vips";

export const crop_args = {
    crop_x: option({
        type: optional(number),
        long: "crop-x",
        short: "x",
        description: "x-coordinate of the crop area top left corner",
    }),
    crop_y: option({
        type: optional(number),
        long: "crop-y",
        short: "y",
        description: "y-coordinate of the crop area top left corner",
    }),
    crop_width: option({
        type: optional(number),
        long: "crop-w",
        short: "w",
        description: "width of the crop area",
    }),
    crop_height: option({
        type: optional(number),
        long: "crop-h",
        short: "h",
        description: "height of the crop area",
    }),
    crop_bottom_right_x: option({
        type: optional(number),
        long: "crop-bx",
        short: "X",
        description: "x-coordinate of the crop area bottom right corner",
    }),
    crop_bottom_right_y: option({
        type: optional(number),
        long: "crop-by",
        short: "Y",
        description: "y-coordinate of the crop area bottom right corner",
    }),
};

export const input = option({
    type: string,
    long: "input",
    short: "i",
    description: "input file path",
});

export const output = option({
    type: string,
    long: "output",
    short: "o",
    description: "output file path",
});

export const resolution = option({
    type: number,
    long: "resolution",
    short: "r",
    description: "resolution of the image",
    defaultValue: () => 300,
});

export const resolve_crop_args = (
    image: Vips.Image,
    {
        crop_x,
        crop_y,
        crop_width,
        crop_height,
        crop_bottom_right_x,
        crop_bottom_right_y,
    }: Partial<{
        crop_x: number | undefined;
        crop_y: number | undefined;
        crop_width: number | undefined;
        crop_height: number | undefined;
        crop_bottom_right_x: number | undefined;
        crop_bottom_right_y: number | undefined;
    }>,
) => {
    if (crop_width || crop_height) {
        return crop_image(image, crop_x, crop_y, crop_width, crop_height);
    } else if (crop_bottom_right_x || crop_bottom_right_y) {
        return crop_image_relative(image, crop_x, crop_y, crop_bottom_right_x, crop_bottom_right_y);
    }

    return image;
};
