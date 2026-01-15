import * as PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface DeliveryNotePayload {
    no_tracking: string;
    from: { nama: string; alamat: string; phone?: string };
    to: { nama: string; alamat: string; phone?: string };
    summary: { qty: number; berat_total: number };
    signature_customer?: string;
    courier_name?: string;
    layanan?: string;
    deskripsi?: string;
    catatan?: string;
    packing?: string;
    surat_jalan_balik?: string;
    photos?: Array<{ image: string; datetime?: string; latlng?: string }>;
    no_delivery_note?: string;
    transporter_name?: string;
    vehicle_info?: string;
}

function ensurePdfDir(): string {
    const outDir = path.join(process.cwd(), 'public', 'pdf');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    return outDir;
}

// Helper function to convert file path or URL to base64
async function convertFileToBase64(filePathOrUrl: string): Promise<string | undefined> {
    try {
        // Jika sudah base64, langsung return
        if (filePathOrUrl.startsWith('data:')) {
            return filePathOrUrl;
        }

        // Jika URL HTTP/HTTPS, download dan convert ke base64
        if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
            try {
                const response = await axios.get(filePathOrUrl, {
                    responseType: 'arraybuffer',
                    timeout: 10000, // 10 detik timeout
                });

                const buffer = Buffer.from(response.data);
                // Deteksi mime type dari response header atau extension
                const contentType = response.headers['content-type'] || 'image/jpeg';
                const base64 = buffer.toString('base64');
                return `data:${contentType};base64,${base64}`;
            } catch (error) {
                console.warn(`Error downloading image from URL ${filePathOrUrl}: ${error.message}`);
                return undefined;
            }
        }

        // Jika file path lokal
        const fullPath = path.join(process.cwd(), filePathOrUrl.replace(/^\//, ''));
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
}

export async function generateDeliveryNotePDF(payload: DeliveryNotePayload): Promise<string> {
    try {
        console.log('Generating delivery note PDF with payload:', payload);

        const beratTotalDisplay = Math.round(Number(payload?.summary?.berat_total || 0));

        const fonts = {
            Roboto: {
                normal: path.join(process.cwd(), 'fonts/Roboto-Regular.ttf'),
                bold: path.join(process.cwd(), 'fonts/Roboto-Medium.ttf'),
                italics: path.join(process.cwd(), 'fonts/Roboto-Italic.ttf'),
                bolditalics: path.join(process.cwd(), 'fonts/Roboto-MediumItalic.ttf')
            }
        };

        const printer = new PdfPrinter(fonts);

        // Convert logo to base64
        const logoPath = path.join(process.cwd(), 'public', 'logo-gg-2.png');
        const logoBase64 = fs.existsSync(logoPath)
            ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
            : undefined;

        // Convert photos to base64
        const photos = payload.photos || [];
        console.log('Processing photos:', photos.length);
        const photoBlocks = await Promise.all(photos.map(async (photo, index) => {
            const convertedImage = await convertFileToBase64(photo.image);
            console.log(`Photo ${index + 1}:`, photo.image, '-> Converted:', convertedImage ? 'Yes' : 'No');
            return {
                stack: [
                    { text: `Foto ${index + 1}`, style: 'photoLabel', alignment: 'center' },
                    convertedImage ?
                        {
                            image: convertedImage,
                            width: 150,
                            height: 100,
                            alignment: 'center',
                        } :
                        { text: 'Gambar tidak tersedia', width: 150, height: 100, alignment: 'center' },
                    { text: `Waktu: ${photo.datetime || '-'}`, fontSize: 8, alignment: 'center' },
                    { text: `Lokasi: ${photo.latlng || '-'}`, fontSize: 8, alignment: 'center' },
                ],
            };
        }));

        const header = {
            columns: [
                { width: '*', stack: [logoBase64 ? { image: logoBase64, width: 90 } : {}] },
                { width: '*', alignment: 'right', text: 'SURAT JALAN KIRIM', style: 'title' },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        // Tanggal pengiriman dan layanan
        const deliveryInfo = {
            columns: [
                { width: '*', text: `Tanggal Pengiriman: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}` },
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
                { text: `Total Berat: ${beratTotalDisplay} Kg`, margin: [0, 0, 0, 8] },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        // Garis pemisah ketiga
        const divider3 = {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#1A723B' }],
            margin: [0, 0, 0, 20],
        } as any;

        // Convert signature customer jika ada
        const signatureCustomerBase64 = payload.signature_customer
            ? await convertFileToBase64(payload.signature_customer) || payload.signature_customer
            : null;

        // Section tanda tangan dalam 2 kolom
        const signatureSection = {
            columns: [
                // Kolom kiri - Tanda tangan penerima
                {
                    width: '50%',
                    stack: [
                        { text: 'DITERIMA OLEH:', bold: true, margin: [0, 0, 0, 10] },
                        ...(signatureCustomerBase64 ? [
                            { image: signatureCustomerBase64, width: 120, height: 80, margin: [0, 0, 0, 10] },
                            { text: `${payload.to.nama}`, margin: [0, 0, 0, 5] },
                        ] : [
                            { text: `${payload.to.nama}`, margin: [0, 91, 0, 5] },
                        ]),
                    ],
                },
                // Kolom kanan - Tanda tangan kurir
                {
                    width: '50%',
                    stack: [
                        { text: 'KURIR/CHECKER:', bold: true, margin: [0, 0, 0, 10] },
                        { text: `${payload.courier_name || '-'}`, margin: [0, 91, 0, 5] },
                    ],
                },
            ],
            margin: [0, 0, 0, 20],
        } as any;

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [32, 32, 32, 48],
            footer: (currentPage: number, pageCount: number) => ({ text: `Halaman ${currentPage} dari ${pageCount}`, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 16] }),
            content: [
                // Page 1 - Informasi utama
                header,
                deliveryInfo,
                divider,
                senderRecipientInfo,
                divider2,
                itemInfo,
                divider3,
                signatureSection,

                // Page 2 - Foto bukti (jika ada)
                ...(photos.length > 0 ? [
                    { text: '', pageBreak: 'after' },
                    { text: 'LAMPIRAN FOTO BUKTI PENGIRIMAN', style: 'title', alignment: 'center', margin: [0, 0, 0, 10] },
                    {
                        columns: [photoBlocks[0] || {}, photoBlocks[1] || {}, photoBlocks[2] || {}],
                        columnGap: 8,
                    },
                ] : []),
            ],
            styles: {
                title: { fontSize: 16, bold: true },
                th: { bold: true },
                sectionHeader: { fontSize: 14, bold: true, color: '#1A723B' },
                serviceType: { fontSize: 12, bold: true, color: '#1A723B' },
                photoLabel: { fontSize: 10, bold: true, margin: [0, 0, 0, 5] }
            },
            defaultStyle: { font: 'Roboto', fontSize: 10 },
        } as any;

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const outDir = ensurePdfDir();
        const fileName = `delivery-note-${payload.no_tracking}.pdf`;
        const filePath = path.join(outDir, fileName);
        const ws = fs.createWriteStream(filePath);
        pdfDoc.pipe(ws);
        pdfDoc.end();
        await new Promise<void>((res, rej) => { ws.on('finish', res); ws.on('error', rej); });
        return `/pdf/${fileName}`;
    } catch (error) {
        console.error('Error generating delivery note PDF:', error);
        throw new Error(`Failed to generate delivery note PDF: ${error.message}`);
    }
}
