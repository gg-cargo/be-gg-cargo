export const INVOICE_STATUS = {
    BELUM_PROSES: 'belum proses',
    BELUM_DITAGIH: 'belum ditagih',
    SUDAH_DITAGIH: 'sudah ditagih',
    LUNAS: 'lunas',
    // Legacy status untuk backward compatibility
    DRAFT: 'draft',
    SUCCESS: 'success',
    BILLED: 'billed',
    CANCELLED: 'cancelled'
} as const;

export type InvoiceStatusType = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS = {
    [INVOICE_STATUS.BELUM_PROSES]: 'Belum Proses',
    [INVOICE_STATUS.BELUM_DITAGIH]: 'Belum Ditagih',
    [INVOICE_STATUS.SUDAH_DITAGIH]: 'Sudah Ditagih',
    [INVOICE_STATUS.LUNAS]: 'Lunas',
    [INVOICE_STATUS.DRAFT]: 'Draft',
    [INVOICE_STATUS.SUCCESS]: 'Success',
    [INVOICE_STATUS.BILLED]: 'Billed',
    [INVOICE_STATUS.CANCELLED]: 'Cancelled'
} as const;

export const INVOICE_STATUS_DESCRIPTIONS = {
    [INVOICE_STATUS.BELUM_PROSES]: 'Order dibuat',
    [INVOICE_STATUS.BELUM_DITAGIH]: 'Sesudah reweight, cancel/edit',
    [INVOICE_STATUS.SUDAH_DITAGIH]: 'Submit/create tagihan',
    [INVOICE_STATUS.LUNAS]: 'Customer bayar',
    [INVOICE_STATUS.DRAFT]: 'Draft order',
    [INVOICE_STATUS.SUCCESS]: 'Payment successful',
    [INVOICE_STATUS.BILLED]: 'Order billed',
    [INVOICE_STATUS.CANCELLED]: 'Order cancelled'
} as const;

// Mapping dari status lama ke status baru
export const INVOICE_STATUS_MAPPING = {
    'draft': INVOICE_STATUS.BELUM_PROSES,
    'success': INVOICE_STATUS.LUNAS,
    'billed': INVOICE_STATUS.SUDAH_DITAGIH,
    'cancelled': INVOICE_STATUS.BELUM_DITAGIH
} as const; 