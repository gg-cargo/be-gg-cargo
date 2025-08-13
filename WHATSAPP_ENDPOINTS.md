# 📱 WhatsApp API Endpoints Documentation

## **🌐 Base URL**
```
http://localhost:3000/whatsapp
```

## **🔑 Authentication**
Semua endpoint (kecuali `/health`) memerlukan API key yang dikirim melalui header:
```
x-api-key: YOUR_WWEB_API_KEY
```

## **📋 List Semua Endpoint**

### **1. Health Check**
```http
GET /whatsapp/health
```
**Tujuan**: Cek status kesehatan service WhatsApp  
**Authentication**: ❌ Tidak diperlukan  
**Response**:
```json
{
  "status": "ok",
  "service": "wweb",
  "uptime": 123.456
}
```

---

### **2. Status Connection**
```http
GET /whatsapp/status
```
**Tujuan**: Cek status koneksi WhatsApp client  
**Authentication**: ✅ Diperlukan  
**Response**:
```json
{
  "success": true,
  "isReady": true,
  "hasQRCode": false,
  "isConnecting": false,
  "isDisconnected": false,
  "phoneNumber": "+6281234567890",
  "deviceInfo": {
    "platform": "android",
    "version": "2.23.24.78"
  }
}
```

---

### **3. Get QR Code**
```http
GET /whatsapp/qr?type=dataurl
```
**Tujuan**: Mendapatkan QR code untuk scan WhatsApp  
**Authentication**: ✅ Diperlukan  
**Query Parameters**:
- `type` (optional): `dataurl` | `svg` | `text` (default: `dataurl`)

**Response (dataurl)**:
```json
{
  "success": true,
  "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Response (svg)**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">...</svg>
```

**Response (text)**:
```
2@abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

### **4. Refresh QR Code**
```http
POST /whatsapp/refresh-qr
```
**Tujuan**: Force refresh QR code baru (logout + re-init)  
**Authentication**: ✅ Diperlukan  
**Response**:
```json
{
  "success": true,
  "message": "QR code baru tersedia. Gunakan GET /qr untuk melihat QR code.",
  "status": {
    "isReady": false,
    "hasQRCode": true,
    "isConnecting": true
  }
}
```

---

### **5. Force Re-initialization**
```http
POST /whatsapp/force-init
```
**Tujuan**: Force restart WhatsApp client (logout + cleanup + re-init)  
**Authentication**: ✅ Diperlukan  
**Response**:
```json
{
  "success": true,
  "message": "WhatsApp client berhasil di-reinisialisasi",
  "status": {
    "isReady": false,
    "hasQRCode": true,
    "isConnecting": true
  }
}
```

---

### **6. Send Text Message**
```http
POST /whatsapp/send-text
```
**Tujuan**: Kirim pesan teks ke nomor WhatsApp  
**Authentication**: ✅ Diperlukan  
**Request Body**:
```json
{
  "phoneNumber": "6281234567890",
  "message": "Hello, ini adalah pesan test dari API!"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "3EB0C767D1234567890",
  "status": "sent",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "status": {
    "isReady": true,
    "hasQRCode": false
  }
}
```

---

### **7. Send Media Message**
```http
POST /whatsapp/send-media
```
**Tujuan**: Kirim file media (gambar, video, dokumen) ke nomor WhatsApp  
**Authentication**: ✅ Diperlukan  
**Request Body**:
```json
{
  "phoneNumber": "6281234567890",
  "caption": "Ini adalah caption untuk media",
  "fileUrl": "https://example.com/image.jpg"
}
```

**Atau menggunakan file path lokal**:
```json
{
  "phoneNumber": "6281234567890",
  "caption": "Ini adalah caption untuk media",
  "filePath": "/path/to/local/file.jpg"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "3EB0C767D1234567890",
  "status": "sent",
  "mediaType": "image",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

---

### **8. Logout**
```http
POST /whatsapp/logout
```
**Tujuan**: Logout dari WhatsApp (hapus session)  
**Authentication**: ✅ Diperlukan  
**Response**:
```json
{
  "success": true
}
```

---

### **9. Cleanup Session**
```http
POST /whatsapp/cleanup
```
**Tujuan**: Hapus folder session dan cache WhatsApp  
**Authentication**: ✅ Diperlukan  
**Response**:
```json
{
  "success": true,
  "message": "Folder session berhasil dibersihkan. Gunakan /force-init untuk restart WhatsApp client.",
  "cleanedFolders": [".wwebjs_auth", ".wwebjs_cache"]
}
```

---

## **🔄 Alur Penggunaan Endpoint**

### **1. Setup Awal**
```bash
# 1. Cek health service
GET /whatsapp/health

# 2. Cek status koneksi
GET /whatsapp/status

# 3. Jika belum ready, dapatkan QR code
GET /whatsapp/qr

# 4. Scan QR code dengan WhatsApp mobile
```

### **2. Jika QR Expired/Error**
```bash
# 1. Refresh QR code
POST /whatsapp/refresh-qr

# 2. Tunggu QR baru muncul
GET /whatsapp/qr

# 3. Scan QR baru
```

### **3. Jika Ada Masalah Serius**
```bash
# 1. Force re-initialization
POST /whatsapp/force-init

# 2. Tunggu proses selesai
GET /whatsapp/status

# 3. Dapatkan QR code baru
GET /whatsapp/qr
```

### **4. Pengiriman Pesan**
```bash
# 1. Pastikan status ready
GET /whatsapp/status

# 2. Kirim pesan teks
POST /whatsapp/send-text

# 3. Kirim media
POST /whatsapp/send-media
```

---

## **⚠️ Error Handling**

### **1. Unauthorized (401)**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
**Solusi**: Pastikan header `x-api-key` dikirim dengan benar

### **2. WhatsApp Not Ready (409)**
```json
{
  "success": false,
  "error": "WhatsApp belum siap. Scan QR terlebih dahulu."
}
```
**Solusi**: Gunakan endpoint `/qr` untuk scan QR code

### **3. QR Not Available (404)**
```json
{
  "success": false,
  "error": "QR belum tersedia. Gunakan /refresh-qr untuk memunculkan QR baru.",
  "status": {
    "isReady": false,
    "hasQRCode": false
  }
}
```
**Solusi**: Gunakan endpoint `/refresh-qr` atau `/force-init`

### **4. Timeout (408)**
```json
{
  "success": false,
  "error": "Timeout menunggu QR code. Coba lagi."
}
```
**Solusi**: Coba lagi atau gunakan `/force-init`

---

## **🔧 Configuration**

### **Environment Variables**
```bash
# Base URL untuk wweb service
WWEB_BASE_URL=http://wweb:3001

# API Key untuk authentication (opsional)
WWEB_API_KEY=your_secret_api_key
```

### **Timeout Settings**
```typescript
// HTTP timeout: 15 detik
timeout: 15000

// QR refresh timeout: 30 detik
const maxAttempts = 30; // 30 detik
```

---

## **📱 WhatsApp Client Features**

### **1. Auto-reconnection**
- Otomatis reconnect jika koneksi terputus
- Retry mechanism untuk operasi yang gagal

### **2. Session Management**
- Persistent session storage
- Auto-cleanup expired sessions
- Manual cleanup via API

### **3. Media Handling**
- Support berbagai format file
- Auto-download dari URL
- Temporary file management

### **4. Security**
- API key authentication
- CORS protection
- Helmet security headers

---

## **🚀 Best Practices**

### **1. Error Handling**
```typescript
try {
  const result = await whatsappService.sendText({
    phoneNumber: '6281234567890',
    message: 'Hello!'
  });
  console.log('Pesan terkirim:', result);
} catch (error) {
  if (error.response?.status === 409) {
    console.log('WhatsApp belum ready, scan QR dulu');
  } else {
    console.error('Error:', error.message);
  }
}
```

### **2. Status Checking**
```typescript
// Selalu cek status sebelum kirim pesan
const status = await whatsappService.getStatus();
if (!status.isReady) {
  console.log('WhatsApp belum ready');
  return;
}
```

### **3. QR Code Management**
```typescript
// Gunakan refresh-qr jika QR expired
if (status.hasQRCode === false && status.isReady === false) {
  await whatsappService.refreshQrCode();
}
```

---

## **📊 Monitoring & Logging**

### **1. Health Check**
- Monitor service uptime
- Check service availability
- Alert jika service down

### **2. Connection Status**
- Monitor WhatsApp connection
- Track QR code availability
- Log connection changes

### **3. Message Delivery**
- Track message status
- Monitor delivery success rate
- Log failed deliveries

---

## **🔗 Integration Examples**

### **1. Node.js/Express**
```javascript
const axios = require('axios');

const whatsappApi = axios.create({
  baseURL: 'http://localhost:3000/whatsapp',
  headers: {
    'x-api-key': 'your_api_key'
  }
});

// Send message
const sendMessage = async (phone, message) => {
  try {
    const response = await whatsappApi.post('/send-text', {
      phoneNumber: phone,
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data);
    throw error;
  }
};
```

### **2. Python/Requests**
```python
import requests

class WhatsAppAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {'x-api-key': api_key}
    
    def send_text(self, phone_number, message):
        url = f"{self.base_url}/whatsapp/send-text"
        data = {
            'phoneNumber': phone_number,
            'message': message
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()
```

### **3. cURL Commands**
```bash
# Check status
curl -H "x-api-key: your_api_key" \
  http://localhost:3000/whatsapp/status

# Send text message
curl -X POST \
  -H "x-api-key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"6281234567890","message":"Hello!"}' \
  http://localhost:3000/whatsapp/send-text

# Get QR code
curl -H "x-api-key: your_api_key" \
  "http://localhost:3000/whatsapp/qr?type=dataurl"
```

---

## **📝 Notes**

1. **Phone Number Format**: Gunakan format internasional tanpa `+` (contoh: `6281234567890`)
2. **File Size Limit**: Maksimal 2MB untuk request body
3. **Rate Limiting**: Tidak ada rate limiting built-in, implementasi di level aplikasi
4. **Session Persistence**: Session WhatsApp akan tersimpan sampai logout atau cleanup
5. **Auto-reconnection**: Client akan otomatis reconnect jika koneksi terputus
6. **Media Files**: File dari URL akan di-download ke `/tmp` sebelum dikirim

---

## **🆘 Troubleshooting**

### **1. WhatsApp Client Tidak Mau Connect**
```bash
# 1. Cek status
GET /whatsapp/status

# 2. Force re-init
POST /whatsapp/force-init

# 3. Tunggu dan cek lagi
GET /whatsapp/status
```

### **2. QR Code Tidak Muncul**
```bash
# 1. Refresh QR
POST /whatsapp/refresh-qr

# 2. Tunggu dan cek
GET /whatsapp/qr

# 3. Jika masih error, force init
POST /whatsapp/force-init
```

### **3. Pesan Tidak Terkirim**
```bash
# 1. Cek status koneksi
GET /whatsapp/status

# 2. Pastikan isReady = true
# 3. Coba kirim lagi
POST /whatsapp/send-text
```

### **4. Service Tidak Responsive**
```bash
# 1. Cek health
GET /whatsapp/health

# 2. Restart service jika perlu
# 3. Cek logs untuk error
```
