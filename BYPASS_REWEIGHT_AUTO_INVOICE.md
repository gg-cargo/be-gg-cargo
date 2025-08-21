# Bypass Reweight dengan Auto-Create Invoice

## Deskripsi
Fitur ini memungkinkan sistem untuk secara otomatis membuat invoice ketika bypass reweight diaktifkan dan order status berubah menjadi `BELUM_DITAGIH`. **File foto bukti wajib diupload** saat mengaktifkan bypass reweight untuk audit trail dan compliance. Sistem mendukung upload file langsung dengan validasi format dan ukuran.

## Alur Kerja

### 1. Bypass Reweight Diaktifkan
- User mengaktifkan bypass reweight untuk order tertentu
- **File foto bukti wajib diupload** (JPG, PNG, GIF)
- Sistem validasi format dan ukuran file
- Sistem upload file ke storage server
- Sistem mengupdate status order menjadi `reweight_status: 1`
- Sistem mengupdate `invoiceStatus` menjadi `BELUM_DITAGIH`
- Sistem mengupdate semua pieces menjadi `reweight_status: 1`

### 2. Upload dan Penyimpanan File
- **File Upload**: Menggunakan `FileInterceptor` dengan field `proof_image`
- **Storage**: File disimpan ke `public/uploads/` dengan nama unik
- **Validasi Format**: Hanya menerima JPG, PNG, GIF
- **Validasi Ukuran**: Maksimal 5MB
- **Metadata**: Disimpan ke tabel `file_log` dengan:
  - `user_id`: ID user yang melakukan bypass
  - `file_name`: Nama asli file dari user
  - `file_path`: URL lengkap ke file (https://api.99delivery.id/uploads/{filename})
  - `file_type`: Ekstensi file asli
  - `file_size`: Ukuran file dalam bytes
  - `used_for`: 'bypass_reweight_proof'
  - `is_assigned`: 1 (sudah dipakai)

### 3. Auto-Create Invoice
- Setelah status order berubah, sistem otomatis memanggil fungsi `autoCreateInvoice`
- Invoice dibuat dengan komponen biaya:
  - **Biaya Pengiriman Barang**: Quantity berdasarkan `chargeableWeight` (berat terberat antara `totalWeight` dan `totalBeratVolume`)
    - **Total Weight**: Dihitung dari `order_shipments` (Σ berat × qty untuk setiap shipment)
    - **Total Volume Weight**: Dihitung dari dimensi setiap shipment (Σ volume × qty × 250 kg/m³)
    - **Volume per shipment**: (panjang × lebar × tinggi) / 1,000,000 m³
    - **Quantity**: `Math.max(totalWeight, totalBeratVolume)`
  - Biaya Asuransi (0.2% dari `harga_barang` jika asuransi = 1)
  - Biaya Packing (Rp 5.000 jika packing = 1)
  - Diskon (jika ada voucher)
- PPN 10% otomatis dihitung
- Kode unik 3 digit random ditambahkan

### 3. Response Data
Response akan menyertakan informasi invoice yang dibuat:
```json
{
  "message": "Bypass reweight berhasil diaktifkan",
  "success": true,
  "data": {
    "order_id": 123,
    "no_tracking": "GGK001234567",
    "bypass_reweight_status": "true",
    "reason": "Alasan bypass",
    "updated_by_user": "User ID 456",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "order_pieces_updated": 3,
    "proof_image": {
      "file_name": "bukti_bypass_reweight.jpg",
      "file_path": "https://api.99delivery.id/uploads/1705312200000-123456789.jpg",
      "file_id": 456
    },
    "invoice_created": {
      "invoice_no": "GGK001234567",
      "invoice_id": 789,
      "total_amount": 150000
    }
  }
}
```

## Fitur Keamanan

### Error Handling
- **Foto bukti**: Jika gagal disimpan, proses bypass reweight dibatalkan (rollback)
- **Auto-create invoice**: Jika gagal, proses bypass reweight tetap berlanjut
- Warning log dicatat untuk troubleshooting
- Transaction rollback jika terjadi error kritis

### Validasi
- **File Upload**: 
  - Format: JPG, PNG, GIF
  - Ukuran: Maksimal 5MB
  - Wajib: Jika bypass diaktifkan
- **Order**: Cek apakah order sudah memiliki invoice
- **Bank**: Validasi data bank perusahaan
- **Invoice**: Generate invoice number yang unik

## Konfigurasi

### Payment Terms
- Default: "Net 30"
- Bisa dikustomisasi sesuai kebutuhan

### Biaya Packing
- Default: Rp 5.000
- Bisa dikonfigurasi dari database/config

### PPN
- Default: 10%
- Bisa dikonfigurasi sesuai regulasi

### File Upload
- **Storage Path**: `public/uploads/` (otomatis dibuat jika tidak ada)
- **File Naming**: `{timestamp}-{random}.{extension}`
- **Base URL**: `https://api.99delivery.id/uploads/`
- **Max Size**: 5MB
- **Allowed Types**: JPG, PNG, GIF
- **Storage Config**: Menggunakan `diskStorage` dengan konfigurasi yang sama seperti `FileController`

### Chargeable Weight
- **Formula**: `Math.max(totalWeight, totalBeratVolume)`
- **Total Weight**: Berat aktual dari `order_shipments` (berat × qty untuk setiap shipment)
- **Volume Weight**: Dihitung dari dimensi setiap shipment × 250 kg/m³ (standar industri)
- **Perhitungan Per Shipment**:
  - Volume = (panjang × lebar × tinggi) / 1,000,000 (convert ke m³)
  - Berat Volume = Volume × 250 kg/m³
  - Total per shipment = Volume × qty
- **Standar Industri**: 250 kg/m³ untuk kargo umum
- **Data Source**: Mengambil data dari tabel `order_shipments` berdasarkan `order_id`

### Contoh Perhitungan Chargeable Weight
**Order dengan 2 shipments:**

**Shipment 1:**
- Qty: 2, Berat: 8 kg, Dimensi: 30×20×15 cm
- Total Weight: 2 × 8 = 16 kg
- Volume: (30×20×15) / 1,000,000 = 0.009 m³
- Volume Weight: 0.009 × 250 = 2.25 kg
- Total Volume Weight: 2 × 2.25 = 4.5 kg

**Shipment 2:**
- Qty: 1, Berat: 5 kg, Dimensi: 40×25×20 cm
- Total Weight: 1 × 5 = 5 kg
- Volume: (40×25×20) / 1,000,000 = 0.02 m³
- Volume Weight: 0.02 × 250 = 5 kg
- Total Volume Weight: 1 × 5 = 5 kg

**Total:**
- Total Weight: 16 + 5 = 21 kg
- Total Volume Weight: 4.5 + 5 = 9.5 kg
- **Chargeable Weight**: Math.max(21, 9.5) = **21 kg**

## Database Changes

### Tabel yang Terlibat
- `orders` - Update status dan invoice status
- `order_pieces` - Update reweight status
- `file_log` - Insert foto bukti bypass reweight
- `order_invoices` - Insert invoice baru
- `order_invoice_details` - Insert detail invoice
- `order_histories` - Log aktivitas

### Field yang Diupdate
- `bypass_reweight`: Status bypass (true/false)
- `reweight_status`: Status reweight (0/1)
- `invoiceStatus`: Status invoice
- `isUnreweight`: Flag unreweight
- `remark_reweight`: Alasan bypass

### Field yang Diinsert
- `file_log`: Foto bukti bypass reweight dengan metadata lengkap

## Logging

### Order History
- Status: "Reweight Bypass Enabled"
- Remark: Mencakup alasan bypass, informasi foto bukti, dan informasi invoice yang dibuat
- Timestamp: Waktu bypass dilakukan
- User: ID user yang melakukan bypass
- Format Remark: `{Status} oleh User ID {userId} dengan alasan: {reason} - Foto bukti: {fileName} - Invoice otomatis dibuat: {invoiceNo}`

### Console Logs
- Warning jika order sudah di-reweight
- Error jika auto-create invoice gagal
- Info sukses bypass dan invoice

## Dependencies

### Models
- `Order`
- `OrderPiece`
- `OrderInvoice`
- `OrderInvoiceDetail`
- `Bank`
- `OrderHistory`
- `FileLog`

### Services
- `FileService`: Untuk upload dan manajemen file
- `OrdersService`: Untuk logika bypass reweight

### Controllers
- `OrdersController`: Endpoint bypass reweight dengan file upload
  - Menggunakan `FileInterceptor` dengan `diskStorage`
  - Konfigurasi storage sama dengan `FileController`
- `FileController`: Endpoint file management (jika diperlukan)

### Constants
- `INVOICE_STATUS.BELUM_DITAGIH`

## API Endpoint

### Bypass Reweight dengan File Upload
```
PATCH /orders/:order_id/bypass-reweight
Content-Type: multipart/form-data

Body:
- bypass_reweight_status: "true" | "false"
- reason?: string
- updated_by_user_id: number
- proof_image: File (JPG, PNG, GIF, max 5MB)
```

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

## Testing

### Test Cases
1. Bypass reweight untuk order baru dengan foto bukti
2. Bypass reweight untuk order yang sudah ada invoice
3. Bypass reweight dengan alasan custom dan foto bukti
4. Bypass reweight tanpa foto bukti (harus gagal)
5. Rollback jika terjadi error saat simpan foto bukti
6. Rollback jika terjadi error saat auto-create invoice
7. Validasi response data termasuk foto bukti
8. Validasi metadata foto bukti di file_log

### Test Data
- Order dengan berbagai kombinasi packing/asuransi
- Order dengan voucher/diskon
- Order dengan status reweight berbeda
- Bank data yang valid/invalid
- **File Upload Test**:
  - Format: JPG, PNG, GIF
  - Ukuran: 1KB, 1MB, 5MB, 6MB (invalid)
  - Format invalid: PDF, DOC, TXT
  - File kosong/tidak ada file

## Monitoring

### Metrics
- Jumlah bypass reweight per hari
- Success rate auto-create invoice
- Error rate dan jenis error
- Response time bypass reweight

### Alerts
- Auto-create invoice gagal > 5x per jam
- Bypass reweight error > 10x per jam
- Database transaction timeout

## Troubleshooting

### Common Issues
1. **File tidak diupload**
   - Solusi: File wajib diupload saat mengaktifkan bypass reweight
   
2. **Format file tidak didukung**
   - Solusi: Gunakan format JPG, PNG, atau GIF
   
3. **Ukuran file terlalu besar**
   - Solusi: Kompres file atau gunakan resolusi lebih kecil (max 5MB)
   
4. **Gagal upload file**
   - Solusi: Cek koneksi internet dan storage server
   - **Error "Cannot read properties of undefined (reading 'replace')"**:
     - Pastikan folder `public/uploads/` sudah dibuat
     - Pastikan `FileInterceptor` menggunakan konfigurasi `diskStorage`
     - Cek apakah file berhasil diupload dengan `@UploadedFile()`

5. **Invoice tidak terbuat (auto-create invoice gagal)**
   - **Error "Unknown column 'qty' in 'field list'"**:
     - Pastikan menggunakan data dari `order_shipments` bukan `order_pieces`
     - Field `qty` tersedia di tabel `order_shipments`
     - Cek apakah order memiliki data shipments
   - **Solusi**: Gunakan `orderShipmentModel.findAll()` dengan attributes yang benar
   
6. **Bank data tidak ditemukan**
   - Solusi: Pastikan data bank perusahaan sudah diisi
   
7. **Invoice number duplicate**
   - Solusi: Sistem otomatis generate suffix -001, -002, dst
   
8. **Transaction timeout**
   - Solusi: Cek performa database dan network
   
9. **Memory leak**
   - Solusi: Pastikan transaction selalu di-commit/rollback

### Debug Mode
- Enable console logging untuk detail error
- Check database transaction logs
- Monitor memory usage saat bypass reweight
