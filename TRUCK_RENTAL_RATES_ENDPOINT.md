# Endpoint: GET /rates/sewa-truk

## Deskripsi
Endpoint ini memberikan estimasi harga pengiriman sewa truk secara dinamis berdasarkan jarak yang dihitung menggunakan Mapbox Directions API. Endpoint memproses logika harga berjenjang, biaya minimum, dan opsi rute tol.

## URL
```
GET /rates/sewa-truk
```

## Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `origin_latlng` | string | Yes | Koordinat geografis asal dalam format `lat,lng` | `-6.2088,106.8456` |
| `destination_latlng` | string | Yes | Koordinat geografis tujuan dalam format `lat,lng` | `-7.2575,112.7521` |
| `is_toll` | boolean | No | Filter untuk menampilkan rute tol saja (true), non-tol saja (false), atau keduanya (tidak diisi) | `true`, `false` |

## Contoh Request

### Menampilkan Kedua Rute (Default)
```bash
curl -X GET "http://localhost:3000/rates/sewa-truk?origin_latlng=-6.2088,106.8456&destination_latlng=-7.2575,112.7521"
```

### Menampilkan Rute Tol Saja
```bash
curl -X GET "http://localhost:3000/rates/sewa-truk?origin_latlng=-6.2088,106.8456&destination_latlng=-7.2575,112.7521&is_toll=true"
```

### Menampilkan Rute Non-Tol Saja
```bash
curl -X GET "http://localhost:3000/rates/sewa-truk?origin_latlng=-6.2088,106.8456&destination_latlng=-7.2575,112.7521&is_toll=false"
```

### Validasi Koordinat
- **Latitude**: Harus antara -90 dan 90
- **Longitude**: Harus antara -180 dan 180
- **Format**: `lat,lng` (contoh: `-6.2088,106.8456`)
- **Presisi**: Maksimal 6 digit desimal

## Response Format

### Success Response (200 OK)

#### Menampilkan Kedua Rute (Default)
```json
{
    "message": "Estimasi harga sewa truk berhasil dihitung",
    "data": {
        "origin": "-6.2088,106.8456",
        "destination": "-7.2575,112.7521",
        "estimasi_harga": {
            "non_tol": {
                "jarak_km": 150.5,
                "estimasi_waktu": "3 jam 1 menit",
                "harga_dasar": "Rp421.400",
                "total": "Rp421.400",
                "is_toll": false
            },
            "tol": {
                "jarak_km": 140.2,
                "estimasi_waktu": "2 jam 48 menit",
                "harga_dasar": "Rp350.560",
                "total": "Rp350.560",
                "is_toll": true
            }
        }
    }
}
```

#### Menampilkan Rute Tol Saja (is_toll=true)
```json
{
    "message": "Estimasi harga sewa truk berhasil dihitung",
    "data": {
        "origin": "-6.2088,106.8456",
        "destination": "-7.2575,112.7521",
        "jarak_km": 140.2,
        "estimasi_waktu": "2 jam 48 menit",
        "harga_dasar": "Rp350.560",
        "total": "Rp350.560",
        "is_toll": true
    }
}
```

#### Menampilkan Rute Non-Tol Saja (is_toll=false)
```json
{
    "message": "Estimasi harga sewa truk berhasil dihitung",
    "data": {
        "origin": "-6.2088,106.8456",
        "destination": "-7.2575,112.7521",
        "jarak_km": 150.5,
        "estimasi_waktu": "3 jam 1 menit",
        "harga_dasar": "Rp421.400",
        "total": "Rp421.400",
        "is_toll": false
    }
}
```

### Error Response (400 Bad Request)
```json
{
    "statusCode": 400,
    "message": "Parameter origin_latlng dan destination_latlng harus diisi",
    "error": "Bad Request"
}
```

### Error Response (400 Bad Request - Format Koordinat)
```json
{
    "statusCode": 400,
    "message": "Format koordinat tidak valid. Gunakan format: lat,lng (contoh: -6.2088,106.8456)",
    "error": "Bad Request"
}
```

### Error Response (400 Bad Request - Range Koordinat)
```json
{
    "statusCode": 400,
    "message": "Latitude harus antara -90 dan 90",
    "error": "Bad Request"
}
```

```json
{
    "statusCode": 400,
    "message": "Longitude harus antara -180 dan 180",
    "error": "Bad Request"
}
```

### Error Response (400 Bad Request - Parameter is_toll)
```json
{
    "statusCode": 400,
    "message": "Parameter is_toll harus berupa boolean (true atau false)",
    "error": "Bad Request"
}
```

### Error Response (500 Internal Server Error)
```json
{
    "statusCode": 500,
    "message": "Gagal mendapatkan data jarak dari Mapbox: [error details]",
    "error": "Internal Server Error"
}
```

## Logika Perhitungan

### 1. Jarak Efektif
- Sistem menggunakan jarak minimum 55 km
- `jarak_efektif = MAX(jarak_dari_mapbox, 55)`

### 2. Harga Berjenjang
- **Jarak < 500 km**: `harga_dasar = jarak_efektif * 2800`
- **Jarak >= 500 km**: `harga_dasar = jarak_efektif * 2500`

### 3. Total Harga
- **Non-tol**: `total = harga_dasar`
- **Tol**: `total = harga_dasar` (tanpa biaya tol terpisah)

## Integrasi Mapbox API

### Rute Non-tol
- URL: `https://api.mapbox.com/directions/v5/mapbox/driving/{origin};{destination}?exclude=toll&access_token={token}`
- Parameter `exclude=toll` digunakan untuk menghindari rute tol
- Mengembalikan jarak (distance) dan durasi (duration) dari Mapbox

### Rute Tol
- URL: `https://api.mapbox.com/directions/v5/mapbox/driving/{origin};{destination}?access_token={token}`
- Tanpa parameter `exclude=toll` untuk mendapatkan rute tercepat termasuk tol
- Mengembalikan jarak (distance) dan durasi (duration) dari Mapbox

### Fallback Calculation
- Jika Mapbox API tidak tersedia atau error, sistem akan menggunakan perhitungan Haversine formula untuk jarak
- Estimasi durasi fallback menggunakan kecepatan rata-rata 50 km/jam untuk truk

## Environment Variables

Pastikan environment variable berikut dikonfigurasi:
```env
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

## Contoh Penggunaan

### JavaScript/TypeScript
```typescript
const response = await fetch('/rates/sewa-truk?origin_latlng=-6.2088,106.8456&destination_latlng=-7.2575,112.7521');
const data = await response.json();

console.log('Estimasi non-tol:', data.estimasi_harga.non_tol);
console.log('Estimasi tol:', data.estimasi_harga.tol);
```

### Python
```python
import requests

params = {
    'origin_latlng': '-6.2088,106.8456',
    'destination_latlng': '-7.2575,112.7521'
}

response = requests.get('http://localhost:3000/rates/sewa-truk', params=params)
data = response.json()

print(f"Non-tol: {data['estimasi_harga']['non_tol']['total']} IDR")
print(f"Tol: {data['estimasi_harga']['tol']['total']} IDR")
```

## Catatan Penting

1. **Koordinat Format**: Gunakan format latitude,longitude (contoh: -6.2088,106.8456)
2. **Jarak Minimum**: Sistem akan menggunakan jarak minimum 55 km untuk perhitungan
3. **Filter Rute**: Parameter `is_toll` memungkinkan untuk memfilter jenis rute yang ditampilkan
4. **Estimasi Waktu**: Data durasi diambil langsung dari Mapbox API untuk akurasi maksimal
5. **Fallback Durasi**: Jika Mapbox API tidak tersedia, estimasi durasi menggunakan kecepatan rata-rata 50 km/jam
6. **Format Durasi**: Durasi ditampilkan dalam format yang mudah dibaca (jam, menit, hari)
7. **Optimasi API**: Jika hanya memerlukan satu jenis rute, gunakan parameter `is_toll` untuk mengurangi panggilan API
8. **Rate Limiting**: Mapbox API memiliki rate limiting, pastikan tidak melakukan terlalu banyak request
9. **Error Handling**: Sistem akan memberikan error yang informatif jika terjadi masalah dengan Mapbox API

## Testing

### Validasi Input
- Koordinat harus dalam format yang benar
- Kedua parameter (origin dan destination) harus diisi
- Koordinat harus berupa angka desimal yang valid

### Test Cases
1. **Jarak Pendek (< 55 km)**: Pastikan menggunakan jarak minimum 55 km
2. **Jarak Sedang (55-500 km)**: Pastikan menggunakan rate 2800 IDR/km
3. **Jarak Jauh (>= 500 km)**: Pastikan menggunakan rate 2500 IDR/km
4. **Koordinat Invalid**: Pastikan error handling berfungsi dengan baik
5. **Mapbox API Error**: Pastikan error dari Mapbox API ditangani dengan baik
