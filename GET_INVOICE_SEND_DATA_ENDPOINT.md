# Endpoint: GET /invoices/:invoice_no/send-data

## Deskripsi
Endpoint ini digunakan untuk mengambil dan menyiapkan semua data yang diperlukan untuk mengirimkan invoice melalui email dan WhatsApp, agar frontend dapat mengisi formulir pengiriman secara otomatis.

## Method
`GET`

## URL
`/invoices/:invoice_no/send-data`

## Path Parameters
- `:invoice_no` (string, required): Nomor invoice dari invoice yang akan dikirim

## Response

### Success Response (200 OK)
```json
{
    "status": "success",
    "invoice_data": {
        "invoice_no": "XPDC8072106605",
        "no_tracking": "XPDC20250731001",
        "billing_name": "Budi",
        "billing_email": "budi@example.com",
        "billing_nomer": "6281234567890",
        "harga": 408000,
        "email_subject": "Invoice XPDC20250731001",
        "body_email": "<p>Yth Customer GG Kargo Mr/Mrs. Budi</p><p>Kami infokan tagihan(invoice) Anda sudah terbit, Berikut adalah tagihan Anda dengan nomor tracking XPDC20250731001 sebesar Rp408.000.</p><p>Harap segera lakukan proses pembayaran atau konfirmasi harga pada kami.</p><p>Pembayaran dapat dilakukan melalui:<br/>Virtual Account yang terdapat pada Aplikasi GG Kargo</p><p>Terima kasih atas kerja samanya.</p>",
        "body_wa": "Yth. Mr/Mrs. Budi, \n\nTagihan Anda sudah terbit dengan nomor invoice XPDC8072106605, harap segera lakukan proses pembayaran.\n\nTotal Tagihan Invoice : *Rp408.000*\n\nMohon dapat dilakukan pembayaran melalui:\nVirtual Account yang terdapat pada aplikasi GG Kargo\n\nTerima kasih atas kerja samanya.\nGG Kargo"
    }
}
```

### Error Response (404 Not Found)
```json
{
    "statusCode": 404,
    "message": "Invoice dengan nomor XPDC8072106605 tidak ditemukan",
    "error": "Not Found"
}
```

### Error Response (500 Internal Server Error)
```json
{
    "statusCode": 500,
    "message": "Error getting invoice send data: [error details]",
    "error": "Internal Server Error"
}
```

## Alur Logika Backend

### 1. Validasi
- Periksa apakah `:invoice_no` ada di tabel `order_invoices`

### 2. Pengambilan Data Inti
- Kueri tabel `order_invoices` untuk menemukan `order_id` yang terkait berdasarkan `invoice_no`
- Gunakan `order_id` tersebut untuk mengambil data dari tabel `orders`

### 3. Penyusunan Respons
- **no_tracking**: Diambil dari `orders.no_tracking`
- **billing_name**: Diambil dari `orders.billing_name`. Jika kosong, gunakan `orders.nama_penerima` sebagai fallback
- **billing_email**: Diambil dari `orders.billing_email`. Jika kosong, gunakan `orders.email_penerima` sebagai fallback
- **billing_nomer**: Diambil dari `orders.billing_phone`. Jika kosong, gunakan `orders.no_telepon_penerima` sebagai fallback
- **harga**: Diambil dari `amount` di `order_invoices`
- **email_subject**: Dibuat dengan format `Invoice ${no_tracking}`

### 4. Konstruksi Body Pesan

#### Body Email (HTML format)
```html
<p>Yth Customer GG Kargo Mr/Mrs. [billing_name]</p>
<p>Kami infokan tagihan(invoice) Anda sudah terbit, Berikut adalah tagihan Anda dengan nomor tracking [no_tracking] sebesar Rp[harga].</p>
<p>Harap segera lakukan proses pembayaran atau konfirmasi harga pada kami.</p>
<p>Pembayaran dapat dilakukan melalui:<br/>Virtual Account yang terdapat pada Aplikasi GG Kargo</p>
<p>Terima kasih atas kerja samanya.</p>
```

#### Body WhatsApp (plain text format)
```
Yth. Mr/Mrs. [billing_name], 

Tagihan Anda sudah terbit dengan nomor invoice [invoice_no], harap segera lakukan proses pembayaran.

Total Tagihan Invoice : *Rp[harga]*

Mohon dapat dilakukan pembayaran melalui:
Virtual Account yang terdapat pada aplikasi GG Kargo

Terima kasih atas kerja samanya.
GG Kargo
```

## Keterkaitan dengan Database

### Tabel yang Digunakan
- **order_invoices**: Untuk mencari invoice berdasarkan `invoice_no` dan mendapatkan `amount`
- **orders**: Untuk mendapatkan data billing dan tracking

### Relasi
- `order_invoices.order_id` → `orders.id`

### Field yang Diambil
- **order_invoices**: `invoice_no`, `amount`, `order_id`
- **orders**: `no_tracking`, `billing_name`, `billing_email`, `billing_phone`, `nama_penerima`, `email_penerima`, `no_telepon_penerima`

## Use Cases
1. **Frontend Form Auto-fill**: Frontend dapat menggunakan data ini untuk mengisi formulir pengiriman email/WhatsApp secara otomatis
2. **Preview Message**: User dapat melihat preview pesan sebelum mengirim
3. **Data Validation**: Memastikan semua data yang diperlukan tersedia sebelum pengiriman
4. **Template Consistency**: Memastikan format pesan konsisten untuk semua pengiriman

## Contoh Penggunaan

### Request
```bash
GET /invoices/XPDC8072106605/send-data
```

### Response
```json
{
    "status": "success",
    "invoice_data": {
        "invoice_no": "XPDC8072106605",
        "no_tracking": "XPDC20250731001",
        "billing_name": "Budi",
        "billing_email": "budi@example.com",
        "billing_nomer": "6281234567890",
        "harga": 408000,
        "email_subject": "Invoice XPDC20250731001",
        "body_email": "<p>Yth Customer GG Kargo Mr/Mrs. Budi</p>...",
        "body_wa": "Yth. Mr/Mrs. Budi, \n\nTagihan Anda sudah terbit..."
    }
}
```

## Keamanan
- Endpoint ini tidak memerlukan autentikasi khusus
- Data yang dikembalikan hanya bersifat informatif dan tidak mengubah status sistem
- Validasi input dilakukan untuk memastikan `invoice_no` valid

## Dependencies
- `@nestjs/common`: Untuk decorators dan exceptions
- `@nestjs/sequelize`: Untuk database operations
- Sequelize models: `Order`, `OrderInvoice`
