import * as path from 'path';
import * as fs from 'fs';
import { fromPath } from 'pdf2pic';

function ensureImagesDir(): string {
    const dir = path.join(process.cwd(), 'public/pdf/labels');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Convert PDF pages to PNG images using GraphicsMagick
 * @param pdfPath - Path ke file PDF (e.g., "/pdf/labels-XXX.pdf")
 * @param noTracking - Nomor tracking untuk naming
 * @returns Array of image URLs
 */
export async function convertPdfToImages(pdfPath: string, noTracking: string): Promise<string[]> {
    const fullPdfPath = path.join(process.cwd(), 'public', pdfPath);

    if (!fs.existsSync(fullPdfPath)) {
        throw new Error(`PDF file not found: ${fullPdfPath}`);
    }

    const imageUrls: string[] = [];
    const imagesDir = ensureImagesDir();

    // Configure pdf2pic with GraphicsMagick
    // Thermal printer ready: 76mm x 100mm at 203 DPI (standard thermal resolution)
    // Calculation: 76mm × 203dpi / 25.4 = 607px, 100mm × 203dpi / 25.4 = 799px
    const options = {
        density: 203,           // 203 DPI - standard thermal printer resolution
        saveFilename: `label-${noTracking}`,
        savePath: imagesDir,
        format: 'png',
        width: 607,             // 76mm × 203 / 25.4 ≈ 607px
        height: 799             // 100mm × 203 / 25.4 ≈ 799px
    };

    const convert = fromPath(fullPdfPath, options);

    try {
        // Convert all pages (-1 means all pages)
        const results = await convert.bulk(-1, { responseType: 'image' });

        // Build URLs from converted images
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result && result.name) {
                // pdf2pic generates: label-{noTracking}.{pageNumber}.png
                imageUrls.push(`/pdf/labels/${result.name}`);
            }
        }

        return imageUrls;
    } catch (error) {
        console.error('Error converting PDF to images:', error);
        throw new Error(`Failed to convert PDF to images: ${error.message}`);
    }
}
