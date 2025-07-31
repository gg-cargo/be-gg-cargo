import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');
import { getLogoBase64 } from '../../orders/helpers/generate-resi-pdf.helper';

export async function generateInvoicePDF(data: any): Promise<string> {
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

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    // Get logo base64
    const logoBase64 = getLogoBase64();

    // PDF content sesuai template invoice XPDC
    const docDefinition = {
        pageMargins: [32, 32, 32, 48],
        images: {
            logo: logoBase64,
        },
        content: [
            // HEADER
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            { text: 'INVOICE', style: 'invoiceHeader', margin: [0, 0, 0, 4] },
                            { text: `No. Invoice : ${data.invoice_details.no_invoice}`, fontSize: 10, margin: [0, 0, 0, 2] },
                            { text: `Tanggal : ${formatDate(data.invoice_details.tgl_invoice)}`, fontSize: 10, margin: [0, 0, 0, 8] },
                        ]
                    },
                    {
                        width: 220,
                        stack: [
                            logoBase64 ? { image: 'logo', width: 90, alignment: 'right', margin: [0, 0, 0, 2] } : {},
                            { text: 'XPDC', bold: true, fontSize: 14, alignment: 'right', margin: [0, 0, 0, 2] },
                            { text: 'PT. XENTRA PLATFORM DIGITAL CARGO', fontSize: 9, alignment: 'right', margin: [0, 0, 0, 2] },
                            { text: data.invoice_details.detail_pengiriman.layanan.toUpperCase(), bold: true, fontSize: 11, alignment: 'right', margin: [0, 8, 0, 0] },
                        ]
                    }
                ],
                columnGap: 10,
                margin: [0, 0, 0, 10],
            },
            // Garis bawah header
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1, lineColor: '#000000' },
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
                            { text: data.invoice_details.detail_pengiriman.pengirim, fontSize: 10, margin: [0, 0, 0, 2] },
                            { text: data.invoice_details.detail_pengiriman.alamat_pengirim, fontSize: 9, margin: [0, 0, 0, 8] },
                        ],
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: 'PENERIMA', style: 'sectionTitle' },
                            { text: data.invoice_details.detail_pengiriman.penerima, fontSize: 10, margin: [0, 0, 0, 2] },
                            { text: data.invoice_details.detail_pengiriman.alamat_penerima, fontSize: 9, margin: [0, 0, 0, 8] },
                        ],
                    },
                ],
                columnGap: 20,
                margin: [0, 0, 0, 15],
            },
            // Garis bawah section
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1, lineColor: '#000000' },
                ],
                margin: [0, 2, 0, 10],
            },
            // TABEL ITEM
            {
                table: {
                    widths: ['*', 'auto', 'auto', 'auto'],
                    body: [
                        [
                            { text: 'DESKRIPSI', style: 'tableHeader', fillColor: '#f0f0f0' },
                            { text: 'UOM', style: 'tableHeader', fillColor: '#f0f0f0', alignment: 'center' },
                            { text: 'UNIT PRICE', style: 'tableHeader', fillColor: '#f0f0f0', alignment: 'right' },
                            { text: 'TOTAL HARGA', style: 'tableHeader', fillColor: '#f0f0f0', alignment: 'right' },
                        ],
                        ...data.invoice_details.item_tagihan.map((item: any) => [
                            { text: item.deskripsi, fontSize: 9 },
                            { text: `${item.qty} ${item.uom}`, fontSize: 9, alignment: 'center' },
                            { text: formatCurrency(item.harga_satuan), fontSize: 9, alignment: 'right' },
                            { text: formatCurrency(item.total), fontSize: 9, alignment: 'right' },
                        ])
                    ],
                },
                layout: 'lightHorizontalLines',
                margin: [0, 0, 0, 10],
            },
            // SUMMARY CHARGES
            {
                columns: [
                    { width: '*', text: '' },
                    {
                        width: 'auto',
                        stack: [
                            {
                                table: {
                                    widths: ['auto', 'auto'],
                                    body: [
                                        ['Subtotal', formatCurrency(data.invoice_details.subtotal_layanan)],
                                        ['PPH 23', `(${formatCurrency(data.invoice_details.pph)})`],
                                        ['PPN', formatCurrency(data.invoice_details.ppn)],
                                        ['TOTAL', formatCurrency(data.invoice_details.total_akhir_tagihan)],
                                    ],
                                },
                                layout: 'noBorders',
                            },
                        ],
                        alignment: 'right',
                    },
                ],
                margin: [0, 0, 0, 15],
            },
            // Garis bawah summary
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1, lineColor: '#000000' },
                ],
                margin: [0, 2, 0, 10],
            },
            // BANK INFORMATION
            {
                stack: [
                    { text: 'Nama Bank : ' + data.invoice_details.info_rekening_bank.nama_bank, fontSize: 9, margin: [0, 0, 0, 2] },
                    { text: 'Nama Rekening : ' + data.invoice_details.info_rekening_bank.nama_pemilik_rek, fontSize: 9, margin: [0, 0, 0, 2] },
                    { text: 'No. Rekening : ' + data.invoice_details.info_rekening_bank.no_rekening, fontSize: 9, margin: [0, 0, 0, 2] },
                    { text: 'Kode Swift : ' + data.invoice_details.info_rekening_bank.swift_code, fontSize: 9, margin: [0, 0, 0, 2] },
                    { text: 'Notes : ', fontSize: 9, margin: [0, 0, 0, 8] },
                ],
                margin: [0, 0, 0, 15],
            },
            // FOOTER
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            { text: 'Invoice ini sah dan diproses oleh komputer', fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: 'Silahkan hubungi Customer Service apabila kamu membutuhkan bantuan.', fontSize: 8 },
                        ],
                    },
                    {
                        width: 'auto',
                        stack: [
                            { text: 'PT. XENTRA PLATFORM DIGITAL CARGO', fontSize: 9, bold: true, alignment: 'right', margin: [0, 0, 0, 2] },
                            { text: 'Generated by system, no signature required', fontSize: 8, alignment: 'right' },
                        ],
                    },
                ],
                margin: [0, 0, 0, 5],
            },
            // Page number
            {
                text: 'Halaman 1 dari 1',
                alignment: 'center',
                fontSize: 8,
                margin: [0, 10, 0, 0],
            },
        ],
        styles: {
            invoiceHeader: { fontSize: 18, bold: true, alignment: 'left', margin: [0, 0, 0, 0] },
            sectionTitle: { fontSize: 11, bold: true, margin: [0, 0, 0, 5] },
            tableHeader: { bold: true, fontSize: 9, alignment: 'center' },
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10,
        },
    };

    try {
        // Buat PDF
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const fileName = `invoice-${data.invoice_details.no_invoice}.pdf`;
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