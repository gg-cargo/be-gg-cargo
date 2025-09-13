# Perancangan Fitur Notification Badge

## Overview
Fitur notification badge adalah sistem yang memberikan umpan balik visual kepada tim operasional tentang jumlah pekerjaan atau data baru yang perlu mereka tangani. Sistem ini menggunakan tabel `notification_badges` untuk melacak status notifikasi per user.

## Struktur Database

### Tabel: notification_badges
```sql
CREATE TABLE notification_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    item_id INT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_menu_read (menu_name, is_read),
    INDEX idx_item (item_type, item_id)
);
```

### Kolom:
- `id`: Primary key auto-increment
- `user_id`: ID pengguna yang akan melihat notifikasi
- `menu_name`: Nama menu tempat notifikasi muncul (contoh: 'Order Masuk', 'Reweight', 'Missing Items')
- `item_id`: ID dari item yang memicu notifikasi (misalnya order_id)
- `item_type`: Tipe item ('order', 'reweight', 'pickup', 'delivery', 'invoice')
- `is_read`: Status notifikasi (0 = belum dibaca, 1 = sudah dibaca)
- `created_at`: Waktu notifikasi dibuat
- `updated_at`: Waktu notifikasi terakhir diupdate

## API Endpoints

### 1. Mendapatkan Notification Badges
```http
GET /notification-badges
Authorization: Bearer <token>
Query Parameters:
- menu_name (optional): Filter berdasarkan menu tertentu
- limit (optional): Jumlah data per halaman (default: 50)
- offset (optional): Offset untuk pagination (default: 0)
```

**Response:**
```json
{
  "message": "Data notification badges berhasil diambil",
  "data": [
    {
      "id": 1,
      "user_id": 123,
      "menu_name": "Order Masuk",
      "item_id": 456,
      "item_type": "order",
      "is_read": 0,
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

### 2. Mendapatkan Count Notification Badges
```http
GET /notification-badges/counts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Data count notification badges berhasil diambil",
  "data": [
    {
      "menu_name": "Order Masuk",
      "unread_count": 5,
      "total_count": 12
    },
    {
      "menu_name": "Reweight",
      "unread_count": 2,
      "total_count": 8
    }
  ]
}
```

### 3. Mark Notification sebagai Read
```http
PATCH /notification-badges/:id/mark-read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification berhasil ditandai sebagai dibaca",
  "success": true
}
```

### 4. Mark Semua Notification sebagai Read
```http
PATCH /notification-badges/mark-all-read
Authorization: Bearer <token>
Content-Type: application/json

{
  "menu_name": "Order Masuk" // optional, jika tidak ada akan mark semua menu
}
```

**Response:**
```json
{
  "message": "5 notification berhasil ditandai sebagai dibaca",
  "success": true
}
```

### 5. Hapus Notification Badge
```http
DELETE /notification-badges/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification berhasil dihapus",
  "success": true
}
```

### 6. Cleanup Notification Badges Lama
```http
DELETE /notification-badges/cleanup
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Cleanup notification badges berhasil dilakukan",
  "success": true
}
```

## Integrasi dengan Existing Features

### Auto-Create Notifications
Sistem secara otomatis membuat notification badges untuk:

1. **Order Baru**: Ketika order baru dibuat, notification akan dibuat untuk semua user dengan level Admin atau Ops
2. **Reweight**: Ketika ada proses reweight yang perlu ditangani
3. **Missing Items**: Ketika ada laporan barang hilang

### Helper Methods di OrdersService
```typescript
// Membuat notification untuk order baru
private async createOrderNotification(orderId: number, orderData: any): Promise<void>

// Membuat notification untuk reweight
private async createReweightNotification(orderId: number): Promise<void>

// Membuat notification untuk missing items
private async createMissingItemNotification(orderId: number): Promise<void>
```

## Menu Types yang Didukung

1. **Order Masuk**: Notifikasi untuk order baru yang masuk
2. **Reweight**: Notifikasi untuk proses reweight yang perlu ditangani
3. **Missing Items**: Notifikasi untuk barang yang hilang
4. **Pickup**: Notifikasi untuk proses pickup
5. **Delivery**: Notifikasi untuk proses delivery
6. **Invoice**: Notifikasi untuk proses invoice

## Item Types yang Didukung

1. **order**: Item berupa order
2. **reweight**: Item berupa reweight request
3. **pickup**: Item berupa pickup request
4. **delivery**: Item berupa delivery request
5. **invoice**: Item berupa invoice

## Frontend Integration

### Contoh Implementasi Badge Count
```javascript
// Ambil count notification badges
const getNotificationCounts = async () => {
  const response = await fetch('/notification-badges/counts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data;
};

// Update badge di UI
const updateBadges = (counts) => {
  counts.forEach(count => {
    const badgeElement = document.querySelector(`[data-menu="${count.menu_name}"]`);
    if (badgeElement) {
      badgeElement.textContent = count.unread_count;
      badgeElement.style.display = count.unread_count > 0 ? 'block' : 'none';
    }
  });
};
```

### Contoh Mark as Read
```javascript
const markAsRead = async (notificationId) => {
  await fetch(`/notification-badges/${notificationId}/mark-read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};
```

## Performance Considerations

1. **Indexing**: Database sudah memiliki index untuk performa query yang optimal
2. **Cleanup**: Sistem memiliki fitur cleanup untuk menghapus notification lama (>30 hari)
3. **Bulk Operations**: Mendukung bulk create untuk multiple users
4. **Pagination**: Endpoint list mendukung pagination untuk performa yang baik

## Security

1. **Authentication**: Semua endpoint memerlukan JWT token
2. **Authorization**: User hanya bisa mengakses notification milik mereka sendiri
3. **Input Validation**: Semua input divalidasi menggunakan class-validator

## Monitoring & Maintenance

1. **Logging**: Semua operasi notification dicatat dalam log
2. **Error Handling**: Error handling yang comprehensive untuk semua operasi
3. **Cleanup Job**: Disarankan untuk menjalankan cleanup job secara berkala
4. **Performance Monitoring**: Monitor query performance dan optimasi jika diperlukan

## Migration

Untuk mengimplementasikan fitur ini:

1. Jalankan migration: `npm run migration:run`
2. Restart aplikasi untuk load module baru
3. Test endpoint dengan Postman atau tools lainnya
4. Integrasikan dengan frontend sesuai kebutuhan

## Contoh Penggunaan Lengkap

```javascript
// 1. Ambil count notification untuk semua menu
const counts = await getNotificationCounts();
console.log(counts);
// Output: [{ menu_name: "Order Masuk", unread_count: 3, total_count: 10 }]

// 2. Ambil detail notification untuk menu tertentu
const notifications = await fetch('/notification-badges?menu_name=Order Masuk&limit=10');
const data = await notifications.json();
console.log(data.data);

// 3. Mark notification sebagai read
await markAsRead(123);

// 4. Mark semua notification di menu tertentu sebagai read
await fetch('/notification-badges/mark-all-read', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ menu_name: 'Order Masuk' })
});
```
