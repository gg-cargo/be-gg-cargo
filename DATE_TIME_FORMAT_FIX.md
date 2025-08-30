# Date Time Format Fix

## Masalah yang Ditemukan

Sebelumnya, field `tanggal` dan `waktu` di order history menggunakan format yang tidak sesuai:

```typescript
// SEBELUM - SALAH
await this.orderHistoryModel.create({
    order_id: order.id,
    status: ORDER_STATUS.DRAFT,
    tanggal: new Date(), // ❌ Menggunakan Date object
    waktu: new Date(),   // ❌ Menggunakan Date object
    remark: 'Pesanan berhasil dibuat',
    // ...
});
```

## Penyebab Masalah

1. **Field Mismatch**: Menggunakan field `tanggal` dan `waktu` yang tidak ada di database
2. **Format Tidak Sesuai**: Database mengharapkan `date` (DATEONLY) dan `time` (TIME)
3. **Type Mismatch**: Mengirim Date object ke field yang mengharapkan string

## Solusi yang Diimplementasikan

### 1. Utility Function untuk Format Tanggal dan Waktu

Dibuat utility function di `src/common/utils/date.utils.ts`:

```typescript
export function getFormattedDate(date: Date = new Date()): string {
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

export function getFormattedTime(date: Date = new Date()): string {
    return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    }); // Format HH:MM:SS
}

export function getOrderHistoryDateTime(date: Date = new Date()): { date: string; time: string } {
    return {
        date: getFormattedDate(date),
        time: getFormattedTime(date)
    };
}
```

### 2. Update Semua Order History Creation

Semua `orderHistoryModel.create()` diupdate untuk menggunakan format yang benar:

```typescript
// SESUDAH - BENAR
const { date, time } = getOrderHistoryDateTime();
await this.orderHistoryModel.create({
    order_id: order.id,
    status: ORDER_STATUS.DRAFT,
    date: date,        // ✅ Format YYYY-MM-DD
    time: time,        // ✅ Format HH:MM:SS
    remark: 'Pesanan berhasil dibuat',
    // ...
});
```

### 3. Field yang Diperbaiki

- **Field `date`**: Menggunakan format `YYYY-MM-DD` (contoh: `2024-01-15`)
- **Field `time`**: Menggunakan format `HH:MM:SS` (contoh: `14:30:25`)
- **Field `created_at`**: Tetap menggunakan Date object untuk timestamp

## Hasil Setelah Perbaikan

### Database Schema
```sql
CREATE TABLE order_histories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    date DATE,           -- Format YYYY-MM-DD
    time TIME,           -- Format HH:MM:SS
    remark TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- ... other fields
);
```

### Contoh Data
```json
{
    "id": 123,
    "order_id": 456,
    "status": "Order Created",
    "date": "2024-01-15",
    "time": "14:30:25",
    "remark": "Pesanan berhasil dibuat",
    "created_at": "2024-01-15T14:30:25.000Z"
}
```

## Endpoint yang Terpengaruh

Semua endpoint yang membuat order history:

1. **Create Order**: `POST /orders`
2. **Add Order History**: `POST /orders/:id/history`
3. **Update Order**: `PATCH /orders/:no_resi`
4. **Resolve Missing Item**: `PATCH /orders/:no_tracking/resolve-missing`
5. **Assign Driver**: `POST /orders/assign-driver`
6. **Submit Reweight**: `POST /orders/submit-reweight`
7. **Edit Reweight Request**: `POST /orders/edit-reweight-request`

## Testing

Untuk memastikan perbaikan berfungsi:

1. Buat order baru
2. Cek database `order_histories` table
3. Pastikan field `date` berisi format `YYYY-MM-DD`
4. Pastikan field `time` berisi format `HH:MM:SS`

## Catatan Penting

- **Consistency**: Semua order history sekarang menggunakan format yang konsisten
- **Database Compatibility**: Format sesuai dengan tipe data MySQL DATE dan TIME
- **Localization**: Waktu menggunakan format 24 jam sesuai standar Indonesia
- **Utility Functions**: Mudah digunakan di seluruh aplikasi untuk format yang konsisten

## Contoh Penggunaan Utility Functions

```typescript
import { getOrderHistoryDateTime, getIndonesianDate, getIndonesianTime } from '../common/utils/date.utils';

// Untuk order history
const { date, time } = getOrderHistoryDateTime();
// date: "2024-01-15"
// time: "14:30:25"

// Untuk display
const indonesianDate = getIndonesianDate();
// "15 Januari 2024"

const indonesianTime = getIndonesianTime();
// "14:30:25"
```
