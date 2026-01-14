import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bwipjs = require('bwip-js');

export type OrderForLabels = {
    no_tracking: string;
    created_at: Date | string;
    layanan: string;
    total_berat?: number | string;
    nama_pengirim: string;
    alamat_pengirim: string;
    nama_penerima: string;
    alamat_penerima: string;
};

function ensurePdfDir(): string {
    const dir = path.join(process.cwd(), 'public/pdf');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

export async function generateOrderLabelsPDF(order: OrderForLabels, pieceIds: string[]): Promise<string> {
    const fonts = {
        Roboto: {
            normal: path.join(process.cwd(), 'fonts/Roboto-Regular.ttf'),
            bold: path.join(process.cwd(), 'fonts/Roboto-Medium.ttf'),
            italics: path.join(process.cwd(), 'fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(process.cwd(), 'fonts/Roboto-MediumItalic.ttf'),
        },
    };
    const printer = new PdfPrinter(fonts);

    // Konversi mm ke points (1mm = 2.83465 points)
    const MM_TO_POINTS = 2.83465;
    const LABEL_WIDTH_MM = 76;
    const LABEL_HEIGHT_MM = 100;
    const LABEL_WIDTH_POINTS = LABEL_WIDTH_MM * MM_TO_POINTS; // ~215.43 points
    const LABEL_HEIGHT_POINTS = LABEL_HEIGHT_MM * MM_TO_POINTS; // ~283.47 points

    // Margin konsisten untuk border luar (akan dikurangi dari content)
    const BORDER_WIDTH = 1.5; // Border tebal 1.5pt
    const INNER_MARGIN_MM = 3; // Margin dalam setelah border
    const INNER_MARGIN_POINTS = INNER_MARGIN_MM * MM_TO_POINTS; // ~8.5 points
    const CONTENT_WIDTH = LABEL_WIDTH_POINTS - (INNER_MARGIN_POINTS * 2) - (BORDER_WIDTH * 2); // Lebar konten setelah border dan margin
    const CONTENT_HEIGHT = LABEL_HEIGHT_POINTS - (INNER_MARGIN_POINTS * 2) - (BORDER_WIDTH * 2); // Tinggi konten setelah border dan margin

    // Grid vertikal tetap - Priority Mail style layout
    const HEADER_HEIGHT = 35; // Header area dengan garis pemisah tebal (logo + QR)
    const SERVICE_TITLE_HEIGHT = 20; // Service type besar (uppercase)
    const ADDRESS_HEIGHT = 80; // From/To section
    const DIVIDER_THIN = 1; // Garis tipis pemisah
    const BARCODE_SECTION_HEIGHT = CONTENT_HEIGHT - HEADER_HEIGHT - SERVICE_TITLE_HEIGHT - ADDRESS_HEIGHT - (DIVIDER_THIN * 2); // Barcode + tracking number

    // QR code size ~22-24mm untuk header
    const QR_SIZE_MM = 20;
    const QR_SIZE_POINTS = QR_SIZE_MM * MM_TO_POINTS; // ~65.2 points

    // Barcode width ~70mm
    const BARCODE_WIDTH_MM = 70;
    const BARCODE_WIDTH_POINTS = BARCODE_WIDTH_MM * MM_TO_POINTS; // ~198.4 points

    // Barcode Code128 untuk no_tracking (no resi) - optimized untuk high scannability
    async function generateBarcodeDataUrl(text: string): Promise<string> {
        const png: Buffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text,
            scale: 4, // Higher scale untuk thermal printer scannability
            height: 12, // Optimal height untuk thermal printer
            includetext: false, // No text below barcode untuk compact layout
            paddingwidth: 2,
            paddingheight: 2,
        });
        return 'data:image/png;base64,' + png.toString('base64');
    }
    const noResiBarcode = await generateBarcodeDataUrl(order.no_tracking);

    const pagesContent: any[] = [];
    const totalPieces = pieceIds.length;

    const formatDate = (d: any) => {
        try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return String(d); }
    };

    // Helper function untuk truncate text dengan ellipsis
    const truncateText = (text: string, maxLength: number): string => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    // Helper function untuk wrap alamat (max 2-3 baris)
    const wrapAddress = (address: string, maxLines: number = 3, charsPerLine: number = 30): string[] => {
        if (!address) return [];
        const words = address.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= charsPerLine) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word terlalu panjang, truncate
                    lines.push(truncateText(word, charsPerLine));
                }
                if (lines.length >= maxLines) break;
            }
        }
        if (currentLine && lines.length < maxLines) {
            lines.push(currentLine);
        }
        return lines;
    };

    // Generate 1 label per page untuk thermal printer
    for (let i = 0; i < pieceIds.length; i++) {
        const pieceId = pieceIds[i];
        const paketText = `Paket: ${i + 1} of ${totalPieces}`;

        // Logo (jika ada) - convert ke grayscale untuk thermal printer
        let logoImage: string | null = null;
        if (fs.existsSync(path.join(process.cwd(), 'public/logo-gg-2.png'))) {
            logoImage = 'data:image/png;base64,' + fs.readFileSync(path.join(process.cwd(), 'public/logo-gg-2.png')).toString('base64');
        }

        // Priority Mail style layout dengan border luar tebal
        // Pastikan konten mengisi penuh halaman dengan absolutePosition
        const labelContent: any = {
            absolutePosition: { x: 0, y: 0 },
            stack: [
                // Content dengan border dan margin dalam
                {
                    table: {
                        widths: ['*'],
                        heights: [
                            HEADER_HEIGHT,        // Header dengan garis pemisah tebal
                            SERVICE_TITLE_HEIGHT, // Service type besar
                            DIVIDER_THIN,         // Garis tipis
                            ADDRESS_HEIGHT,       // From/To section
                            DIVIDER_THIN,         // Garis tipis
                            BARCODE_SECTION_HEIGHT // Barcode + tracking number
                        ],
                        body: [
                            // Section 1: Header area dengan garis pemisah tebal
                            [{
                                stack: [
                                    {
                                        columns: [
                                            {
                                                width: '*',
                                                stack: [
                                                    ...(logoImage ? [{
                                                        image: logoImage,
                                                        width: 36,
                                                        margin: [0, 0, 0, 2],
                                                        grayscale: true
                                                    }] : []),
                                                    { text: `Tanggal: ${formatDate(order.created_at)}`, fontSize: 6, color: 'black', lineHeight: 1.1 },
                                                    { text: `Layanan: ${order.layanan}`, fontSize: 6, color: 'black', lineHeight: 1.1 },
                                                    { text: `Berat: ${order.total_berat ?? '-'} Kg`, fontSize: 6, color: 'black', lineHeight: 1.1 },
                                                    { text: paketText, fontSize: 6, color: 'black', lineHeight: 1.1 },
                                                ],
                                                margin: [0, 0, 0, 0]
                                            },
                                            {
                                                width: 'auto',
                                                alignment: 'right',
                                                stack: [
                                                    {
                                                        qr: pieceId,
                                                        fit: QR_SIZE_POINTS,
                                                        alignment: 'right',
                                                        foreground: 'black',
                                                        margin: [0, 12, 0, 0] // Margin top untuk memindahkan QR ke bawah
                                                    },
                                                    {
                                                        text: pieceId,
                                                        fontSize: 7,
                                                        bold: true,
                                                        alignment: 'center',
                                                        color: 'black',
                                                        margin: [0, 2, 0, 0] // Margin top kecil setelah QR code
                                                    }
                                                ],
                                                margin: [10, 0, 0, 0]
                                            }
                                        ],
                                        margin: [0, 0, 0, 0]
                                    },
                                    // Garis pemisah tebal di bawah header
                                    {
                                        canvas: [{
                                            type: 'line',
                                            x1: 0,
                                            y1: 0,
                                            x2: CONTENT_WIDTH,
                                            y2: 0,
                                            lineWidth: BORDER_WIDTH,
                                            lineColor: 'black'
                                        }],
                                        margin: [0, 3, 0, 0]
                                    }
                                ],
                                margin: [0, 0, 0, 0],
                                fillColor: 'white',
                                valign: 'top'
                            }],
                            // Section 2: Service Type besar (uppercase, center, bold)
                            [{
                                text: order.layanan.toUpperCase(),
                                fontSize: 13,
                                bold: true,
                                alignment: 'center',
                                color: 'black',
                                margin: [0, 3, 0, 0],
                                fillColor: 'white',
                                valign: 'middle'
                            }],
                            // Divider tipis
                            [{
                                canvas: [{
                                    type: 'line',
                                    x1: 0,
                                    y1: 0,
                                    x2: CONTENT_WIDTH,
                                    y2: 0,
                                    lineWidth: BORDER_WIDTH,
                                    lineColor: 'black'
                                }],
                                margin: [0, 0, 0, 0],
                                fillColor: 'white'
                            }],
                            // Section 3: From/To Address Section
                            [{
                                columns: [
                                    {
                                        width: '*',
                                        stack: [
                                            { text: 'Pengirim:', fontSize: 7, bold: true, color: 'black', margin: [0, 0, 0, 1] },
                                            { text: order.nama_pengirim, fontSize: 6, color: 'black', lineHeight: 1.2, margin: [0, 0, 0, 1] },
                                            ...wrapAddress(order.alamat_pengirim, 3, 28).map((line, idx) => ({
                                                text: line,
                                                fontSize: 6,
                                                color: 'black',
                                                lineHeight: 1.15,
                                                margin: [0, 0, 0, idx === 2 ? 0 : 0.5]
                                            }))
                                        ],
                                        margin: [0, 0, 3, 0]
                                    },
                                    {
                                        width: 1, // Width minimal untuk garis vertikal
                                        stack: [
                                            {
                                                canvas: [{
                                                    type: 'line',
                                                    x1: 0,
                                                    y1: 0,
                                                    x2: 0,
                                                    y2: ADDRESS_HEIGHT + 15, // Tinggi lebih besar untuk memastikan mencapai bawah
                                                    lineWidth: BORDER_WIDTH,
                                                    lineColor: 'black'
                                                }],
                                                margin: [0, -2, 0, -2] // Margin negatif kecil untuk memastikan garis mencapai atas dan bawah
                                            }
                                        ],
                                        margin: [3, 0, 3, 0], // Margin kiri dan kanan untuk spacing
                                        valign: 'top'
                                    },
                                    {
                                        width: '*',
                                        stack: [
                                            { text: 'Penerima:', fontSize: 7, bold: true, color: 'black', margin: [0, 0, 0, 1] },
                                            { text: order.nama_penerima, fontSize: 6, color: 'black', lineHeight: 1.2, margin: [0, 0, 0, 1] },
                                            ...wrapAddress(order.alamat_penerima, 3, 28).map((line, idx) => ({
                                                text: line,
                                                fontSize: 6,
                                                color: 'black',
                                                lineHeight: 1.15,
                                                margin: [0, 0, 0, idx === 2 ? 0 : 0.5]
                                            }))
                                        ],
                                        margin: [6, 0, 0, 0] // Margin kiri ditambah untuk spacing lebih baik
                                    }
                                ],
                                margin: [0, 0, 0, 0],
                                fillColor: 'white',
                                valign: 'top'
                            }],
                            // Divider tipis
                            [{
                                canvas: [{
                                    type: 'line',
                                    x1: 0,
                                    y1: 0,
                                    x2: CONTENT_WIDTH,
                                    y2: 0,
                                    lineWidth: BORDER_WIDTH,
                                    lineColor: 'black'
                                }],
                                margin: [0, 0, 0, 0],
                                fillColor: 'white'
                            }],
                            // Section 4: Barcode Code128 + Tracking Number (bottom)
                            [{
                                stack: [
                                    // Code-128 barcode full width (~70mm)
                                    {
                                        image: noResiBarcode,
                                        width: Math.min(BARCODE_WIDTH_POINTS, CONTENT_WIDTH - 5),
                                        alignment: 'center',
                                        margin: [0, 0, 0, 3]
                                    },
                                    // Tracking number besar di bawah barcode
                                    {
                                        text: `No Resi: ${order.no_tracking}`,
                                        fontSize: 8,
                                        bold: true,
                                        alignment: 'center',
                                        color: 'black',
                                        margin: [0, 2, 0, 0]
                                    }
                                ],
                                margin: [0, 0, 0, 0],
                                alignment: 'center',
                                fillColor: 'white',
                                valign: 'middle'
                            }]
                        ]
                    },
                    layout: {
                        hLineWidth: () => 0,
                        vLineWidth: () => 0,
                        paddingLeft: () => 0,
                        paddingRight: () => 0,
                        paddingTop: () => 0,
                        paddingBottom: () => 0,
                    },
                    margin: [INNER_MARGIN_POINTS + BORDER_WIDTH, INNER_MARGIN_POINTS + BORDER_WIDTH, INNER_MARGIN_POINTS + BORDER_WIDTH, INNER_MARGIN_POINTS + BORDER_WIDTH]
                }
            ]
        };

        // Tambahkan pageBreak hanya jika bukan label pertama
        if (i > 0) {
            labelContent.pageBreak = 'before';
        }
        
        pagesContent.push(labelContent);

    }

    const docDefinition = {
        pageSize: {
            width: LABEL_WIDTH_POINTS,
            height: LABEL_HEIGHT_POINTS
        },
        pageMargins: [0, 0, 0, 0], // Margin 0 karena sudah di-handle di content margin
        content: pagesContent,
        defaultStyle: {
            font: 'Roboto',
            fontSize: 5,
            color: 'black', // Monochrome: pure black & white
            lineHeight: 1.15 // Compact spacing, no large empty areas
        },
        // Settings untuk thermal printer - hitam putih, tajam
        compress: false, // Tidak compress untuk kualitas maksimal
        info: {
            title: `Labels - ${order.no_tracking}`,
            author: '99 Delivery',
        }
    } as any;

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfDir = ensurePdfDir();
    const fileName = `labels-${order.no_tracking}.pdf`;
    const filePath = path.join(pdfDir, fileName);
    const writeStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();
    await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (e) => reject(e));
    });
    return `/pdf/${fileName}`;
}


