# Endpoint: POST /invoices/send-email

## **📋 Informasi Umum**
- **Method**: POST
- **URL**: `/invoices/send-email`
- **Tujuan**: Mengirim email invoice kepada customer melalui Mailgun API dengan konten dinamis dan lampiran download link.

## **📤 Request Body**

### **JSON Structure:**
```json
{
    "invoice_no": "XPDC8072106605",
    "to_emails": ["fkri.haikal234@gmail.com"],
    "cc_emails": ["admin@xpdcargo.id"],
    "subject": "Invoice [invoice_no] - [no_tracking]",
    "body": "<p>Yth Customer MYXPDC Mr/Mrs. [nama_penerima],</p><p>Kami infokan tagihan (Invoice) Anda sudah terbit, berikut adalah tagihan Anda dengan nomor tracking <strong>[no_tracking]</strong> sebesar <strong>[total_harga]</strong>.</p><p>Harap segera lakukan proses pembayaran...</p>",
    "send_download_link": true,
    "sent_by_user_id": 20
}
```

### **Field Descriptions:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoice_no` | string | ✅ | Nomor invoice yang akan dikirim |
| `to_emails` | string[] | ✅ | Array email penerima utama |
| `cc_emails` | string[] | ❌ | Array email CC (opsional) |
| `subject` | string | ✅ | Subject email dengan placeholder |
| `body` | string | ✅ | Isi email dengan HTML content dan placeholder |
| `send_download_link` | boolean | ✅ | Apakah menyertakan link download PDF |
| `sent_by_user_id` | number | ✅ | ID user yang mengirim email |

## **📥 Response**

### **Success Response (200 OK)**
```json
{
    "message": "Email invoice berhasil dikirim",
    "success": true,
    "message_id": "20231201123456.12345.abc123@your-domain.mailgun.org"
}
```

### **Error Response (400 Bad Request)**
```json
{
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
}
```

### **Error Response (404 Not Found)**
```json
{
    "statusCode": 404,
    "message": "Invoice dengan nomor XPDC8072106605 tidak ditemukan",
    "error": "Not Found"
}
```

### **Error Response (500 Internal Server Error)**
```json
{
    "message": "Gagal mengirim email invoice",
    "success": false,
    "error": "Konfigurasi Mailgun tidak lengkap"
}
```

## **🔄 Alur Logika Backend**

### **1. Menerima Permintaan API**
- Backend menerima POST request dengan JSON body
- Validasi input menggunakan class-validator decorators
- Parse dan sanitize data input

### **2. Validasi dan Pengambilan Data**
- **Otorisasi**: Verifikasi `sent_by_user_id` ada di tabel `users`
- **Validasi Invoice**: Cek `invoice_no` ada di tabel `order_invoices`
- **Data Retrieval**: Join dengan tabel `orders` untuk data customer

### **3. Query Database**
```sql
SELECT 
    oi.invoice_no,
    o.no_tracking,
    o.nama_penerima,
    o.total_harga,
    o.email_penerima,
    o.alamat_penerima
FROM order_invoices oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.invoice_no = ?
```

### **4. Pembuatan Konten Email**
- **HTML Content**: Support HTML tags seperti `<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`
- **Dynamic Content**: Replace placeholder dengan data dari database menggunakan regex global
- **Download Link**: Generate link ke endpoint download PDF jika diminta
- **Email Template**: Tambahkan footer dan styling HTML

### **5. Pengiriman via Mailgun API**
- **API Call**: POST ke `https://api.mailgun.net/v3/{domain}/messages`
- **Authentication**: Basic auth dengan API key
- **Payload**: Multipart form-data dengan konten email
- **Sender**: `GG KARGO <no-reply@99delivery.id>` (Nama perusahaan yang muncul di email)

### **6. Response dan Logging**
- **Success**: Return message_id dari Mailgun
- **Error**: Return error message yang informatif
- **Logging**: Record pengiriman email untuk audit trail

## **💾 Keterkaitan Database**

### **Tabel yang Diakses:**
- **`order_invoices`**: Invoice details dan order_id
- **`orders`**: Customer data dan order information
- **`users`**: User yang mengirim email

### **Relationships:**
```sql
order_invoices.order_id → orders.id
sent_by_user_id → users.id
```

### **Data yang Diambil:**
- Invoice number dan details
- Customer name, email, address
- Tracking number dan total amount
- Order status dan payment info

## **🔧 Konfigurasi Environment Variables**

### **Required Variables:**
```bash
# Mailgun Configuration
MAILGUN_DOMAIN=your-domain.mailgun.org
MAILGUN_API_KEY=your-private-api-key

# Application Configuration
APP_URL=http://localhost:3000
```

### **Setup Mailgun:**
1. **Domain Verification**: Verifikasi domain di Mailgun dashboard
2. **API Key**: Generate private API key
3. **DNS Records**: Setup SPF, DKIM, dan MX records
4. **Sending Limits**: Configure daily/monthly limits

## **📧 Email Template Features**

### **1. HTML Content Support**
- **HTML Tags**: Support semua HTML tags standar (`<p>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`, `<br>`, `<hr>`)
- **Inline Styling**: Support CSS inline styles
- **Rich Text**: Bold, italic, underline, lists, paragraphs

### **2. Dynamic Placeholders**
- `[nama_penerima]` → Customer name
- `[no_tracking]` → Tracking number
- `[total_harga]` → Formatted currency (IDR)
- `[email_penerima]` → Customer email
- `[invoice_no]` → Invoice number

### **2. Download Link Generation**
```html
<a href="https://your-domain.com/invoices/{invoice_no}/download-pdf">
    Download Invoice PDF
</a>
```

### **3. Email Styling**
- Professional HTML template
- Responsive design
- Brand colors dan styling
- Footer dengan company info

### **4. HTML Content Examples**
```html
<!-- Basic HTML -->
<p>Yth Customer [nama_penerima],</p>
<p>Invoice Anda sudah terbit dengan nomor <strong>[invoice_no]</strong></p>

<!-- Rich Text Formatting -->
<p><strong>Total Tagihan:</strong> [total_harga]</p>
<p><em>Harap segera lakukan pembayaran</em></p>

<!-- Lists -->
<ul>
    <li>Invoice: [invoice_no]</li>
    <li>Tracking: [no_tracking]</li>
    <li>Amount: [total_harga]</li>
</ul>

<!-- Mixed Content -->
<p>Detail order:</p>
<ol>
    <li><strong>Invoice Number:</strong> [invoice_no]</li>
    <li><strong>Tracking Number:</strong> [no_tracking]</li>
    <li><strong>Total Amount:</strong> [total_harga]</li>
</ol>
```

## **🔒 Security & Validation**

### **1. Input Validation**
- Email format validation
- Required field validation
- SQL injection prevention
- XSS protection

### **2. Authentication**
- User existence validation
- Permission checking (optional)
- Rate limiting (recommended)

### **3. Data Sanitization**
- HTML content sanitization
- Email address validation
- Special character handling

## **🧪 Testing**

### **Test dengan cURL:**
```bash
curl -X POST "http://localhost:3000/invoices/send-email" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_no": "XPDC8072106605",
    "to_emails": ["test@example.com"],
    "subject": "Invoice [invoice_no] - [no_tracking]",
    "body": "Yth Customer [nama_penerima], Invoice [invoice_no] dengan tracking [no_tracking] sebesar [total_harga]",
    "send_download_link": true,
    "sent_by_user_id": 20
  }'
```

### **Test Scenarios:**
1. **Valid Invoice**: Email berhasil dikirim
2. **Invalid Invoice**: 404 Not Found
3. **Invalid User**: 404 Not Found
4. **Mailgun Error**: 500 Internal Server Error
5. **Validation Error**: 400 Bad Request

## **⚠️ Error Handling**

### **1. Database Errors**
- Invoice tidak ditemukan
- Order data tidak lengkap
- User tidak valid

### **2. Mailgun API Errors**
- Authentication failed
- Domain not verified
- Rate limit exceeded
- Invalid email format

### **3. Network Errors**
- Timeout
- Connection refused
- DNS resolution failed

## **📝 Logging & Monitoring**

### **1. Success Logs**
```json
{
    "level": "info",
    "message": "Email sent successfully",
    "invoice_no": "XPDC8072106605",
    "message_id": "20231201123456.12345.abc123@domain.mailgun.org",
    "sent_at": "2023-12-01T12:34:56.789Z"
}
```

### **2. Error Logs**
```json
{
    "level": "error",
    "message": "Failed to send email",
    "invoice_no": "XPDC8072106605",
    "error": "Mailgun API error: 401 Unauthorized",
    "timestamp": "2023-12-01T12:34:56.789Z"
}
```

## **🚀 Performance Considerations**

### **1. Database Optimization**
- Index pada `invoice_no` dan `order_id`
- Efficient JOIN queries
- Connection pooling

### **2. Email Delivery**
- Async email sending (optional)
- Queue system untuk bulk emails
- Retry mechanism untuk failed emails

### **3. Caching**
- Invoice data caching
- User permission caching
- Email template caching

## **🔗 Integrasi dengan Endpoint Lain**

### **1. Download PDF Endpoint**
```
POST /invoices/send-email → GET /invoices/{invoice_no}/download-pdf
```

### **2. Invoice Management**
```
GET /invoices → POST /invoices/send-email
```

### **3. Order Tracking**
```
GET /orders/{id} → POST /invoices/send-email
```

## **📋 Checklist Implementation**

- [x] **DTO Classes**: Request dan Response DTOs
- [x] **Service Layer**: Business logic dan Mailgun integration
- [x] **Controller**: HTTP endpoint handler
- [x] **Module**: NestJS module configuration
- [x] **Database Queries**: Efficient data retrieval
- [x] **Email Templates**: Dynamic content generation
- [x] **Error Handling**: Comprehensive error management
- [x] **Logging**: Audit trail dan monitoring
- [x] **Security**: Input validation dan sanitization
- [x] **Documentation**: Complete API documentation

## **🎯 Next Steps**

1. **Environment Setup**: Configure Mailgun credentials
2. **Domain Verification**: Complete Mailgun domain setup
3. **Testing**: Test dengan data real dari database
4. **Monitoring**: Setup email delivery monitoring
5. **Rate Limiting**: Implement API rate limiting
6. **Bulk Sending**: Add support untuk multiple invoices
7. **Template Management**: Admin interface untuk email templates
8. **Analytics**: Track email open rates dan delivery status

