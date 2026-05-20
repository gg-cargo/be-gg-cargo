/** Jenis transporter (kolom users.type_transporter) */
export const TRANSPORTER_TYPES = ['mitra', 'vendor'] as const;
export type TransporterType = (typeof TRANSPORTER_TYPES)[number];
