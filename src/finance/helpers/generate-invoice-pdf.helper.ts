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

    // Format currency (default IDR: tetap angka tanpa simbol; SGD: tampil currency)
    const invoiceCurrency: string = data?.invoice_details?.currency || 'IDR';
    const formatCurrency = (amount: number) => {
        const safeAmount = Number(amount) || 0;
        if (invoiceCurrency === 'SGD') {
            return new Intl.NumberFormat('en-SG', {
                style: 'currency',
                currency: 'SGD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(safeAmount);
        }
        return new Intl.NumberFormat('id-ID').format(safeAmount);
    };

    // Get logo base64
    const logoBase64 = getLogoBase64();

    // PDF content sesuai template profesional 99 Delivery
    const docDefinition = {
        pageMargins: [32, 32, 32, 48],
        images: {
            logo: logoBase64,
        },
        background: [
            {
                text: '99 Delivery',
                color: '#e0e0e0',
                opacity: 1,
                fontSize: 80,
                bold: true,
                absolutePosition: { x: 10, y: 350 },
                alignment: 'center',
            },
        ],
        content: [
            // HEADER mirip resi
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            { text: 'INVOICE', style: 'invoiceHeader', margin: [0, 0, 0, 4] },
                            { text: `No. Invoice : ${data.invoice_details.no_invoice}`, fontSize: 10, margin: [0, 0, 0, 2] },
                            { text: `Tanggal : ${formatDate(data.invoice_details.tgl_invoice)}`, fontSize: 10, margin: [0, 0, 0, 2] },
                        ],
                        margin: [0, 20, 0, 0],
                    },
                    {
                        width: 220,
                        stack: [
                            logoBase64 ? { image: 'logo', width: 90, alignment: 'right', margin: [0, 0, 0, 2] } : {},
                            { text: data.invoice_details.detail_pengiriman.layanan.toUpperCase(), bold: true, fontSize: 11, alignment: 'right', margin: [0, 8, 10, 0] },
                        ],
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
                                        ['Nama', ':', data.invoice_details.detail_pengiriman.pengirim || '-'],
                                        ['Alamat', ':', data.invoice_details.detail_pengiriman.alamat_pengirim || '-'],
                                        ['Provinsi', ':', data.invoice_details.detail_pengiriman.provinsi_pengirim || '-'],
                                        ['Kota', ':', data.invoice_details.detail_pengiriman.kota_pengirim || '-'],
                                        ['Kecamatan', ':', data.invoice_details.detail_pengiriman.kecamatan_pengirim || '-'],
                                        ['Kelurahan', ':', data.invoice_details.detail_pengiriman.kelurahan_pengirim || '-'],
                                        ['Kode Pos', ':', data.invoice_details.detail_pengiriman.kodepos_pengirim || '-'],
                                        ['No. Telp', ':', data.invoice_details.detail_pengiriman.no_telepon_pengirim || '-'],
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
                                        ['Nama', ':', data.invoice_details.detail_pengiriman.penerima || '-'],
                                        ['Alamat', ':', data.invoice_details.detail_pengiriman.alamat_penerima || '-'],
                                        ['Provinsi', ':', data.invoice_details.detail_pengiriman.provinsi_penerima || '-'],
                                        ['Kota', ':', data.invoice_details.detail_pengiriman.kota_penerima || '-'],
                                        ['Kecamatan', ':', data.invoice_details.detail_pengiriman.kecamatan_penerima || '-'],
                                        ['Kelurahan', ':', data.invoice_details.detail_pengiriman.kelurahan_penerima || '-'],
                                        ['Kode Pos', ':', data.invoice_details.detail_pengiriman.kodepos_penerima || '-'],
                                        ['No. Telp', ':', data.invoice_details.detail_pengiriman.no_telepon_penerima || '-'],
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
            // Garis hijau tipis bawah section
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 2, lineColor: '#1A723B' },
                ],
                margin: [0, 15, 0, 10],
            },
            // TABEL ITEM
            (() => {
                const isInternational = data?.invoice_details?.detail_pengiriman?.layanan === 'International';

                const headers = isInternational
                    ? [
                        { text: 'DESKRIPSI', style: 'tableHeader', fillColor: '#C6EAD6' },
                        { text: 'QTY', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                        { text: 'UOM', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                        { text: 'UNIT PRICE (IDR)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                        { text: 'TOTAL HARGA (IDR)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                        { text: 'UNIT PRICE (SGD)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                        { text: 'TOTAL (SGD)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                        { text: 'KURS (IDR/SGD)', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                    ]
                    : [
                        { text: 'DESKRIPSI', style: 'tableHeader', fillColor: '#C6EAD6' },
                        { text: 'QTY', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                        { text: 'UOM', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'center' },
                        { text: 'UNIT PRICE', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                        { text: 'TOTAL HARGA', style: 'tableHeader', fillColor: '#C6EAD6', alignment: 'right' },
                    ];

                const widths = isInternational
                    ? ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto']
                    : ['*', 'auto', 'auto', 'auto', 'auto'];

                const formatSgd = (amount: number | undefined) => {
                    if (amount === undefined || amount === null || isNaN(Number(amount))) return '-';
                    return new Intl.NumberFormat('en-SG', {
                        style: 'currency',
                        currency: 'SGD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(Number(amount));
                };

                const formatIdrNumber = (amount: number | undefined) => {
                    if (amount === undefined || amount === null || isNaN(Number(amount))) return '-';
                    return new Intl.NumberFormat('id-ID').format(Number(amount));
                };

                const body = [
                    headers,
                    ...data.invoice_details.item_tagihan.map((item: any) => {
                        const jumlahKoli = data?.invoice_details?.detail_pengiriman?.jumlah_koli;
                        const jumlahKoliText = jumlahKoli === undefined || jumlahKoli === null ? '-' : `${jumlahKoli} pcs`;
                        if (isInternational) {
                            return [
                                { text: item.deskripsi, fontSize: 9 },
                                { text: jumlahKoliText, fontSize: 9, alignment: 'center' },
                                { text: `${item.qty} ${item.uom}`, fontSize: 9, alignment: 'center' },
                                { text: formatCurrency(item.harga_satuan), fontSize: 9, alignment: 'right' },
                                { text: formatCurrency(item.total), fontSize: 9, alignment: 'right' },
                                { text: formatSgd(item.unit_price_sgd), fontSize: 9, alignment: 'right' },
                                { text: formatSgd(item.total_price_sgd), fontSize: 9, alignment: 'right' },
                                { text: formatIdrNumber(item.exchange_rate_idr), fontSize: 9, alignment: 'right' },
                            ];
                        }
                        return [
                            { text: item.deskripsi, fontSize: 9 },
                            { text: jumlahKoliText, fontSize: 9, alignment: 'center' },
                            { text: `${item.qty} ${item.uom}`, fontSize: 9, alignment: 'center' },
                            { text: formatCurrency(item.harga_satuan), fontSize: 9, alignment: 'right' },
                            { text: formatCurrency(item.total), fontSize: 9, alignment: 'right' },
                        ];
                    }),
                ];
                const filteredBody = body.filter(Boolean);

                return {
                    table: {
                        widths,
                        body: filteredBody,
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 10],
                };
            })(),
            // SUMMARY CHARGES
            {
                stack: [
                    {
                        table: {
                            widths: ['*', 'auto'],
                            body: [
                                [
                                    { text: 'Subtotal', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
                                    { text: formatCurrency(data.invoice_details.subtotal_layanan), fontSize: 10, alignment: 'right', margin: [0, 0, 0, 10] }
                                ],
                                [
                                    { text: 'PPH 23', fontSize: 10, margin: [0, 0, 0, 2] },
                                    { text: `(${formatCurrency(data.invoice_details.pph)})`, fontSize: 10, alignment: 'right', margin: [0, 0, 0, 2] }
                                ],
                                [
                                    { text: 'PPN', fontSize: 10, margin: [0, 0, 0, 2] },
                                    { text: formatCurrency(data.invoice_details.ppn), fontSize: 10, alignment: 'right', margin: [0, 0, 0, 2] }
                                ],
                                [
                                    { text: 'TOTAL', fontSize: 12, bold: true, margin: [0, 5, 0, 2] },
                                    { text: formatCurrency(data.invoice_details.total_akhir_tagihan), fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 2] }
                                ],
                            ],
                        },
                        layout: 'noBorders',
                    },
                ],
                margin: [0, 0, 0, 15],
            },
            // Garis hijau bawah summary
            {
                canvas: [
                    { type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 2, lineColor: '#1A723B' },
                ],
                margin: [0, 2, 0, 10],
            },
            // BANK INFORMATION
            {
                stack: [
                    { text: 'INFORMASI PEMBAYARAN', style: 'sectionTitle', margin: [0, 0, 0, 5] },
                    // Loop semua bank dari array info_rekening_bank
                    ...(Array.isArray(data.invoice_details.info_rekening_bank) && data.invoice_details.info_rekening_bank.length > 0
                        ? data.invoice_details.info_rekening_bank.map((bank: any, index: number) => ({
                            stack: [
                                {
                                    text: `${bank.bank_name || '-'}`,
                                    fontSize: 10,
                                    bold: true,
                                    margin: [0, index === 0 ? 0 : 10, 0, 5],
                                },
                                {
                                    table: {
                                        widths: [120, 5, '*'],
                                        body: [
                                            ['Nama Rekening', ':', bank.account_name || '-'],
                                            ['No. Rekening', ':', bank.no_account || '-'],
                                        ]
                                    },
                                    layout: 'noBorders',
                                    margin: [0, 0, 0, 2],
                                },
                            ]
                        }))
                        : [{
                            table: {
                                widths: [120, 5, '*'],
                                body: [
                                    ['Nama Bank', ':', '-'],
                                    ['Nama Rekening', ':', '-'],
                                    ['No. Rekening', ':', '-'],
                                ]
                            },
                            layout: 'noBorders',
                            margin: [0, 0, 0, 2],
                        }]
                    ),
                    // Notes (jika ada)
                    ...(data.invoice_details.notes ? [{
                        table: {
                            widths: [120, 5, '*'],
                            body: [
                                ['Notes', ':', data.invoice_details.notes || '-'],
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 10, 0, 2],
                    }] : []),
                ],
                margin: [0, 0, 0, 15],
            },
            // FOOTER INFO (mengalir setelah bank information)
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            { text: 'Invoice ini sah dan diproses oleh komputer', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: 'Silahkan hubungi Customer Service apabila kamu membutuhkan bantuan.', bold: true, fontSize: 8 },
                        ],
                        margin: [0, 70, 0, 0],
                    },
                    {
                        width: 'auto',
                        stack: [
                            { text: '99 Delivery', fontSize: 9, bold: true, alignment: 'right', margin: [0, 0, 50, 2] },
                            { text: 'Generated by system, no signature required', fontSize: 8, alignment: 'right', margin: [0, 50, 0, 0] },
                        ],
                    },
                ],
                margin: [0, 0, 0, 5],
            },
            // FOOTER
            {
                absolutePosition: { x: 0, y: 765 },
                width: 520,
                stack: [
                    { text: 'Invoice diproses oleh sistem 99 Delivery', style: 'footerItalic' },
                    { text: 'Halaman 1 dari 1', alignment: 'center', fontSize: 9 },
                ],
            },
        ],
        styles: {
            invoiceHeader: { fontSize: 24, bold: 'extrabold', alignment: 'left', margin: [0, 0, 0, 0], color: '#1A723B' },
            sectionTitle: { fontSize: 12, bold: true, margin: [0, 0, 0, 5] },
            tableHeader: { bold: true, fontSize: 10, color: '#1A723B', alignment: 'center' },
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