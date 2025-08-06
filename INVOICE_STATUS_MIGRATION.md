# Invoice Status Migration

## Overview
Sistem telah diperbarui untuk menggunakan standar `invoiceStatus` yang baru sesuai dengan ketentuan bisnis.

## Status Baru

### 1. `belum proses`
- **Deskripsi**: Order dibuat
- **Kondisi**: Order baru dibuat, belum ada proses apapun
- **Default Value**: Ya (untuk order baru)

### 2. `belum ditagih`
- **Deskripsi**: Sesudah reweight, cancel/edit
- **Kondisi**: Order sudah di-reweight atau di-cancel/edit
- **Trigger**: Setelah reweight final atau cancel order

### 3. `sudah ditagih`
- **Deskripsi**: Submit/create tagihan
- **Kondisi**: Invoice sudah dibuat dan dikirim ke customer
- **Trigger**: Setelah create invoice

### 4. `lunas`
- **Deskripsi**: Customer bayar
- **Kondisi**: Customer sudah melakukan pembayaran
- **Trigger**: Setelah payment received

## Mapping Status Lama ke Baru

| Status Lama | Status Baru | Keterangan |
|-------------|-------------|------------|
| `draft` | `belum proses` | Order baru dibuat |
| `success` | `lunas` | Payment successful |
| `billed` | `sudah ditagih` | Invoice created |
| `cancelled` | `belum ditagih` | Order cancelled |

## Implementasi

### 1. Konstanta
File: `src/common/constants/invoice-status.constants.ts`
```typescript
export const INVOICE_STATUS = {
    BELUM_PROSES: 'belum proses',
    BELUM_DITAGIH: 'belum ditagih', 
    SUDAH_DITAGIH: 'sudah ditagih',
    LUNAS: 'lunas'
} as const;
```

### 2. Penggunaan
```typescript
import { INVOICE_STATUS } from '../common/constants/invoice-status.constants';

// Contoh penggunaan
await order.update({
    invoiceStatus: INVOICE_STATUS.SUDAH_DITAGIH
});
```

## Perubahan yang Dilakukan

### 1. Finance Service
- ✅ Updated `getFinanceSummary` method
- ✅ Updated `getOrderCountsByBillingStatus` method
- ✅ Updated `getRevenueByServiceType` method
- ✅ Updated `getTopCustomersByRevenue` method
- ✅ Updated `createInvoice` method
- ✅ Updated `updateInvoice` method

### 2. Order Model
- ✅ Updated default value untuk `invoiceStatus`
- ✅ Added import konstanta

### 3. Constants
- ✅ Created `invoice-status.constants.ts`
- ✅ Added status mapping untuk backward compatibility
- ✅ Added labels dan descriptions

## Backward Compatibility

Sistem masih mendukung status lama untuk backward compatibility:
- `draft` → `belum proses`
- `success` → `lunas`
- `billed` → `sudah ditagih`
- `cancelled` → `belum ditagih`

## Testing

Untuk memastikan migrasi berhasil, test case berikut harus dijalankan:

1. **Create Order**: Status harus `belum proses`
2. **Reweight Order**: Status harus `belum ditagih`
3. **Create Invoice**: Status harus `sudah ditagih`
4. **Payment Received**: Status harus `lunas`
5. **Cancel Order**: Status harus `belum ditagih`

## Notes

- Semua referensi ke status lama sudah diperbarui ke status baru
- Konstanta tersedia untuk digunakan di seluruh aplikasi
- Backward compatibility tetap terjaga
- Dokumentasi lengkap tersedia di file ini 