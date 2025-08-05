# Order Status Standardization

## Overview
Sistem telah distandarisasi untuk menggunakan status order dalam Bahasa Inggris yang konsisten di seluruh aplikasi.

## Status Constants

### Available Statuses
```typescript
export const ORDER_STATUS = {
    DRAFT: 'Draft',
    READY_FOR_PICKUP: 'Ready for Pickup',
    PICKED_UP: 'Picked Up',
    IN_TRANSIT: 'In Transit',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
}
```

### Status Flow
```
Draft → Ready for Pickup → Picked Up → In Transit → Out for Delivery → Delivered
                                                           ↓
                                                    Cancelled (can happen at any stage)
```

## Database Implementation

### Tabel `orders`
- **Kolom `status`**: Menyimpan status utama dalam Bahasa Inggris
- **Default value**: `'Draft'`
- **Contoh nilai**: `'Picked Up'`, `'In Transit'`, `'Delivered'`

### Tabel `order_histories`
- **Kolom `status`**: Menyimpan status dalam Bahasa Inggris
- **Contoh nilai**: `'Picked Up'`, `'Order Created'`, `'Piece Reweighted'`

### Tabel `order_pieces`
- **Status integer mapping**:
  - `pickup_status`: 0 = Ready for Pickup, 1 = Picked Up
  - `outbound_status`: 0 = Ready for Pickup, 1 = In Transit
  - `inbound_status`: 0 = In Transit, 1 = Out for Delivery
  - `deliver_status`: 0 = Out for Delivery, 1 = Delivered

## API Implementation

### GET Endpoints
Response akan mengembalikan status dalam Bahasa Inggris:
```json
{
  "order_info": {
    "status": "In Transit"  // Bahasa Inggris
  }
}
```

### POST/PATCH Endpoints
Request dan response menggunakan status Bahasa Inggris:
```json
{
  "status": "Picked Up"  // Bahasa Inggris
}
```

## Frontend Responsibility
Frontend bertanggung jawab untuk menerjemahkan status Bahasa Inggris ke Bahasa Indonesia:
- `'Draft'` → `'Draft'`
- `'Ready for Pickup'` → `'Siap Diambil'`
- `'Picked Up'` → `'Sudah Diambil'`
- `'In Transit'` → `'Sedang Dikirim'`
- `'Out for Delivery'` → `'Dalam Pengiriman'`
- `'Delivered'` → `'Terkirim'`
- `'Cancelled'` → `'Dibatalkan'`

## Helper Functions

### `getOrderStatusFromPieces(pieces: any[])`
Fungsi untuk menentukan status order berdasarkan status pieces:
```typescript
const status = getOrderStatusFromPieces(orderPieces);
// Returns: 'Picked Up', 'In Transit', etc.
```

### `updateOrderStatusFromPieces(orderId: number, transaction: Transaction)`
Method untuk mengupdate status order berdasarkan status pieces dan menambahkan history entry.

## Validation
Semua endpoint yang menerima status harus menggunakan validasi:
```typescript
@IsIn(ORDER_STATUS_LABELS)
status?: string;
```

## Migration Notes
Jika ada data lama dengan status Bahasa Indonesia, perlu migration untuk mengkonversi ke Bahasa Inggris:
- `'Menunggu diproses'` → `'Draft'`
- `'Sudah diambil'` → `'Picked Up'`
- `'Sedang dikirim'` → `'In Transit'`
- `'Terkirim'` → `'Delivered'`
- `'Dibatalkan'` → `'Cancelled'` 