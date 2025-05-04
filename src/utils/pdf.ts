import { PDFDocument, Document, Page, Matrix, ColorSpace } from "mupdf";
import fs from "fs/promises";
import { promisify } from "util";
import { chafa } from "./init.js";

const imageToAnsi = promisify(chafa.imageToAnsi);

export const read_pdf_file = async (file_path: string): Promise<Document> =>
    PDFDocument.openDocument(await fs.readFile(file_path));

export const read_pdf_page = async (pdf: Document, page_index: number): Promise<Page> => pdf.loadPage(page_index);

export const read_pdf_page_as_image = async (page: Page, resolution: number = 300): Promise<Buffer> => {
    const pixmap = page.toPixmap(Matrix.scale(resolution / 72, resolution / 72), ColorSpace.DeviceRGB);
    const pngData = pixmap.asPNG();
    return Buffer.from(pngData);
};

export const test = async () => {
    const pdf = await read_pdf_file("data/duden.pdf");
    const page = await read_pdf_page(pdf, 0);
    const image = await read_pdf_page_as_image(page, 300);
    const { ansi } = await imageToAnsi(image.buffer, {});
    console.log(ansi);
};
