# Export Finance Shipments to Excel

## Endpoint
```
GET /finance/shipments/export/excel
```

## Deskripsi
Endpoint ini digunakan untuk mengekspor data finance shipments ke dalam format Excel (.xlsx) berdasarkan filter yang diberikan.

## Method
```
GET
```

## Query Parameters
Endpoint ini menerima semua query parameters yang sama dengan `GET /finance/shipments`:

### Pagination
- `page` (optional): Halaman yang ingin ditampilkan (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 20)

### Search & Filter
- `search` (optional): Pencarian berdasarkan no_tracking, nama_pengirim, atau nama_penerima
- `billing_status` (optional): Filter berdasarkan status tagihan
  - `belum proses`
  - `belum ditagih`
  - `sudah ditagih`
  - `unpaid`
  - `lunas`
- `layanan` (optional): Filter berdasarkan jenis layanan
- `start_date` (optional): Filter tanggal mulai (format: YYYY-MM-DD)
- `end_date` (optional): Filter tanggal akhir (format: YYYY-MM-DD)
- `invoice_date_start` (optional): Filter tanggal invoice mulai (format: YYYY-MM-DD)
- `invoice_date_end` (optional): Filter tanggal invoice akhir (format: YYYY-MM-DD)
- `created_by_user_id` (optional): Filter berdasarkan user yang membuat
- `sort_by` (optional): Field untuk sorting (default: 'created_at')
- `order` (optional): Urutan sorting 'asc' atau 'desc' (default: 'desc')

## Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Response

### Success Response (200 OK)
```json
{
  "message": "Data finance shipments berhasil diekspor ke Excel",
  "success": true,
  "data": {
    "file_name": "finance-shipments-2024-01-15.xlsx",
    "url": "/excel/finance-shipments-2024-01-15.xlsx",
    "total_records": 150,
    "export_date": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": "Gagal mengekspor data ke Excel: Tidak ada data shipments untuk diekspor",
  "error": "Bad Request"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "statusCode": 500,
  "message": "Gagal mengekspor data ke Excel: Error detail",
  "error": "Internal Server Error"
}
```

## Struktur Excel File

### Worksheet: "Finance Shipments"
File Excel akan berisi kolom-kolom berikut:

| No | Order ID | No Resi | Tanggal Pengiriman | Pengirim | Penerima | Barang | Layanan | Qty | Berat (Kg) | Berat Volume (Kg) | Volume (M³) | Koli | Harga | Status Pengiriman | Status Tagihan | Tanggal Tagihan | Dibuat Oleh | Total Harga | Sisa Tagihan |
|----|----------|---------|-------------------|----------|----------|--------|---------|-----|-------------|-------------------|-------------|------|-------|-------------------|----------------|------------------|--------------|--------------|---------------|
| 1  | 12345    | GG001   | 2024-01-15        | John Doe | Jane Smith | Laptop | Regular | 1   | 2.5        | 2.3              | 0.009      | 1 Qty | Rp50,000 | In Transit | Sudah Ditagih | 2024-01-15 | Admin | 50000 | 0 |

## Contoh Request

### 1. Export Semua Data
```
GET /finance/shipments/export/excel
```

### 2. Export dengan Filter Status
```
GET /finance/shipments/export/excel?billing_status=unpaid&start_date=2024-01-01&end_date=2024-01-31
```

### 3. Export dengan Search
```
GET /finance/shipments/export/excel?search=GG001&layanan=Regular
```

### 4. Export dengan Pagination (akan di-ignore untuk export)
```
GET /finance/shipments/export/excel?page=1&limit=100&billing_status=lunas
```

## Fitur

### 1. **Data Transformation**
- Data diambil dari method `getFinanceShipments` yang sudah ada
- Transform data sesuai format Excel yang diinginkan
- Include semua field yang relevan untuk finance

### 2. **File Naming**
- Format: `finance-shipments-YYYY-MM-DD.xlsx`
- Timestamp otomatis berdasarkan waktu export
- Unique filename untuk setiap export

### 3. **File Storage**
- File disimpan di folder `public/excel/`
- URL download tersedia untuk frontend
- File dapat diakses langsung dari browser

### 4. **Error Handling**
- Validasi data sebelum export
- Fallback jika tidak ada data
- Log error untuk debugging

### 5. **Performance**
- Menggunakan data yang sudah di-cache dari `getFinanceShipments`
- Tidak ada query database tambahan
- Export berdasarkan data yang sudah difilter

## Integrasi dengan Frontend

### 1. **Download File**
```javascript
// Frontend dapat menggunakan URL dari response untuk download
const response = await fetch('/finance/shipments/export/excel?billing_status=unpaid');
const data = await response.json();

if (data.success) {
  // Download file Excel
  const link = document.createElement('a');
  link.href = data.data.url;
  link.download = data.data.file_name;
  link.click();
}
```

### 2. **Progress Indicator**
```javascript
// Frontend dapat menampilkan progress
const exportData = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/finance/shipments/export/excel');
    const data = await response.json();
    
    if (data.success) {
      showSuccess(`Export berhasil! Total ${data.data.total_records} records`);
      // Trigger download
      downloadFile(data.data.url, data.data.file_name);
    }
  } catch (error) {
    showError('Export gagal: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};
```

## Security

### 1. **Authentication Required**
- Endpoint dilindungi dengan JWT Guard
- Hanya user yang terotentikasi yang dapat mengakses

### 2. **Data Access Control**
- Data yang diexport sesuai dengan filter yang diberikan
- Tidak ada data yang tidak seharusnya diakses

### 3. **File Access Control**
- File Excel disimpan di folder public
- Dapat diakses langsung dari browser
- Consider implement file cleanup untuk file lama

## Dependencies

### 1. **XLSX Library**
```bash
npm install xlsx
```

### 2. **File System**
- Folder `public/excel/` harus ada dan writable
- Permission untuk create dan write file

### 3. **Memory Management**
- Large dataset dapat memakan memory
- Consider implement streaming untuk dataset besar

## Troubleshooting

### 1. **File Not Created**
- Check folder permission `public/excel/`
- Verify XLSX library terinstall
- Check console error logs

### 2. **Empty Excel File**
- Verify data dari `getFinanceShipments`
- Check filter parameters
- Ensure ada data yang match dengan filter

### 3. **Memory Issues**
- Reduce dataset size dengan filter
- Implement pagination untuk export
- Consider streaming export untuk data besar

## Contoh Usage

### 1. **Export Semua Shipments Lunas**
```bash
curl -X GET "http://localhost:3000/finance/shipments/export/excel?billing_status=lunas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. **Export Shipments dengan Date Range**
```bash
curl -X GET "http://localhost:3000/finance/shipments/export/excel?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. **Export dengan Search dan Filter**
```bash
curl -X GET "http://localhost:3000/finance/shipments/export/excel?search=GG&layanan=Regular&billing_status=unpaid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

- **Pagination di-ignore**: Untuk export, semua data yang match dengan filter akan diexport
- **File cleanup**: Consider implement cleanup untuk file Excel lama
- **Large dataset**: Untuk dataset besar, consider implement streaming export
- **Format Excel**: File menggunakan format .xlsx yang kompatibel dengan Excel 2007+
- **Encoding**: Data menggunakan UTF-8 encoding untuk support karakter khusus
