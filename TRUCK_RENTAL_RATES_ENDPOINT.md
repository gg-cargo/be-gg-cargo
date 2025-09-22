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

## Contoh Request
```bash
curl -X GET "http://localhost:3000/rates/sewa-truk?origin_latlng=-6.2088,106.8456&destination_latlng=-7.2575,112.7521"
```

### Validasi Koordinat
- **Latitude**: Harus antara -90 dan 90
- **Longitude**: Harus antara -180 dan 180
- **Format**: `lat,lng` (contoh: `-6.2088,106.8456`)
- **Presisi**: Maksimal 6 digit desimal

## Response Format

### Success Response (200 OK)
```json
{
    "message": "Estimasi harga sewa truk berhasil dihitung",
    "data": {
        "origin": "-6.2088,106.8456",
        "destination": "-7.2575,112.7521",
        "estimasi_harga": {
            "non_tol": {
                "jarak_km": 150.5,
                "harga_dasar": "Rp421.400",
                "total": "Rp421.400"
            },
            "tol": {
                "jarak_km": 140.2,
                "harga_dasar": "Rp350.560",
                "total": "Rp350.560"
            }
        }
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
- URL: `https://api.mapbox.com/directions/v5/mapbox/driving-truck/{origin};{destination}?exclude=toll&access_token={token}`
- Parameter `exclude=toll` digunakan untuk menghindari rute tol

### Rute Tol
- URL: `https://api.mapbox.com/directions/v5/mapbox/driving-truck/{origin};{destination}?access_token={token}`
- Tanpa parameter `exclude=toll` untuk mendapatkan rute tercepat termasuk tol

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
3. **Biaya Tol**: Estimasi biaya tol adalah perkiraan (600 IDR/km) dan dapat disesuaikan
4. **Rate Limiting**: Mapbox API memiliki rate limiting, pastikan tidak melakukan terlalu banyak request
5. **Error Handling**: Sistem akan memberikan error yang informatif jika terjadi masalah dengan Mapbox API

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
