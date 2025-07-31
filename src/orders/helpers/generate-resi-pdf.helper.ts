import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');
const bwipjs = require('bwip-js');
import * as AWS from 'aws-sdk';

async function generateBarcodeBase64(text: string): Promise<string> {
    // Generate barcode PNG base64
    return new Promise((resolve, reject) => {
        bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 2,
            height: 20,
            includetext: false,
        }, (err, png) => {
            if (err) return reject(err);
            resolve('data:image/png;base64,' + png.toString('base64'));
        });
    });
}

export function getLogoBase64(): string | undefined {
    const logoPath = path.join(process.cwd(), 'public/logo-gg.png');
    if (fs.existsSync(logoPath)) {
        const img = fs.readFileSync(logoPath);
        return 'data:image/png;base64,' + img.toString('base64');
    }
    return undefined;
}

export async function generateResiPDF(data: any): Promise<string> {
    // Font setup pakai TTF
    const fontPaths = {
        normal: path.join(process.cwd(), 'fonts/Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'fonts/Roboto-Medium.ttf'),
        italics: path.join(process.cwd(), 'fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(process.cwd(), 'fonts/Roboto-MediumItalic.ttf'),
    };
    // Cek semua file font
    for (const key in fontPaths) {
        if (!fs.existsSync(fontPaths[key])) {
            throw new Error(`Font file not found: ${fontPaths[key]}`);
        }
    }
    const fonts = {
        Roboto: fontPaths,
    };
    let printer;
    try {
        printer = new PdfPrinter(fonts);
    } catch (err) {
        console.error('PDF FONT INIT ERROR:', err);
        throw err;
    }

    // Format tanggal
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Generate barcode base64
    const barcodeBase64 = await generateBarcodeBase64(data.no_tracking || '-');
    // Get logo base64
    const logoBase64 = getLogoBase64();

    // PDF content sesuai template profesional XPDC
    const docDefinition = {
        pageMargins: [32, 32, 32, 48],
        images: {
            logo: logoBase64,
            barcode: barcodeBase64,
        },
        background: [
            {
                text: 'GG KARGO',
                color: '#e0e0e0',
                opacity: 1,
                fontSize: 80,
                bold: true,
                absolutePosition: { x: 10, y: 350 },
                alignment: 'center',
            },
        ],
        content: [
            // HEADER mirip gambar
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            { text: 'SHIPMENT RECEIPT', style: 'resiHeader', margin: [0, 0, 0, 4] },
                            { image: 'barcode', width: 180, height: 40, margin: [0, 0, 0, 2] },
                            { text: data.no_tracking || '-', color: '#1A723B', bold: true, fontSize: 12, margin: [0, 0, 0, 2] },
                            { text: `Tgl Order : ${formatDate(data.created_at)}`, bold: true, fontSize: 10, margin: [0, 8, 0, 0] },
                        ]
                    },
                    {
                        width: 220,
                        stack: [
                            logoBase64 ? { image: 'logo', width: 90, alignment: 'right', margin: [0, 0, 0, 2] } : {},
                            { text: (data.layanan || 'REGULER').toUpperCase(), bold: true, fontSize: 11, alignment: 'right', margin: [0, 30, 0, 0] },
                        ]
                    }
                ],
                columnGap: 10,
                margin: [0, 0, 0, 10],
            },
            // Garis hijau bawah header
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 2, lineColor: '#1A723B' },
                ],
                margin: [0, 2, 0, 10],
            },
            // PENGIRIM & PENERIMA
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'PENGIRIM', style: 'sectionTitle' },
                            {
                                table: {
                                    widths: [90, 5, '*'],
                                    body: [
                                        ['Nama', ':', data.pengirim?.nama || '-'],
                                        ['Alamat', ':', data.pengirim?.alamat || '-'],
                                        ['Provinsi', ':', data.pengirim?.provinsi || '-'],
                                        ['Kota', ':', data.pengirim?.kota || '-'],
                                        ['Kecamatan', ':', data.pengirim?.kecamatan || '-'],
                                        ['Kelurahan', ':', data.pengirim?.kelurahan || '-'],
                                        ['Kode Pos', ':', data.pengirim?.kodepos || '-'],
                                        ['No. Telp', ':', data.pengirim?.telepon || '-'],
                                    ]
                                },
                                layout: 'noBorders',
                                margin: [0, 0, 0, 2],
                            },
                        ],
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: 'PENERIMA', style: 'sectionTitle' },
                            {
                                table: {
                                    widths: [90, 5, '*'],
                                    body: [
                                        ['Nama', ':', data.penerima?.nama || '-'],
                                        ['Alamat', ':', data.penerima?.alamat || '-'],
                                        ['Provinsi', ':', data.penerima?.provinsi || '-'],
                                        ['Kota', ':', data.penerima?.kota || '-'],
                                        ['Kecamatan', ':', data.penerima?.kecamatan || '-'],
                                        ['Kelurahan', ':', data.penerima?.kelurahan || '-'],
                                        ['Kode Pos', ':', data.penerima?.kodepos || '-'],
                                        ['No. Telp', ':', data.penerima?.telepon || '-'],
                                    ]
                                },
                                layout: 'noBorders',
                                margin: [0, 0, 0, 2],
                            },
                        ],
                    },
                ],
                columnGap: 20,
                margin: [0, 0, 0, 8],
            },
            // Garis abu-abu tipis bawah section
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 2, lineColor: '#1A723B' },
                ],
                margin: [0, 15, 0, 10],
            },
            // INFORMASI BARANG (tabel tanpa border)
            {
                table: {
                    widths: ['auto', '*', 'auto', '*'],
                    body: [
                        [
                            { text: 'Nama Barang', style: 'label' }, { text: data.barang?.nama_barang || '-', style: 'label' },
                            { text: 'Jumlah Koli', style: 'label' }, { text: data.barang?.jumlah_koli || '-', style: 'label' },
                        ],
                        [
                            { text: 'Harga Barang', style: 'label' }, { text: data.barang?.harga_barang || '-', style: 'label' },
                            { text: 'Berat Akt.', style: 'label' }, { text: data.barang?.berat_aktual || '-', style: 'label' },
                        ],
                        [
                            { text: 'Asuransi', style: 'label' }, { text: data.barang?.asuransi || '-', style: 'label' },
                            { text: 'Volume Berat', style: 'label' }, { text: data.barang?.berat_volume || '-', style: 'label' },
                        ],
                        [
                            { text: 'Packing', style: 'label' }, { text: data.barang?.packing || '-', style: 'label' },
                            { text: 'Kubikasi', style: 'label' }, { text: data.barang?.kubikasi || '-', style: 'label' },
                        ],
                        [
                            { text: 'Surat Jalan Balik', style: 'label' }, { text: data.barang?.surat_jalan_balik || '-', style: 'label' },
                            { text: 'Catatan', style: 'label' }, { text: data.barang?.catatan || '-', style: 'label' },
                        ],
                    ],
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 10],
            },
            // TABEL DIMENSI (QTY)
            {
                table: {
                    widths: [50, 80, 80, 80, 80],
                    body: [
                        [
                            { text: 'QTY', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'BERAT (kg)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'PANJANG (cm)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'LEBAR (cm)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'TINGGI (cm)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                        ],
                        [
                            { text: data.ringkasan?.qty || '-', alignment: 'center', fontSize: 10 },
                            { text: data.ringkasan?.berat || '-', alignment: 'center', fontSize: 10 },
                            { text: data.ringkasan?.panjang || '-', alignment: 'center', fontSize: 10 },
                            { text: data.ringkasan?.lebar || '-', alignment: 'center', fontSize: 10 },
                            { text: data.ringkasan?.tinggi || '-', alignment: 'center', fontSize: 10 },
                        ],
                    ],
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 8],
            },
            // CATATAN PENTING
            {
                text: 'Berat dan dimensi dapat berubah setelah dilakukan proses timbang dan ukur ulang.',
                italics: true,
                fontSize: 8,
                margin: [0, 0, 0, 10],
            },
            // FOOTER
            {
                absolutePosition: { x: 0, y: 750 },
                width: 520,
                stack: [
                    { text: 'Resi diproses oleh sistem GG Kargo', style: 'footerItalic' },
                    { text: 'Halaman 1 dari 1', alignment: 'center', fontSize: 9 },
                ],
            },
        ],
        styles: {
            resiHeader: { fontSize: 16, bold: true, alignment: 'left', margin: [0, 0, 0, 0], color: '#1A723B' },
            sectionTitle: { fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
            label: { fontSize: 10, alignment: 'left', margin: [0, 0, 0, 1] },
            tableHeader: { bold: true, fontSize: 10, color: '#1A723B', alignment: 'center' },
            footerTitle: { fontSize: 9, bold: true, alignment: 'center', margin: [0, 8, 0, 0] },
            footerItalic: { fontSize: 9, italics: true, alignment: 'center', margin: [0, 0, 0, 0] },
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10,
        },
    };

    try {
        // Buat PDF
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const fileName = `resi-${data.no_tracking}.pdf`;
        const filePath = path.join(process.cwd(), 'public/pdf', fileName);
        const writeStream = fs.createWriteStream(filePath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();

        // Tunggu file selesai ditulis
        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        });

        return `/pdf/${fileName}`;
    } catch (err) {
        console.error('PDF GENERATE ERROR:', err);
        throw err;
    }
} 