import * as path from 'path';
import * as fs from 'fs';

function ensureImagesDir(): string {
    const dir = path.join(process.cwd(), 'public/pdf/labels');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Convert PDF pages to PNG images
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

    // Dynamic import for ESM module
    const { pdf } = await import('pdf-to-img');

    const document = await pdf(fullPdfPath, { scale: 4.0 });
    
    let pageNum = 1;
    for await (const image of document) {
        const fileName = `label-${noTracking}-${pageNum}.png`;
        const filePath = path.join(imagesDir, fileName);
        
        // Save image buffer as PNG
        fs.writeFileSync(filePath, image);
        
        imageUrls.push(`/pdf/labels/${fileName}`);
        pageNum++;
    }
    
    return imageUrls;
}

