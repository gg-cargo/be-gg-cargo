import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');

function ensurePdfDir(): string {
    const dir = path.join(process.cwd(), 'public/pdf');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export async function generatePickupNotePDF(payload: {
    no_tracking: string;
    from: { nama: string; alamat: string; phone?: string };
    to: { nama: string; alamat: string; phone?: string };
    summary: { qty: number; berat_total: number };
    signature_customer?: string; // base64 image or file path
    courier_name?: string;
    layanan?: string;
    deskripsi?: string;
    catatan?: string;
    packing?: string;
    surat_jalan_balik?: string;
    photos?: Array<{ image: string; datetime?: string; latlng?: string }>;
}): Promise<string> {
    try {
        console.log('Generating PDF with payload:', JSON.stringify(payload, null, 2));

        const fonts = {
            Roboto: {
                normal: path.join(process.cwd(), 'fonts/Roboto-Regular.ttf'),
                bold: path.join(process.cwd(), 'fonts/Roboto-Medium.ttf'),
                italics: path.join(process.cwd(), 'fonts/Roboto-Italic.ttf'),
                bolditalics: path.join(process.cwd(), 'fonts/Roboto-MediumItalic.ttf'),
            },
        };

        // Check if fonts exist
        for (const [name, font] of Object.entries(fonts)) {
            for (const [style, fontPath] of Object.entries(font)) {
                if (!fs.existsSync(fontPath)) {
                    console.warn(`Font not found: ${fontPath}`);
                }
            }
        }

        const printer = new PdfPrinter(fonts);

        const logoPath = path.join(process.cwd(), 'public/logo-gg-2.png');
        const logoBase64 = fs.existsSync(logoPath)
            ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
            : undefined;

        // Helper function to convert file path to base64
        const convertFileToBase64 = (filePath: string): string | undefined => {
            try {
                if (filePath.startsWith('data:')) {
                    return filePath; // Already base64
                }

                const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
                if (fs.existsSync(fullPath)) {
                    const fileBuffer = fs.readFileSync(fullPath);
                    const mimeType = path.extname(fullPath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
                    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
                } else {
                    console.warn(`File not found: ${fullPath}`);
                    return undefined;
                }
            } catch (error) {
                console.warn(`Error converting file to base64: ${error.message}`);
                return undefined;
            }
        };

        const header = {
            columns: [
                { width: '*', stack: [logoBase64 ? { image: logoBase64, width: 90 } : {}] },
                { width: '*', alignment: 'right', text: 'SURAT JALAN TERIMA', style: 'title' },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        // Tanggal pesanan dan layanan
        const orderInfo = {
            columns: [
                { width: '*', text: `Tanggal Pesanan: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}` },
                { width: '*', alignment: 'right', text: payload.layanan?.toUpperCase() || 'REGULER', style: 'serviceType' },
            ],
            margin: [0, 0, 0, 15],
        } as any;

        // Garis pemisah
        const divider = {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#1A723B' }],
            margin: [0, 0, 0, 20],
        } as any;

        // Informasi pengirim dan penerima dalam 2 kolom
        const senderRecipientInfo = {
            columns: [
                // Kolom kiri - PENGIRIM
                {
                    width: '50%',
                    stack: [
                        { text: 'PENGIRIM', style: 'sectionHeader', margin: [0, 0, 0, 15] },
                        { text: `Nama: ${payload.from.nama}`, margin: [0, 0, 0, 8] },
                        { text: `Alamat: ${payload.from.alamat}`, margin: [0, 0, 0, 8] },
                        { text: `Lokasi: ${payload.from.alamat}`, margin: [0, 0, 0, 8] },
                        { text: `Phone: ${payload.from.phone || '-'}`, margin: [0, 0, 0, 8] },
                    ],
                },
                // Kolom kanan - PENERIMA
                {
                    width: '50%',
                    stack: [
                        { text: 'PENERIMA', style: 'sectionHeader', margin: [0, 0, 0, 15] },
                        { text: `Nama: ${payload.to.nama}`, margin: [0, 0, 0, 8] },
                        { text: `Alamat: ${payload.to.alamat}`, margin: [0, 0, 0, 8] },
                        { text: `Lokasi: ${payload.to.alamat}`, margin: [0, 0, 0, 8] },
                        { text: `Phone: ${payload.to.phone || '-'}`, margin: [0, 0, 0, 8] },
                    ],
                },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        // Garis pemisah kedua
        const divider2 = {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#1A723B' }],
            margin: [0, 0, 0, 20],
        } as any;

        // Informasi barang
        const itemInfo = {
            stack: [
                { text: 'INFORMASI BARANG', style: 'sectionHeader', margin: [0, 0, 0, 15] },
                { text: `Nama Barang: ${payload.deskripsi || 'Paket'}`, margin: [0, 0, 0, 8] },
                { text: `Packing: ${payload.packing || 'Tidak'}`, margin: [0, 0, 0, 8] },
                { text: `Surat Jalan Balik: ${payload.surat_jalan_balik || 'Tidak'}`, margin: [0, 0, 0, 8] },
                { text: `Jumlah Koli: ${payload.summary.qty} of ${payload.summary.qty} Koli`, margin: [0, 0, 0, 8] },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        // Garis pemisah ketiga
        const divider3 = {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#1A723B' }],
            margin: [0, 0, 0, 20],
        } as any;

        // Section tanda tangan dalam 2 kolom
        const signatureSection = {
            columns: [
                // Kolom kiri - Tanda tangan pengirim
                {
                    width: '50%',
                    stack: [
                        { text: 'PENGIRIM', bold: true, margin: [0, 0, 0, 10] },
                        payload.signature_customer ?
                            { image: convertFileToBase64(payload.signature_customer) || payload.signature_customer, width: 160, height: 80, margin: [0, 0, 0, 10] } :
                            { text: '_________________', fontSize: 16, margin: [0, 0, 0, 10] },
                        { text: `Nama: ${payload.from.nama}`, margin: [0, 0, 0, 5] },
                    ],
                },
                // Kolom kanan - Tanda tangan kurir
                {
                    width: '50%',
                    stack: [
                        { text: 'KURIR/CHECKER', bold: true, margin: [0, 0, 0, 10] },
                        { text: `Nama: ${payload.courier_name || '-'}`, margin: [0, 91, 0, 5] },
                    ],
                },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        // Section tanggal
        const dateSection = {
            stack: [
                { text: 'TANGGAL:', bold: true, margin: [0, 0, 0, 5] },
                { text: '_________________', fontSize: 16, margin: [0, 0, 0, 10] },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        const photos = (payload.photos || []).slice(0, 3);
        const photoBlocks = photos.map((p) => {
            const imageBase64 = convertFileToBase64(p.image);
            return {
                stack: [
                    imageBase64 ?
                        { image: imageBase64, width: 170, height: 170, margin: [0, 0, 0, 4] } :
                        { text: 'Gambar tidak tersedia', width: 170, height: 170, margin: [0, 0, 0, 4], alignment: 'center' },
                    { text: `${payload.no_tracking}${p.datetime ? ' • ' + p.datetime : ''}${p.latlng ? ' • ' + p.latlng : ''}`, fontSize: 9 },
                ],
                margin: [8, 8, 8, 8],
            };
        });

        const docDefinition = {
            pageMargins: [32, 32, 32, 48],
            footer: (currentPage: number, pageCount: number) => ({ text: `Halaman ${currentPage} dari ${pageCount}`, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 16] }),
            content: [
                // Page 1 - Informasi utama
                header,
                orderInfo,
                divider,
                senderRecipientInfo,
                divider2,
                itemInfo,
                divider3,
                signatureSection,

                // Page 2 - Foto bukti (jika ada)
                ...(photos.length > 0 ? [
                    { text: '', pageBreak: 'after' },
                    { text: 'LAMPIRAN FOTO BUKTI TERIMA BARANG', style: 'title', alignment: 'center', margin: [0, 0, 0, 10] },
                    {
                        columns: [photoBlocks[0] || {}, photoBlocks[1] || {}, photoBlocks[2] || {}],
                        columnGap: 2,
                        margin: [0, 0, 80, 0],
                    },
                ] : []),
            ],
            styles: {
                title: { fontSize: 16, bold: true },
                th: { bold: true },
                sectionHeader: { fontSize: 14, bold: true, color: '#1A723B' },
                serviceType: { fontSize: 12, bold: true, color: '#1A723B' }
            },
            defaultStyle: { font: 'Roboto', fontSize: 10 },
        } as any;

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const outDir = ensurePdfDir();
        const fileName = `pickup-note-${payload.no_tracking}.pdf`;
        const filePath = path.join(outDir, fileName);
        const ws = fs.createWriteStream(filePath);
        pdfDoc.pipe(ws);
        pdfDoc.end();
        await new Promise<void>((res, rej) => { ws.on('finish', res); ws.on('error', rej); });
        return `/pdf/${fileName}`;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
}



