import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');

function ensurePdfDir(): string {
    const dir = path.join(process.cwd(), 'public/pdf');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

export async function generateDeliveryNotePDF(payload: {
    no_delivery_note: string;
    from_hub: { nama: string; alamat: string } | null;
    to_hub: { nama: string; alamat: string } | null;
    transporter: { nama: string; jenis_kendaraan: string; no_polisi: string };
    summary: { qty: number; berat_total: number };
    orders: Array<{ no_tracking: string; nama_pengirim: string; nama_penerima: string; jumlah_koli: number; berat_barang: number; }>;
    nama_transporter?: string;
}): Promise<string> {
    const fonts = {
        Roboto: {
            normal: path.join(process.cwd(), 'fonts/Roboto-Regular.ttf'),
            bold: path.join(process.cwd(), 'fonts/Roboto-Medium.ttf'),
            italics: path.join(process.cwd(), 'fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(process.cwd(), 'fonts/Roboto-MediumItalic.ttf'),
        },
    };

    // Validate fonts exist
    for (const k of Object.keys(fonts.Roboto)) {
        const p = (fonts.Roboto as any)[k];
        if (!fs.existsSync(p)) {
            throw new Error(`Font file not found: ${p}`);
        }
    }

    const printer = new PdfPrinter(fonts);

    // Try load logo
    const logoPath = path.join(process.cwd(), 'public/logo-gg-2.png');
    const logoBase64 = fs.existsSync(logoPath)
        ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
        : undefined;

    const headerTop = {
        columns: [
            {
                width: '*',
                stack: [
                    logoBase64 ? { image: logoBase64, width: 90, margin: [0, 0, 0, 8] } : {},
                    { text: 'From', bold: true, margin: [0, 0, 0, 2] },
                    { text: `${payload.from_hub?.nama || '-'}`, fontSize: 11, bold: true },
                    { text: `${payload.from_hub?.alamat || ''}`, fontSize: 10, margin: [0, 0, 0, 10] },
                    { text: 'To', bold: true, margin: [0, 0, 0, 2] },
                    { text: `${payload.to_hub?.nama || '-'}`, fontSize: 11, bold: true },
                    { text: `${payload.to_hub?.alamat || ''}`, fontSize: 10 },
                ]
            },
            {
                width: '*',
                alignment: 'right',
                stack: [
                    { text: 'DELIVERY NOTE', style: 'title', margin: [0, 30, 0, 50] },
                    {
                        table: {
                            widths: [120, '*'],
                            margin: [0, 40, 0, 0],
                            body: [
                                [{ text: 'No.', style: 'kvLabel' }, { text: payload.no_delivery_note, style: 'kvValue' }],
                                [{ text: 'Tanggal', style: 'kvLabel' }, { text: new Date().toLocaleDateString('id-ID'), style: 'kvValue' }],
                                [{ text: 'Transporter', style: 'kvLabel' }, { text: (payload.transporter.nama || '-'), style: 'kvValue' }],
                                [{ text: 'Jenis Kendaraan', style: 'kvLabel' }, { text: (payload.transporter.jenis_kendaraan || '-'), style: 'kvValue' }],
                                [{ text: 'No. Polisi', style: 'kvLabel' }, { text: (payload.transporter.no_polisi || '-'), style: 'kvValue' }],
                            ]
                        },
                        layout: {
                            hLineWidth: () => 0,
                            vLineWidth: () => 0,
                            paddingLeft: () => 0,
                            paddingRight: () => 0,
                            paddingTop: () => 2,
                            paddingBottom: () => 2,
                        }
                    }
                ]
            }
        ],
        columnGap: 20,
        margin: [0, 0, 0, 8]
    } as any;

    const routeTable = {
        table: {
            widths: ['*', '*'],
            body: [
                [
                    { text: 'From', bold: true },
                    { text: 'To', bold: true, alignment: 'right' },
                ],
                [
                    { text: `${payload.from_hub?.nama || '-'}\n${payload.from_hub?.alamat || ''}` },
                    { text: `${payload.to_hub?.nama || '-'}\n${payload.to_hub?.alamat || ''}`, alignment: 'right' },
                ],
            ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 8]
    } as any;

    // Summary table (No, Deskripsi Barang, Qty, Berat)
    const summaryTable = {
        headerRows: 1,
        table: {
            widths: [40, '*', 60, 80],
            body: [
                [
                    { text: 'No', style: 'th', alignment: 'center', fillColor: '#C6EAD6' },
                    { text: 'Deskripsi Barang', style: 'th', fillColor: '#C6EAD6' },
                    { text: 'Qty', style: 'th', alignment: 'right', fillColor: '#C6EAD6' },
                    { text: 'Berat', style: 'th', alignment: 'right', fillColor: '#C6EAD6' },
                ],
                [
                    { text: '1', alignment: 'center' },
                    { text: 'Barang' },
                    { text: String(payload.summary.qty), alignment: 'right' },
                    { text: `${payload.summary.berat_total.toFixed ? payload.summary.berat_total.toFixed(2) : payload.summary.berat_total} Kg`, alignment: 'right' },
                ],
            ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 6, 0, 10]
    } as any;

    const ordersHeader = [
        { text: 'No Tracking', style: 'th', fillColor: '#C6EAD6' },
        { text: 'Pengirim', style: 'th', fillColor: '#C6EAD6' },
        { text: 'Penerima', style: 'th', fillColor: '#C6EAD6' },
        { text: 'Jumlah Koli', style: 'th', alignment: 'right', fillColor: '#C6EAD6' },
        { text: 'Berat Barang', style: 'th', alignment: 'right', fillColor: '#C6EAD6' },
    ];

    const ordersRows = payload.orders.map((o) => [
        { text: o.no_tracking },
        { text: o.nama_pengirim || '-' },
        { text: o.nama_penerima || '-' },
        { text: String(o.jumlah_koli), alignment: 'right' },
        { text: String(o.berat_barang), alignment: 'right' },
    ]);

    const ordersTable = {
        style: 'tableBase',
        headerRows: 1,
        table: {
            widths: ['*', '*', '*', 80, 80],
            body: [ordersHeader, ...ordersRows]
        },
        layout: 'lightHorizontalLines'
    };

    const docDefinition = {
        pageMargins: [32, 32, 32, 48],
        footer: (currentPage: number, pageCount: number) => ({
            text: `Halaman ${currentPage} dari ${pageCount}`,
            alignment: 'center', fontSize: 8, margin: [0, 0, 0, 16]
        }),
        content: [
            // PAGE 1: DELIVERY NOTE
            headerTop,
            summaryTable,
            // Signature area
            {
                columns: [
                    { text: 'Dibuat oleh,', margin: [60, 16, 0, 60] },
                    { text: 'Diterima oleh,', alignment: 'right', margin: [0, 16, 70, 60] },
                ]
            },
            {
                columns: [
                    {
                        width: '50%',
                        margin: [60, 0, 0, 0],
                        stack: [
                            { text: '( nama/ttd )' },
                            { text: payload.nama_transporter || '', margin: [10, 4, 0, 0], bold: true },
                        ],
                    },
                    {
                        width: '50%',
                        margin: [0, 0, 60, 0],
                        alignment: 'right',
                        stack: [
                            { text: '( nama/ttd )', alignment: 'right', margin: [0, 0, 20, 0] },
                            { text: payload.to_hub?.nama || '', alignment: 'right', margin: [0, 4, 0, 0], bold: true },
                        ],
                    },
                ],
                margin: [0, 0, 0, 8]
            },
            { text: '', pageBreak: 'after' },

            // PAGE 2: LAMPIRAN
            { text: 'LAMPIRAN', style: 'title', alignment: 'center', margin: [0, 0, 0, 10] },
            ordersTable,
        ],
        styles: {
            title: { fontSize: 16, bold: true },
            subTitle: { fontSize: 10 },
            th: { bold: true, fontSize: 10 },
            tableBase: { fontSize: 10 },
            kvLabel: { bold: true, fontSize: 10 },
            kvValue: { fontSize: 10 },
            kvColon: { fontSize: 10 },
        },
        defaultStyle: { font: 'Roboto', fontSize: 10 },
    } as any;

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const pdfDir = ensurePdfDir();
    const fileName = `delivery-note-${payload.no_delivery_note}.pdf`;
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
