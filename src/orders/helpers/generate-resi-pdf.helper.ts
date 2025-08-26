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
    const logoPath = path.join(process.cwd(), 'public/logo-gg-2.png');
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

    // Helper function untuk memotong text jika terlalu panjang
    const truncateText = (text: string, maxLength: number = 50): string => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    // Helper function untuk membuat text dengan wrapping yang lebih baik
    const createWrappedText = (text: string, maxLength: number = 60): any => {
        if (!text) return { text: '-', fontSize: 10 };

        // Untuk alamat yang sangat panjang, gunakan font size lebih kecil
        if (text.length > 100) {
            return {
                text: text,
                fontSize: 9,
                lineHeight: 1.3,
                margin: [0, 0, 0, 2]
            };
        }

        // Untuk text panjang lainnya
        if (text.length > 50) {
            return {
                text: text,
                fontSize: 9,
                lineHeight: 1.2,
                margin: [0, 0, 0, 2]
            };
        }

        // Untuk text normal
        return {
            text: text,
            fontSize: 10,
            lineHeight: 1.2,
            margin: [0, 0, 0, 2]
        };
    };

    // Helper function untuk memotong text jika benar-benar terlalu panjang
    const truncateTextForPDF = (text: string, maxLength: number = 80): string => {
        if (!text) return '-';
        if (text.length <= maxLength) return text;

        // Cari spasi terakhir sebelum maxLength
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');

        if (lastSpace > maxLength * 0.7) {
            return text.substring(0, lastSpace) + '...';
        } else {
            return truncated + '...';
        }
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
                            { text: 'Pengirim', style: 'sectionTitle' },
                            {
                                table: {
                                    widths: [80, 5, '*'],
                                    body: [
                                        ['Nama', ':', createWrappedText(data.pengirim?.nama || '-', 40)],
                                        ['Alamat', ':', createWrappedText(truncateTextForPDF(data.pengirim?.alamat || '-', 120), 50)],
                                        ['Provinsi', ':', createWrappedText(data.pengirim?.provinsi || '-', 40)],
                                        ['Kota', ':', createWrappedText(data.pengirim?.kota || '-', 40)],
                                        ['Kecamatan', ':', createWrappedText(data.pengirim?.kecamatan || '-', 40)],
                                        ['Kelurahan', ':', createWrappedText(data.pengirim?.kelurahan || '-', 40)],
                                        ['Kode Pos', ':', createWrappedText(data.pengirim?.kodepos || '-', 40)],
                                        ['No. Telp', ':', createWrappedText(data.pengirim?.telepon || '-', 40)],
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
                            { text: 'Penerima', style: 'sectionTitle' },
                            {
                                table: {
                                    widths: [80, 5, '*'],
                                    body: [
                                        ['Nama', ':', createWrappedText(data.penerima?.nama || '-', 40)],
                                        ['Alamat', ':', createWrappedText(truncateTextForPDF(data.penerima?.alamat || '-', 120), 50)],
                                        ['Provinsi', ':', createWrappedText(data.penerima?.provinsi || '-', 40)],
                                        ['Kota', ':', createWrappedText(data.penerima?.kota || '-', 40)],
                                        ['Kecamatan', ':', createWrappedText(data.penerima?.kecamatan || '-', 40)],
                                        ['Kelurahan', ':', createWrappedText(data.penerima?.kelurahan || '-', 40)],
                                        ['Kode Pos', ':', createWrappedText(data.penerima?.kodepos || '-', 40)],
                                        ['No. Telp', ':', createWrappedText(data.penerima?.telepon || '-', 40)],
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
            // INFORMASI BARANG (seperti pengirim/penerima)
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'Informasi & Detail Barang', style: 'sectionTitle' },
                            {
                                table: {
                                    widths: [80, 5, '*'],
                                    body: [
                                        ['Nama Barang', ':', createWrappedText(truncateTextForPDF(data.barang?.nama_barang || '-', 50), 30)],
                                        ['Harga Barang', ':', createWrappedText(data.barang?.harga_barang || '-', 40)],
                                        ['Asuransi', ':', createWrappedText(data.barang?.asuransi || '-', 40)],
                                        ['Packing', ':', createWrappedText(data.barang?.packing || '-', 40)],
                                        ['Surat Jalan Balik', ':', createWrappedText(data.barang?.surat_jalan_balik || '-', 40)],
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
                            {
                                table: {
                                    widths: [80, 5, '*'],
                                    body: [
                                        ['Jumlah Koli', ':', createWrappedText(data.barang?.jumlah_koli || '-', 40)],
                                        ['Berat Akt.', ':', createWrappedText(data.barang?.berat_aktual || '-', 40)],
                                        ['Volume Berat', ':', createWrappedText(data.barang?.berat_volume || '-', 40)],
                                        ['Kubikasi', ':', createWrappedText(data.barang?.kubikasi || '-', 40)],
                                        ['Catatan', ':', createWrappedText(truncateTextForPDF(data.barang?.catatan || '-', 50), 30)],
                                    ]
                                },
                                layout: 'noBorders',
                                margin: [0, 23, 0, 7],
                            },
                        ],
                    },
                ],
                columnGap: 20,
                margin: [0, 0, 0, 10],
            },
            // TABEL DIMENSI (QTY)
            {
                table: {
                    widths: [50, 80, 80, 80, 80],
                    body: ((ringkasanArr) => {
                        const header = [
                            { text: 'QTY', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'BERAT (kg)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'PANJANG (cm)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'LEBAR (cm)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                            { text: 'TINGGI (cm)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                        ];
                        const rows = Array.isArray(ringkasanArr) && ringkasanArr.length > 0
                            ? ringkasanArr.map((item) => [
                                { text: (item?.qty ?? '-').toString(), alignment: 'center', fontSize: 10 },
                                { text: (item?.berat ?? '-').toString(), alignment: 'center', fontSize: 10 },
                                { text: (item?.panjang ?? '-').toString(), alignment: 'center', fontSize: 10 },
                                { text: (item?.lebar ?? '-').toString(), alignment: 'center', fontSize: 10 },
                                { text: (item?.tinggi ?? '-').toString(), alignment: 'center', fontSize: 10 },
                            ])
                            : [[
                                { text: '-', alignment: 'center', fontSize: 10 },
                                { text: '-', alignment: 'center', fontSize: 10 },
                                { text: '-', alignment: 'center', fontSize: 10 },
                                { text: '-', alignment: 'center', fontSize: 10 },
                                { text: '-', alignment: 'center', fontSize: 10 },
                            ]];
                        return [header, ...rows];
                    })(data.ringkasan)
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
                ],
            },
        ],
        styles: {
            resiHeader: { fontSize: 16, bold: true, alignment: 'left', margin: [0, 0, 0, 0], color: '#1A723B' },
            sectionTitle: { fontSize: 12, bold: true, margin: [0, 0, 0, 10] },
            label: { fontSize: 10, alignment: 'left', margin: [0, 0, 0, 1] },
            labelRight: { fontSize: 10, alignment: 'left', margin: [30, 0, 0, 1] },
            labelColon: { fontSize: 10, alignment: 'right', margin: [0, 0, 0, 1] },
            labelWrapped: { fontSize: 10, alignment: 'left', margin: [0, 0, 0, 1], lineHeight: 1.2 },
            longText: { fontSize: 9, alignment: 'left', margin: [0, 0, 0, 1], lineHeight: 1.3 },
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