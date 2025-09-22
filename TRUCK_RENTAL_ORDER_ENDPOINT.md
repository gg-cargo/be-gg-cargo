# Endpoint: POST /orders/sewa-truk

## Deskripsi
Endpoint ini digunakan untuk membuat pesanan baru untuk layanan sewa truk. Endpoint memproses logika harga dinamis berdasarkan jarak yang dihitung menggunakan Mapbox Directions API dan menyimpan data pesanan ke database dengan audit trail lengkap.

## URL
```
POST /orders/sewa-truk
```

## Authentication
- **Required**: Bearer Token (JWT)
- **Guard**: JwtAuthGuard

## Request Body

### Struktur JSON
```json
{
  "nama_pengirim": "budi testing",
  "alamat_pengirim": "Jl. Mawar No. 1234",
  "provinsi_pengirim": "DKI Jakarta",
  "kota_pengirim": "Jakarta Selatan",
  "kecamatan_pengirim": "Senayan",
  "kelurahan_pengirim": "Kebayoran Baru",
  "kodepos_pengirim": "12190",
  "no_telepon_pengirim": "081234567890",
  "nama_penerima": "Riza",
  "alamat_penerima": "Malang, East Java",
  "provinsi_penerima": "Jawa Timur",
  "kota_penerima": "Malang",
  "kecamatan_penerima": "lemahputro",
  "kelurahan_penerima": "Kebayoran baru",
  "kodepos_penerima": "65145",
  "no_telepon_penerima": "081231710812",
  "layanan": "Sewa truck",
  "origin_latlng": "-6.2088,106.8456",
  "destination_latlng": "-7.2575,112.7521",
  "isUseToll": true,
  "toll_payment_method": 2,
  "truck_type": "Fuso",
  "pickup_time": "2025-09-01T01:00:00.000Z",
  "keterangan_barang": "Muatan sewa truck"
}
```

### Field Validation

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `nama_pengirim` | string | Yes | Not empty | Nama lengkap pengirim |
| `alamat_pengirim` | string | Yes | Max 35 karakter | Alamat lengkap pengirim |
| `provinsi_pengirim` | string | Yes | Not empty | Provinsi pengirim |
| `kota_pengirim` | string | Yes | Not empty | Kota pengirim |
| `kecamatan_pengirim` | string | Yes | Not empty | Kecamatan pengirim |
| `kelurahan_pengirim` | string | Yes | Not empty | Kelurahan pengirim |
| `kodepos_pengirim` | string | Yes | Not empty | Kode pos pengirim |
| `no_telepon_pengirim` | string | Yes | Not empty | Nomor telepon pengirim |
| `nama_penerima` | string | Yes | Not empty | Nama lengkap penerima |
| `alamat_penerima` | string | Yes | Max 35 karakter | Alamat lengkap penerima |
| `provinsi_penerima` | string | Yes | Not empty | Provinsi penerima |
| `kota_penerima` | string | Yes | Not empty | Kota penerima |
| `kecamatan_penerima` | string | Yes | Not empty | Kecamatan penerima |
| `kelurahan_penerima` | string | Yes | Not empty | Kelurahan penerima |
| `kodepos_penerima` | string | Yes | Not empty | Kode pos penerima |
| `no_telepon_penerima` | string | Yes | Not empty | Nomor telepon penerima |
| `layanan` | string | Yes | Not empty | Jenis layanan (harus "Sewa truck") |
| `origin_latlng` | string | Yes | Format: lat,lng | Koordinat asal |
| `destination_latlng` | string | Yes | Format: lat,lng | Koordinat tujuan |
| `isUseToll` | boolean | Yes | true/false | Apakah menggunakan rute tol |
| `toll_payment_method` | number | Yes | 1 atau 2 | Metode pembayaran tol (1: 70% 30%, 2: Full Payment) |
| `truck_type` | enum | Yes | "Fuso", "Wingbox", "CDD", "CDE", "Tronton" | Jenis truk |
| `pickup_time` | string | Yes | ISO 8601 date | Waktu pickup |
| `keterangan_barang` | string | No | Max 100 karakter | Deskripsi muatan |

## Response Format

### Success Response (201 Created)
```json
{
    "message": "Pesanan sewa truk berhasil dibuat",
    "data": {
        "no_tracking": "GG2025010100001",
        "layanan": "Sewa truck",
        "origin_latlng": "-6.2088,106.8456",
        "destination_latlng": "-7.2575,112.7521",
        "jarak_km": 140.2,
        "isUseToll": true,
        "toll_payment_method": 2,
        "truck_type": "Fuso",
        "pickup_time": "2025-09-01T01:00:00.000Z",
        "harga_dasar": "Rp350.560",
        "total_harga": "Rp350.560",
        "estimasi_waktu": "2 hari 8 jam",
        "keterangan_barang": "Muatan sewa truck",
        "status": "Ready for Pickup",
        "created_at": "2025-01-01T10:30:00.000Z"
    }
}
```

### Error Response (400 Bad Request)
```json
{
    "statusCode": 400,
    "message": "Format koordinat tidak valid. Gunakan format: lat,lng (contoh: -6.2088,106.8456)",
    "error": "Bad Request"
}
```

### Error Response (401 Unauthorized)
```json
{
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized"
}
```

### Error Response (500 Internal Server Error)
```json
{
    "statusCode": 500,
    "message": "Gagal membuat pesanan sewa truk: [error details]",
    "error": "Internal Server Error"
}
```

## Alur Logika Backend

### 1. Validasi dan Perhitungan
- **Validasi Input**: Semua field wajib divalidasi sesuai rules
- **Perhitungan Jarak**: Menggunakan Mapbox Directions API untuk mendapatkan jarak tempuh
- **Perhitungan Harga**: Menerapkan logika harga sewa truk:
  - Rp2.800/km untuk jarak < 500 km
  - Rp2.500/km untuk jarak >= 500 km
  - Minimum 55 km
- **Pemilihan Rute**: Berdasarkan `isUseToll` (tol vs non-tol)

### 2. Penyimpanan Database
- **Tabel `orders`**: Data pesanan utama
- **Tabel `order_shipments`**: Data shipment (1 koli untuk truk)
- **Tabel `order_histories`**: Audit trail dengan status dan remark
- **Tabel `order_lists`**: Data untuk listing pesanan

### 3. Database Fields yang Disimpan
```sql
-- orders table
no_tracking, user_id, layanan, nama_pengirim, alamat_pengirim, 
provinsi_pengirim, kota_pengirim, kecamatan_pengirim, kelurahan_pengirim, 
kodepos_pengirim, no_telepon_pengirim, nama_penerima, alamat_penerima, 
provinsi_penerima, kota_penerima, kecamatan_penerima, kelurahan_penerima, 
kodepos_penerima, no_telepon_penerima, nama_barang, harga_barang (0), 
asuransi (0), total_harga, order_by (user_id), latlngAsal, 
latlngTujuan, isUseToll, metode_bayar_truck, truck_type, pickup_time, 
hub_source_id, hub_dest_id, current_hub, next_hub, status, invoice_status

-- order_shipments table
order_id, qty (1), berat (0), panjang (0), lebar (0), tinggi (0), 
total_koli (1), total_berat (0), total_volume (0), total_berat_volume (0)

-- order_histories table
order_id, status, remark (dengan detail jarak dan harga)

-- order_lists table
no_tracking, nama_pengirim, alamat_pengirim, ..., nama_barang, status, total_harga
```

## Contoh Penggunaan

### JavaScript/TypeScript (Fetch API)
```javascript
const createTruckRentalOrder = async () => {
    const requestBody = {
        nama_pengirim: "budi testing",
        alamat_pengirim: "Jl. Mawar No. 1234",
        provinsi_pengirim: "DKI Jakarta",
        kota_pengirim: "Jakarta Selatan",
        kecamatan_pengirim: "Senayan",
        kelurahan_pengirim: "Kebayoran Baru",
        kodepos_pengirim: "12190",
        no_telepon_pengirim: "081234567890",
        nama_penerima: "Riza",
        alamat_penerima: "Malang, East Java",
        provinsi_penerima: "Jawa Timur",
        kota_penerima: "Malang",
        kecamatan_penerima: "lemahputro",
        kelurahan_penerima: "Kebayoran baru",
        kodepos_penerima: "65145",
        no_telepon_penerima: "081231710812",
        layanan: "Sewa truck",
        origin_latlng: "-6.2088,106.8456",
        destination_latlng: "-7.2575,112.7521",
        isUseToll: true,
        toll_payment_method: 2,
        truck_type: "Fuso",
        pickup_time: "2025-09-01T01:00:00.000Z",
        keterangan_barang: "Muatan sewa truck"
    };

    try {
        const response = await fetch('/orders/sewa-truk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_JWT_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Pesanan berhasil dibuat:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### cURL
```bash
curl -X POST "http://localhost:3000/orders/sewa-truk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nama_pengirim": "budi testing",
    "alamat_pengirim": "Jl. Mawar No. 1234",
    "provinsi_pengirim": "DKI Jakarta",
    "kota_pengirim": "Jakarta Selatan",
    "kecamatan_pengirim": "Senayan",
    "kelurahan_pengirim": "Kebayoran Baru",
    "kodepos_pengirim": "12190",
    "no_telepon_pengirim": "081234567890",
    "nama_penerima": "Riza",
    "alamat_penerima": "Malang, East Java",
    "provinsi_penerima": "Jawa Timur",
    "kota_penerima": "Malang",
    "kecamatan_penerima": "lemahputro",
    "kelurahan_penerima": "Kebayoran baru",
    "kodepos_penerima": "65145",
    "no_telepon_penerima": "081231710812",
    "layanan": "Sewa truck",
    "origin_latlng": "-6.2088,106.8456",
    "destination_latlng": "-7.2575,112.7521",
    "isUseToll": true,
    "toll_payment_method": 2,
    "truck_type": "Fuso",
    "pickup_time": "2025-09-01T01:00:00.000Z",
    "keterangan_barang": "Muatan sewa truck"
  }'
```

## Status dan Workflow

### Status Pesanan
- **Ready for Pickup**: Pesanan baru dibuat, menunggu pickup
- **Picked Up**: Truk sudah diambil
- **In Transit**: Truk dalam perjalanan
- **Out for Delivery**: Truk sudah sampai tujuan
- **Delivered**: Pesanan selesai

### Estimasi Waktu
- Berdasarkan kecepatan rata-rata 60 km/jam
- Format: "X jam" atau "X hari Y jam"
- Otomatis dihitung berdasarkan jarak

## Error Handling

### Validasi Koordinat
- Format harus: `lat,lng` (contoh: `-6.2088,106.8456`)
- Latitude: -90 sampai 90
- Longitude: -180 sampai 180

### Validasi Enum
- `toll_payment_method`: 1 (70% 30%) atau 2 (Full Payment)
- `truck_type`: "Fuso", "Wingbox", "CDD", "CDE", "Tronton"

### Database Transaction
- Semua operasi database dalam transaction
- Rollback otomatis jika ada error
- Audit trail lengkap untuk setiap operasi

## Integration

### Dependencies
- **RatesService**: Untuk perhitungan harga dan jarak
- **Mapbox API**: Untuk mendapatkan jarak tempuh
- **JWT Authentication**: Untuk validasi user
- **Database Transaction**: Untuk konsistensi data

### Related Endpoints
- `GET /rates/sewa-truk`: Estimasi harga sewa truk
- `GET /orders/:no_tracking`: Detail pesanan
- `GET /orders`: List pesanan

## Catatan Penting

1. **Authentication**: Wajib menggunakan JWT token
2. **Koordinat**: Format harus tepat (lat,lng)
3. **Harga**: Otomatis dihitung berdasarkan jarak dan rute
4. **Status**: Dimulai dari "Ready for Pickup"
5. **Audit Trail**: Setiap perubahan dicatat di order_histories
6. **Transaction**: Semua operasi database dalam transaction
7. **No Tracking**: Otomatis digenerate unik
8. **Hub Assignment**: Otomatis berdasarkan alamat pengirim/penerima
9. **Default Fields**: 
   - `harga_barang`: 0 (tidak berlaku untuk sewa truk)
   - `asuransi`: 0 (tidak berlaku untuk sewa truk)
   - `order_by`: Menggunakan user_id (integer)
   - **OrderShipment**: `qty` (1), `berat` (0), `panjang` (0), `lebar` (0), `tinggi` (0)
