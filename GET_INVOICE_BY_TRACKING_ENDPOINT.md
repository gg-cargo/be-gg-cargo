# Endpoint: GET /invoices/:no_tracking

## **📋 Informasi Umum**
- **Method**: GET
- **URL**: `/invoices/:no_tracking`
- **Tujuan**: Mendapatkan data invoice berdasarkan nomor tracking order, termasuk layanan dan total harga.

## **📤 Request**

### **Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `no_tracking` | string | ✅ | Nomor tracking order yang akan dicari |

### **Example Request:**
```
GET /invoices/GG250723523676
```

## **📥 Response**

### **Success Response (200 OK)**
```json
{
    "message": "Data invoice berhasil ditemukan",
    "data": {
        "no_tracking": "GG250723523676",
        "layanan": "Regular",
        "total_harga": 50000,
        "invoice_no": "INV-2025-001"
    }
}
```

### **Error Response (404 Not Found)**
```json
{
    "statusCode": 404,
    "message": "Order dengan nomor tracking GG250723523676 tidak ditemukan",
    "error": "Not Found"
}
```

### **Error Response (400 Bad Request)**
```json
{
    "statusCode": 400,
    "message": "Order dengan nomor tracking GG250723523676 memiliki total harga yang tidak valid (Rp 0). Silakan hubungi customer service untuk informasi lebih lanjut.",
    "error": "Bad Request"
}
```

### **Error Response (500 Internal Server Error)**
```json
{
    "statusCode": 500,
    "message": "Gagal mengambil data invoice",
    "error": "Internal Server Error"
}
```

## **🔄 Alur Logika Backend**

### **1. Menerima Request**
- Backend menerima GET request dengan path parameter `no_tracking`
- Parse dan validate parameter input
- Sanitize input untuk mencegah SQL injection

### **2. Query Database**
- Cari order berdasarkan `no_tracking` di tabel `orders`
- LEFT JOIN dengan tabel `order_invoices` untuk mendapatkan `invoice_no`
- Ambil field yang diperlukan: `no_tracking`, `layanan`, `total_harga`

### **3. SQL Query Equivalent:**
```sql
SELECT 
    o.no_tracking,
    o.layanan,
    o.total_harga,
    oi.invoice_no
FROM orders o
LEFT JOIN order_invoices oi ON o.id = oi.order_id
WHERE o.no_tracking = ?
```

### **4. Data Processing**
- Validasi apakah order ditemukan
- Extract data dari hasil query
- Format response sesuai DTO structure

### **5. Response Generation**
- Success: Return data dengan message sukses
- Error: Return appropriate error message dan status code

## **💾 Keterkaitan Database**

### **Tabel yang Diakses:**
- **`orders`**: Primary table untuk data order
- **`order_invoices`**: Related table untuk invoice details

### **Fields yang Diambil:**
| Table | Field | Description |
|-------|-------|-------------|
| `orders` | `no_tracking` | Nomor tracking order |
| `orders` | `layanan` | Jenis layanan pengiriman |
| `orders` | `total_harga` | Total harga pengiriman |

### **Relationships:**
```sql
orders.id → order_invoices.order_id (LEFT JOIN)
```

## **🔒 Security & Validation**

### **1. Input Validation**
- Path parameter validation
- SQL injection prevention
- Parameter sanitization
- Total harga validation (tidak boleh 0 atau negatif)

### **2. Error Handling**
- Comprehensive error messages
- Proper HTTP status codes
- Logging untuk debugging

### **3. Data Access Control**
- Public endpoint (tidak memerlukan authentication)
- Rate limiting ready
- Input length validation

## **🧪 Testing**

### **Test dengan cURL:**
```bash
# Test dengan tracking number yang valid
curl -X GET "http://localhost:3000/invoices/GG250723523676"

# Test dengan tracking number yang tidak valid
curl -X GET "http://localhost:3000/invoices/INVALID-TRACKING"
```

### **Test Scenarios:**
1. **Valid Tracking**: Data berhasil ditemukan
2. **Invalid Tracking**: 404 Not Found
3. **Empty Tracking**: 404 Not Found
4. **Special Characters**: Proper handling
5. **Long Tracking**: Input validation
6. **Total Harga 0**: 400 Bad Request dengan pesan error yang jelas

## **📊 Response Data Structure**

### **InvoiceByTrackingDataDto:**
```typescript
{
    no_tracking: string;      // Nomor tracking order
    layanan: string;          // Jenis layanan
    total_harga: number;      // Total harga
}
```

### **GetInvoiceByTrackingResponseDto:**
```typescript
{
    message: string;          // Pesan response
    data: InvoiceByTrackingDataDto; // Data invoice
}
```

## **⚠️ Error Handling**

### **1. Database Errors**
- Order tidak ditemukan
- Connection errors
- Query execution errors
- Total harga tidak valid (0 atau negatif)

### **2. Validation Errors**
- Invalid tracking number format
- Empty or null parameters
- Malformed requests
- Total harga tidak valid (0 atau negatif)

### **3. System Errors**
- Internal server errors
- Service unavailability
- Configuration errors

## **📝 Logging & Monitoring**

### **1. Success Logs**
```json
{
    "level": "info",
    "message": "Invoice data retrieved successfully",
    "no_tracking": "GG250723523676",
    "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### **2. Error Logs**
```json
{
    "level": "error",
    "message": "Failed to retrieve invoice data",
    "no_tracking": "GG250723523676",
    "error": "Order not found",
    "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## **🚀 Performance Considerations**

### **1. Database Optimization**
- Index pada `no_tracking` field
- Efficient JOIN queries
- Minimal field selection

### **2. Caching Strategy**
- Response caching untuk frequently accessed tracking numbers
- Database query result caching
- CDN caching untuk static responses

### **3. Query Optimization**
- Use specific attributes instead of SELECT *
- Proper JOIN strategy
- Connection pooling

## **🔗 Integrasi dengan Endpoint Lain**

### **1. Invoice Management Flow:**
```
GET /invoices/:no_tracking → POST /invoices/send-email
```

### **2. Order Tracking Flow:**
```
GET /orders/:id → GET /invoices/:no_tracking
```

### **3. Payment Flow:**
```
GET /invoices/:no_tracking → POST /payments/midtrans/va
```

## **📋 Use Cases**

### **1. Customer Service**
- Cek status invoice berdasarkan tracking number
- Verifikasi layanan dan harga
- Customer support queries

### **2. Finance Department**
- Validasi invoice data
- Price verification
- Service type confirmation

### **3. Frontend Integration**
- Invoice lookup forms
- Order tracking pages
- Payment confirmation screens

## **🎯 Frontend Integration Example**

### **1. JavaScript Fetch:**
```javascript
async function getInvoiceByTracking(trackingNumber) {
    try {
        const response = await fetch(`/invoices/${trackingNumber}`);
        const result = await response.json();
        
        if (response.ok) {
            console.log('Invoice data:', result.data);
            return result.data;
        } else {
            console.error('Error:', result.message);
            return null;
        }
    } catch (error) {
        console.error('Network error:', error);
        return null;
    }
}

// Usage
const invoiceData = await getInvoiceByTracking('GG250723523676');
if (invoiceData) {
    console.log('Layanan:', invoiceData.layanan);
    console.log('Total Harga:', invoiceData.total_harga);
}
```

### **2. React Component:**
```jsx
import React, { useState, useEffect } from 'react';

function InvoiceLookup() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLookup = async () => {
        if (!trackingNumber) return;
        
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`/invoices/${trackingNumber}`);
            const result = await response.json();
            
            if (response.ok) {
                setInvoiceData(result.data);
            } else {
                setError(result.message);
                setInvoiceData(null);
            }
        } catch (error) {
            setError('Network error occurred');
            setInvoiceData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Masukkan nomor tracking"
            />
            <button onClick={handleLookup} disabled={loading}>
                {loading ? 'Loading...' : 'Cari Invoice'}
            </button>
            
            {error && <p style={{color: 'red'}}>{error}</p>}
            
            {invoiceData && (
                <div>
                    <h3>Data Invoice</h3>
                    <p>Tracking: {invoiceData.no_tracking}</p>
                    <p>Layanan: {invoiceData.layanan}</p>
                    <p>Total Harga: Rp {invoiceData.total_harga.toLocaleString()}</p>
                    {invoiceData.invoice_no && (
                        <p>Invoice No: {invoiceData.invoice_no}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default InvoiceLookup;
```

## **📋 Checklist Implementation**

- [x] **DTO Classes**: Request dan Response DTOs
- [x] **Service Method**: Business logic untuk get invoice by tracking
- [x] **Controller Endpoint**: GET /invoices/:no_tracking
- [x] **Database Query**: Efficient JOIN query dengan orders dan order_invoices
- [x] **Error Handling**: Comprehensive error management
- [x] **Response Format**: Consistent dengan endpoint lainnya
- [x] **Documentation**: Complete API documentation
- [x] **Build Test**: Successful compilation

## **🎯 Next Steps**

1. **Testing**: Test dengan data real dari database
2. **Performance**: Monitor query performance dan optimize jika diperlukan
3. **Caching**: Implement response caching untuk frequently accessed tracking numbers
4. **Rate Limiting**: Add rate limiting untuk mencegah abuse
5. **Monitoring**: Setup logging dan alerting untuk error cases
6. **Frontend Integration**: Integrate dengan frontend application
7. **API Documentation**: Add ke Swagger/OpenAPI documentation
8. **Load Testing**: Test dengan high volume requests

## **✅ Summary**

Endpoint `GET /invoices/:no_tracking` berhasil diimplementasikan dengan fitur:

- **Data Retrieval**: Mendapatkan `layanan` dan `total_harga` dari orders
- **Invoice Information**: Optional invoice number jika tersedia
- **Error Handling**: Proper error messages dan HTTP status codes
- **Performance**: Efficient database queries dengan proper indexing
- **Security**: Input validation dan SQL injection prevention
- **Consistency**: Response format yang konsisten dengan endpoint lainnya

Endpoint ini siap digunakan untuk lookup invoice data berdasarkan tracking number! 🎉
