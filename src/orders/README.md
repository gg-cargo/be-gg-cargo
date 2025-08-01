# Orders API

## Endpoints

### 1. Update Order
**PATCH** `/orders/:no_resi`

Memperbarui detail pengiriman (order) berdasarkan nomor resi.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `no_resi` | string | Yes | Nomor resi (no_tracking) dari order yang akan diperbarui |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nama_pengirim` | string | No | Nama pengirim |
| `alamat_pengirim` | string | No | Alamat pengirim |
| `no_telepon_pengirim` | string | No | Nomor telepon pengirim |
| `nama_penerima` | string | No | Nama penerima |
| `alamat_penerima` | string | No | Alamat penerima |
| `no_telepon_penerima` | string | No | Nomor telepon penerima |
| `nama_barang` | string | No | Nama barang |
| `layanan` | string | No | Jenis layanan |
| `status` | string | No | Status order (Draft, Ready for Pickup, Picked Up, In Transit, Out for Delivery, Delivered, Cancelled) |
| `catatan` | string | No | Catatan tambahan |
| `order_pieces_update` | array | No | Array untuk update detail per piece |
| `updated_by_user_id` | number | Yes | ID user yang melakukan update |

#### Order Pieces Update Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `piece_id` | string | Yes | ID dari piece yang akan diupdate |
| `berat` | number | No | Berat piece |
| `panjang` | number | No | Panjang piece |
| `lebar` | number | No | Lebar piece |
| `tinggi` | number | No | Tinggi piece |
| `nama_barang` | string | No | Nama barang per piece |

#### Contoh Request

**Skenario 1: Mengubah Detail Penerima**
```bash
PATCH /orders/RES123456789
Content-Type: application/json

{
    "nama_penerima": "Citra Dewi Kusuma",
    "alamat_penerima": "Jl. Damai No. 5, Blok C, Jakarta",
    "no_telepon_penerima": "628765432109",
    "updated_by_user_id": 10
}
```

**Skenario 2: Mengoreksi Detail Barang**
```bash
PATCH /orders/RES123456789
Content-Type: application/json

{
    "nama_barang": "PAKET (Isi Pakaian)",
    "order_pieces_update": [
        {
            "piece_id": "PCE123-ABC",
            "berat": 5.0,
            "panjang": 55,
            "lebar": 35,
            "tinggi": 25
        },
        {
            "piece_id": "PCE123-DEF",
            "berat": 3.0,
            "panjang": 40,
            "lebar": 30,
            "tinggi": 20
        }
    ],
    "updated_by_user_id": 10
}
```

**Skenario 3: Mengubah Status**
```bash
PATCH /orders/RES123456789
Content-Type: application/json

{
    "status": "Ready for Shipment",
    "updated_by_user_id": 10
}
```

#### Response Format

```json
{
    "no_resi": "RES123456789",
    "status": "success",
    "message": "Order berhasil diperbarui",
    "updated_fields": [
        "nama_penerima",
        "alamat_penerima",
        "no_telepon_penerima",
        "piece_PCE123-ABC_berat",
        "piece_PCE123-ABC_panjang"
    ],
    "order_pieces_updated": 2
}
```

#### Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters, order cannot be updated)
- `401` - Unauthorized (JWT token required)
- `404` - Not Found (order not found)

#### Business Rules

1. **Status Restrictions**: Order dengan status 'Delivered' atau 'Cancelled' tidak dapat diperbarui
2. **Reweight Status**: Jika `reweight_status = 1`, perubahan berat/dimensi mungkin dibatasi
3. **Audit Trail**: Semua perubahan dicatat di `order_histories` table
4. **Transaction Safety**: Menggunakan database transaction untuk memastikan data consistency
5. **Auto Recalculation**: Total berat dan koli otomatis dihitung ulang jika pieces diupdate

#### Features

- **Partial Update**: Hanya field yang diubah yang akan diupdate
- **Order Pieces Update**: Dapat mengupdate detail per piece (berat, dimensi, nama barang)
- **Audit Trail**: Semua perubahan dicatat dengan user ID dan timestamp
- **Validation**: Validasi order exists, piece exists, dan business rules
- **Transaction Safety**: Menggunakan database transaction 