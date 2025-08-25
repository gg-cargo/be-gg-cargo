# Logika Update OrderShipment dalam Reweight Bulk

## Overview
Endpoint `POST /orders/pieces/bulk-reweight` sekarang mendukung operasi **UPDATE**, **DELETE**, dan **ADD** piece dengan logika advanced untuk mengelola `orderShipment` yang berelasi.

## Konsep Relasi OrderShipment vs OrderPieces

### Struktur Data:
```sql
-- orderShipment (1 record untuk setiap grup dimensi yang sama)
{
  id: 1,
  order_id: 50,
  qty: 9,           -- Total pieces dengan dimensi ini
  berat: 19,        -- Berat per piece
  panjang: 12,      -- Panjang per piece
  lebar: 15,        -- Lebar per piece
  tinggi: 17,       -- Tinggi per piece
  qty_reweight: 9,  -- Total pieces setelah reweight
  berat_reweight: 19,
  panjang_reweight: 12,
  lebar_reweight: 15,
  tinggi_reweight: 17
}

-- orderPieces (9 records dengan dimensi yang sama)
[
  { id: 331, order_id: 50, berat: 19, panjang: 12, lebar: 15, tinggi: 17 },
  { id: 332, order_id: 50, berat: 19, panjang: 12, lebar: 15, tinggi: 17 },
  ... (7 records lagi dengan dimensi sama)
]
```

## Logika Per Action

### 1. Case UPDATE 📝

**Scenario:** Update dimensi piece yang sudah ada

**Logika:**
- ✅ **Jika dimensi TIDAK berubah** → Tidak ada perubahan di `orderShipment`
- ✅ **Jika dimensi BERUBAH** → Piece keluar dari shipment lama dan masuk/buat shipment baru

**Contoh:**
```json
// Action: Update piece_id 331 dari (19kg, 12x15x17) menjadi (25kg, 20x25x30)
{
  "action": "update",
  "piece_id": 331,
  "berat": 25,
  "panjang": 20,
  "lebar": 25,
  "tinggi": 30
}
```

**Proses:**
1. **Kurangi qty** dari shipment lama (19kg, 12x15x17): `qty_reweight: 9 → 8`
2. **Cari shipment** dengan dimensi baru (25kg, 20x25x30)
   - Jika **ADA** → Tambah qty: `qty_reweight + 1`
   - Jika **TIDAK ADA** → Buat shipment baru dengan `qty_reweight: 1`

### 2. Case ADD ➕

**Scenario:** Tambah piece baru ke order

**Logika:**
- Cari shipment yang memiliki dimensi sama dengan piece baru
- Jika ada → Tambah `qty` dan `qty_reweight`
- Jika tidak ada → Buat shipment baru

**Contoh:**
```json
// Action: Tambah piece baru dengan dimensi (19kg, 12x15x17) - sama dengan shipment existing
{
  "action": "add",
  "piece_id": 333,
  "berat": 19,
  "panjang": 12,
  "lebar": 15,
  "tinggi": 17
}
```

**Proses:**
1. **Cari shipment** dengan dimensi (19kg, 12x15x17)
2. **ADA shipment** → Update: `qty: 9 → 10`, `qty_reweight: 9 → 10`

**Contoh 2:**
```json
// Action: Tambah piece baru dengan dimensi baru (30kg, 40x50x60)
{
  "action": "add",
  "berat": 30,
  "panjang": 40,
  "lebar": 50,
  "tinggi": 60
}
```

**Proses:**
1. **Cari shipment** dengan dimensi (30kg, 40x50x60)
2. **TIDAK ADA** → Buat shipment baru:
```sql
{
  order_id: 50,
  qty: 1,
  berat: 30, panjang: 40, lebar: 50, tinggi: 60,
  qty_reweight: 1,
  berat_reweight: 30, panjang_reweight: 40, lebar_reweight: 50, tinggi_reweight: 60
}
```

### 3. Case DELETE 🗑️

**Scenario:** Hapus piece dari order

**Logika:**
- Cari shipment yang sesuai dengan dimensi piece yang akan dihapus
- Kurangi `qty` dan `qty_reweight`
- Jika qty menjadi 0 → Hapus shipment

**Contoh:**
```json
// Action: Hapus piece_id 332 dengan dimensi (19kg, 12x15x17)
{
  "action": "delete",
  "piece_id": 332
}
```

**Proses:**
1. **Ambil dimensi** piece yang akan dihapus: (19kg, 12x15x17)
2. **Cari shipment** dengan dimensi tersebut
3. **Kurangi qty**: `qty: 9 → 8`, `qty_reweight: 9 → 8`
4. **Jika qty menjadi 0** → Hapus shipment sepenuhnya

## Implementasi Teknis

### Helper Functions:

1. **`updateOrderShipmentsAdvanced()`** - Koordinator utama untuk semua actions
2. **`handleUpdateShipmentForPiece()`** - Menangani logic UPDATE dengan update `shipment_id`
3. **`handleAddShipmentForPiece()`** - Menangani logic ADD dengan update `shipment_id`  
4. **`handleDeleteShipmentForPiece()`** - Menangani logic DELETE
5. **`findOrCreateShipmentForDimensions()`** - Helper untuk cari/buat shipment dan return ID
6. **`addToOrCreateShipment()`** - Helper untuk menambah qty atau buat shipment baru
7. **`reduceShipmentQty()`** - Helper untuk mengurangi qty atau hapus shipment

### Transaction Safety:
- Semua operasi dilakukan dalam **database transaction**
- Jika ada error di salah satu action → Rollback semua perubahan
- Memastikan data consistency antara `orderPieces` dan `orderShipment`

### Logika Shipment ID:

**Relasi orderPieces ↔ orderShipment:**
- Setiap `orderPiece` memiliki `shipment_id` yang merujuk ke `orderShipment`
- `orderShipment` mengelompokkan pieces dengan dimensi yang sama
- Saat dimensi piece berubah, `shipment_id` diupdate ke shipment yang sesuai

**Update Shipment ID:**
- **UPDATE**: Jika dimensi berubah, cari shipment yang cocok atau buat baru, lalu update `shipment_id`
- **ADD**: Cari shipment yang cocok atau buat baru, lalu set `shipment_id` ke piece baru
- **DELETE**: Tidak perlu update `shipment_id` (piece sudah dihapus)

### Contoh Skenario Kompleks:

**Sebelum:**
```sql
-- orderShipment
{ id: 1, order_id: 50, qty: 5, berat: 10, panjang: 20, lebar: 15, tinggi: 10, qty_reweight: 5 }
{ id: 2, order_id: 50, qty: 3, berat: 15, panjang: 25, lebar: 20, tinggi: 15, qty_reweight: 3 }

-- orderPieces (8 total)
// 5 pieces dengan dimensi (10kg, 20x15x10)
// 3 pieces dengan dimensi (15kg, 25x20x15)
```

**Actions:**
```json
[
  { "action": "update", "piece_id": 331, "berat": 15, "panjang": 25, "lebar": 20, "tinggi": 15 },
  { "action": "delete", "piece_id": 332 },
  { "action": "add", "berat": 20, "panjang": 30, "lebar": 25, "tinggi": 20 }
]
```

**Setelah:**
```sql
-- orderShipment
{ id: 1, order_id: 50, qty: 3, berat: 10, panjang: 20, lebar: 15, tinggi: 10, qty_reweight: 3 }     -- qty berkurang 2 (1 update + 1 delete)
{ id: 2, order_id: 50, qty: 4, berat: 15, panjang: 25, lebar: 20, tinggi: 15, qty_reweight: 4 }     -- qty bertambah 1 (dari update)
{ id: 3, order_id: 50, qty: 1, berat: 20, panjang: 30, lebar: 25, tinggi: 20, qty_reweight: 1 }     -- shipment baru (dari add)

-- orderPieces (8 total)
// 3 pieces dengan dimensi (10kg, 20x15x10)      -- berkurang 2
// 4 pieces dengan dimensi (15kg, 25x20x15)      -- bertambah 1  
// 1 piece dengan dimensi (20kg, 30x25x20)       -- baru
```

## Keunggulan Logika Ini:

✅ **Data Consistency** - `orderShipment` selalu sinkron dengan `orderPieces`  
✅ **Performance Optimal** - Tidak rebuild semua shipment, hanya update yang diperlukan  
✅ **Flexible Operations** - Mendukung operasi campuran (update + delete + add)  
✅ **Transaction Safe** - Rollback otomatis jika ada error  
✅ **Dimension Grouping** - Pieces dengan dimensi sama otomatis digabung dalam satu shipment  

Dengan logika ini, sistem dapat menangani skenario operasional yang kompleks sambil menjaga integritas data antara `orderPieces` dan `orderShipment`.
