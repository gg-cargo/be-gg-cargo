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

    // Barcode Code128 untuk no_tracking (no resi)
    async function generateBarcodeDataUrl(text: string): Promise<string> {
        const png: Buffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text,
            scale: 2,
            height: 8,
            includetext: false,
            paddingwidth: 2,
            paddingheight: 2,
        });
        return 'data:image/png;base64,' + png.toString('base64');
    }
    const noResiBarcode = await generateBarcodeDataUrl(order.no_tracking);

    // Autoscale: jika piece banyak, gunakan 12 label/halaman (3x4)
    const useDenseGrid = pieceIds.length > 200;
    const labelsPerPage = useDenseGrid ? 12 : 9;
    const chunks: string[][] = [];
    for (let i = 0; i < pieceIds.length; i += labelsPerPage) {
        chunks.push(pieceIds.slice(i, i + labelsPerPage));
    }

    const pagesContent: any[] = [];
    const totalPieces = pieceIds.length;

    const formatDate = (d: any) => {
        try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return String(d); }
    };

    for (const group of chunks) {
        const rows: any[] = [];
        const rowsPerPage = useDenseGrid ? 4 : 3;
        const qrFit = useDenseGrid ? 48 : 60;
        const fontBase = useDenseGrid ? 7 : 8;
        for (let r = 0; r < rowsPerPage; r++) {
            const rowCells: any[] = [];
            for (let c = 0; c < 3; c++) {
                const idx = r * 3 + c;
                const pieceId = group[idx];
                if (!pieceId) {
                    rowCells.push('');
                    continue;
                }
                const absoluteIndex = pieceIds.indexOf(pieceId);
                const paketText = `Paket: ${absoluteIndex + 1} of ${totalPieces}`;

                const cell = {
                    margin: [4, 4, 4, 4],
                    unbreakable: true,
                    table: {
                        widths: ['*'],
                        body: [
                            [{
                                columns: [
                                    { width: '*', text: `Tanggal: ${formatDate(order.created_at)}\nLayanan: ${order.layanan}\nBerat: ${order.total_berat ?? '-'} Kg\n${paketText}`, fontSize: fontBase, margin: [0, 15, 0, 0] },
                                    {
                                        width: '*', alignment: 'right', stack: [
                                            (fs.existsSync(path.join(process.cwd(), 'public/logo-gg-2.png'))
                                                ? { image: 'data:image/png;base64,' + fs.readFileSync(path.join(process.cwd(), 'public/logo-gg-2.png')).toString('base64'), width: 28, alignment: 'right', margin: [0, 0, 8, 2] }
                                                : {}),
                                            { text: `${order.no_tracking}`, fontSize: fontBase + 1, bold: true, alignment: 'right' },
                                            { image: noResiBarcode, width: (useDenseGrid ? 70 : 85), alignment: 'right', margin: [0, 2, 0, 0] },
                                        ]
                                    },
                                ]
                            }],

                            [{
                                columns: [
                                    {
                                        width: '*', stack: [
                                            { text: 'Pengirim', bold: true, fontSize: fontBase },
                                            { text: `Nama: ${order.nama_pengirim}`, fontSize: fontBase - 1 },
                                            { text: `Lokasi: ${order.alamat_pengirim}`, fontSize: fontBase - 1 },
                                        ]
                                    },
                                    {
                                        width: '*', stack: [
                                            { text: 'Penerima', bold: true, fontSize: fontBase },
                                            { text: `Nama: ${order.nama_penerima}`, fontSize: fontBase - 1 },
                                            { text: `Lokasi: ${order.alamat_penerima}`, fontSize: fontBase - 1 },
                                        ]
                                    },
                                ]
                            }],
                            [{ text: 'PIECE ID', alignment: 'center', bold: true, fontSize: fontBase }],
                            [{ qr: pieceId, fit: qrFit, alignment: 'center', margin: [0, 3, 0, 3] }],
                            [{ text: pieceId, alignment: 'center', fontSize: fontBase }],
                        ]
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0,
                        paddingLeft: () => 2,
                        paddingRight: () => 2,
                        paddingTop: () => 1,
                        paddingBottom: () => 1,
                    }
                } as any;
                rowCells.push(cell);
            }
            rows.push(rowCells);
        }
        pagesContent.push({
            table: {
                widths: ['*', '*', '*'],
                body: rows,
                heights: () => (useDenseGrid ? 180 : 240),
                dontBreakRows: true,
            },
            layout: 'noBorders',
            margin: [6, 6, 6, 6],
            pageBreak: 'after'
        });
    }
    if (pagesContent.length > 0) {
        // Hapus pageBreak pada halaman terakhir
        delete pagesContent[pagesContent.length - 1].pageBreak;
    }

    const docDefinition = {
        pageMargins: [10, 10, 10, 10],
        content: pagesContent,
        defaultStyle: { font: 'Roboto', fontSize: 9 },
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


