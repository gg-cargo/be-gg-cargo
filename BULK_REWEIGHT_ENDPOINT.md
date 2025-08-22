# Bulk Reweight Endpoint

## Deskripsi
Endpoint untuk melakukan reweight multiple pieces sekaligus dengan dukungan upload multiple images (maksimal 5) dan auto-create invoice ketika semua pieces selesai di-reweight.

## Fitur Utama

### 1. **Bulk Reweight**
- Update multiple pieces sekaligus dalam satu request
- Validasi semua pieces harus dari order yang sama
- Validasi pieces belum di-reweight sebelumnya

### 2. **Multiple Image Upload**
- Maksimal 5 gambar per request
- Format: JPG, PNG, GIF
- Ukuran maksimal: 5MB per gambar
- Images disimpan ke `public/uploads/`

### 3. **Auto-Update Order Shipments**
- Update data `order_shipments` dengan data terbaru dari pieces
- Hitung total weight dan volume dari semua pieces
- Update field `berat_reweight`, `panjang_reweight`, `lebar_reweight`, `tinggi_reweight`

### 4. **Auto-Create Invoice**
- Invoice otomatis dibuat ketika semua pieces selesai di-reweight
- Menggunakan logika yang sama dengan bypass reweight
- Chargeable weight dihitung dari `order_shipments`

## API Endpoint

```
POST /orders/pieces/bulk-reweight
Content-Type: multipart/form-data
```

### Headers
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

### Request Body (form-data)

#### **Pieces Data (JSON string)**
```json
{
  "pieces": [
    {
      "piece_id": 1,
      "berat": 10.5,
      "panjang": 30,
      "lebar": 20,
      "tinggi": 15
    },
    {
      "piece_id": 2,
      "berat": 8.2,
      "panjang": 25,
      "lebar": 18,
      "tinggi": 12
    }
  ],
  "reweight_by_user_id": 123
}
```

#### **Images (Optional)**
- Field: `images[]`
- Type: File
- Max: 5 files
- Format: JPG, PNG, GIF
- Size: Max 5MB per file

## Response Format

### Success Response
```json
{
  "message": "Bulk reweight berhasil untuk 2 pieces",
  "success": true,
  "data": {
    "pieces_updated": 2,
    "order_id": 50,
    "order_reweight_completed": true,
    "images_uploaded": [
      {
        "file_name": "reweight_proof_1.jpg",
        "file_path": "https://api.99delivery.id/uploads/1705312200000-123456789.jpg",
        "file_id": 29
      }
    ],
    "invoice_created": {
      "invoice_no": "GG250820137648",
      "invoice_id": 45,
      "total_amount": 150000
    },
    "pieces_details": [
      {
        "piece_id": 1,
        "berat_lama": 8.0,
        "berat_baru": 10.5,
        "dimensi_lama": "25x18x12",
        "dimensi_baru": "30x20x15"
      },
      {
        "piece_id": 2,
        "berat_lama": 6.5,
        "berat_baru": 8.2,
        "dimensi_lama": "20x15x10",
        "dimensi_baru": "25x18x12"
      }
    ]
  }
}
```

### Error Response
```json
{
  "message": "Beberapa pieces tidak ditemukan",
  "success": false,
  "statusCode": 400
}
```

## Validasi

### 1. **Pieces Validation**
- ✅ Pieces tidak boleh kosong
- ✅ Semua pieces harus ditemukan
- ✅ Semua pieces harus dari order yang sama
- ✅ Pieces belum di-reweight sebelumnya

### 2. **Images Validation**
- ✅ Maksimal 5 gambar
- ✅ Format: JPG, PNG, GIF
- ✅ Ukuran: Max 5MB per file
- ✅ `used_for`: `bulk_reweight_proof` (berbeda dengan bypass reweight)

### 3. **User Validation**
- ✅ User ID harus valid
- ✅ User harus ter-authenticated

## Alur Kerja

### 1. **Validasi Input**
- Cek pieces tidak kosong
- Validasi semua pieces ada
- Validasi pieces dari order yang sama
- Validasi pieces belum di-reweight

### 2. **Upload Images**
- Upload maksimal 5 gambar
- Simpan ke `public/uploads/`
- Metadata disimpan ke `file_log` dengan `used_for: 'bulk_reweight_proof'`

### 3. **Update Pieces**
- Update semua pieces dengan data baru
- Set `reweight_status: 1`
- Set `reweight_by: user_id`

### 4. **Update Order Shipments**
- Hitung total weight dan volume dari pieces
- Update field di `order_shipments`
- Update field `*_reweight`

### 5. **Check Completion**
- Cek apakah semua pieces sudah di-reweight
- Update order status jika selesai

### 6. **Auto-Create Invoice**
- Buat invoice otomatis jika semua pieces selesai
- Menggunakan data dari `order_shipments`

### 7. **Create History**
- Log aktivitas bulk reweight
- Include info images dan invoice

## Database Changes

### Tabel yang Diupdate
- `order_pieces`: Update berat, dimensi, reweight_status
- `order_shipments`: Update data terbaru dari pieces
- `orders`: Update reweight_status dan invoiceStatus
- `file_log`: Insert images metadata dengan `used_for: 'bulk_reweight_proof'`
- `order_histories`: Log aktivitas

### Field yang Diupdate di `order_shipments`
```sql
- berat: Total weight dari semua pieces
- panjang, lebar, tinggi: Dimensi dari piece pertama
- berat_reweight: Total weight setelah reweight
- panjang_reweight, lebar_reweight, tinggi_reweight: Dimensi setelah reweight
- qty_reweight: Jumlah pieces yang di-reweight
```

## Error Handling

### 1. **Validation Errors**
- Pieces tidak ditemukan
- Pieces dari order berbeda
- Pieces sudah di-reweight
- Jumlah images > 5

### 2. **Upload Errors**
- Image gagal upload
- Format file tidak didukung
- Ukuran file terlalu besar

### 3. **Database Errors**
- Transaction rollback otomatis
- Error log untuk troubleshooting

## Testing

### Test Cases
1. **Bulk reweight 2 pieces tanpa images**
2. **Bulk reweight dengan 3 images**
3. **Bulk reweight dengan 6 images (harus gagal)**
4. **Bulk reweight pieces dari order berbeda (harus gagal)**
5. **Bulk reweight pieces yang sudah di-reweight (harus gagal)**
6. **Auto-create invoice setelah semua pieces selesai**

### Test Data
- Multiple pieces dengan berbagai dimensi
- Images dengan format dan ukuran berbeda
- Order dengan status reweight berbeda

## Monitoring

### Metrics
- Jumlah bulk reweight per hari
- Success rate bulk reweight
- Average pieces per bulk reweight
- Images upload success rate

### Logs
- Bulk reweight activity
- Images upload status
- Order shipments update
- Invoice creation status

## Security

### Authentication
- JWT token required
- User validation

### File Upload Security
- File type validation
- File size limit
- Secure file naming
- Storage path validation

## Dependencies

### Models
- `OrderPiece`
- `OrderShipment`
- `Order`
- `FileLog`
- `OrderHistory`
- `OrderInvoice`

### Services
- `FileService`: Image upload
- `OrdersService`: Business logic

### Constants
- `INVOICE_STATUS.BELUM_DITAGIH`
- File upload limits

## Troubleshooting

### Common Issues
1. **"Pieces tidak boleh kosong"**
   - Solusi: Pastikan field `pieces` berisi array dengan data valid

2. **"Semua pieces harus dari order yang sama"**
   - Solusi: Cek apakah semua pieces memiliki `order_id` yang sama

3. **"Maksimal 5 gambar yang bisa diupload"**
   - Solusi: Kurangi jumlah images atau split menjadi multiple requests

4. **"Format file tidak didukung"**
   - Solusi: Gunakan format JPG, PNG, atau GIF

5. **"Ukuran file terlalu besar"**
   - Solusi: Kompres images atau gunakan resolusi lebih kecil

### Debug Mode
- Enable console logging
- Check file upload status
- Monitor database transactions
- Validate pieces data structure

## Contoh Penggunaan

### cURL Request
```bash
curl -X POST "http://localhost:3000/orders/pieces/bulk-reweight" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pieces=[{\"piece_id\":1,\"berat\":10.5,\"panjang\":30,\"lebar\":20,\"tinggi\":15}]" \
  -F "reweight_by_user_id=123" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('pieces', JSON.stringify(piecesData));
formData.append('reweight_by_user_id', '123');
formData.append('images', imageFile1);
formData.append('images', imageFile2);

fetch('/orders/pieces/bulk-reweight', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

Fitur bulk reweight ini memberikan efisiensi tinggi untuk update multiple pieces sekaligus dengan dukungan images dan auto-invoice! 🚀📦📸
