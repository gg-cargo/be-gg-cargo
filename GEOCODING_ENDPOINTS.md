# Geocoding Endpoints Documentation

## Overview
Dokumentasi ini menjelaskan endpoint-endpoint untuk geocoding dan reverse geocoding yang menggunakan Nominatim API (OpenStreetMap).

## Endpoints

### 1. Reverse Geocoding
**Endpoint:** `GET /geocoding/reverse`

**Tujuan:** Mengkonversi koordinat geografis (latitude dan longitude) menjadi alamat yang dapat dibaca manusia.

#### Query Parameters

| Parameter | Tipe | Wajib | Deskripsi | Contoh |
|-----------|------|-------|-----------|--------|
| `lat` | string | Ya | Latitude (lintang) lokasi | `-6.2088` |
| `lon` | string | Ya | Longitude (bujur) lokasi | `106.8456` |

#### Contoh Request

```http
GET /geocoding/reverse?lat=-6.2088&lon=106.8456
```

#### Response Format

**Success Response (200 OK):**
```json
{
    "message": "Alamat berhasil ditemukan",
    "data": {
        "place_id": 123456789,
        "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
        "osm_type": "way",
        "osm_id": 123456789,
        "lat": "-6.2088",
        "lon": "106.8456",
        "display_name": "Jl. Sudirman, Kebayoran Baru, Jakarta Selatan, DKI Jakarta, 12190, Indonesia",
        "address": {
            "house_number": "123",
            "road": "Jl. Sudirman",
            "suburb": "Kebayoran Baru",
            "city_district": "Jakarta Selatan",
            "city": "Jakarta Selatan",
            "state": "DKI Jakarta",
            "postcode": "12190",
            "country": "Indonesia",
            "country_code": "id"
        },
        "boundingbox": [
            "-6.2098",
            "-6.2078",
            "106.8446",
            "106.8466"
        ]
    }
}
```

**Error Response (400 Bad Request):**
```json
{
    "statusCode": 400,
    "message": "Parameter lat (latitude) wajib diisi",
    "error": "Bad Request"
}
```

#### Validasi Input
- `lat` dan `lon` harus berupa angka
- `lat` harus berada dalam range -90 hingga 90
- `lon` harus berada dalam range -180 hingga 180
- Kedua parameter wajib diisi

---

### 2. Search Geocoding
**Endpoint:** `GET /geocoding/search`

**Tujuan:** Mengkonversi alamat atau kata kunci pencarian menjadi koordinat geografis.

#### Query Parameters

| Parameter | Tipe | Wajib | Deskripsi | Contoh |
|-----------|------|-------|-----------|--------|
| `q` | string | Ya | Kata kunci pencarian (alamat, nama tempat, dll) | `Jl. Sudirman Jakarta` |

#### Contoh Request

```http
GET /geocoding/search?q=Jl. Sudirman Jakarta
```

#### Response Format

**Success Response (200 OK):**
```json
{
    "message": "3 lokasi ditemukan",
    "data": [
        {
            "place_id": 123456789,
            "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
            "osm_type": "way",
            "osm_id": 123456789,
            "boundingbox": [
                "-6.2098",
                "-6.2078",
                "106.8446",
                "106.8466"
            ],
            "lat": "-6.2088",
            "lon": "106.8456",
            "display_name": "Jl. Sudirman, Kebayoran Baru, Jakarta Selatan, DKI Jakarta, 12190, Indonesia",
            "class": "highway",
            "type": "primary",
            "importance": 0.8
        },
        {
            "place_id": 987654321,
            "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
            "osm_type": "way",
            "osm_id": 987654321,
            "boundingbox": [
                "-6.2198",
                "-6.2178",
                "106.8546",
                "106.8566"
            ],
            "lat": "-6.2188",
            "lon": "106.8556",
            "display_name": "Jl. Sudirman, Menteng, Jakarta Pusat, DKI Jakarta, 10310, Indonesia",
            "class": "highway",
            "type": "primary",
            "importance": 0.7
        }
    ]
}
```

**Error Response (400 Bad Request):**
```json
{
    "statusCode": 400,
    "message": "Parameter q (query) wajib diisi",
    "error": "Bad Request"
}
```

#### Validasi Input
- Parameter `q` wajib diisi dan tidak boleh kosong
- Query akan di-encode untuk menghindari karakter khusus

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
- Parameter yang wajib tidak diisi
- Format parameter tidak valid
- Range koordinat di luar batas yang diizinkan

#### 500 Internal Server Error
- Gagal menghubungi Nominatim API
- Timeout saat melakukan request
- Format response tidak valid

### Error Codes dari Nominatim

#### 404 Not Found
- Untuk reverse geocoding: Tidak ada alamat yang ditemukan untuk koordinat tersebut
- Untuk search geocoding: Tidak ada lokasi yang cocok dengan query

#### 429 Too Many Requests
- Terlalu banyak permintaan dalam waktu singkat
- Rate limiting dari Nominatim API

## Catatan Penting

### Rate Limiting
- Nominatim API memiliki rate limiting
- Gunakan User-Agent yang sesuai untuk identifikasi aplikasi
- Implementasikan retry logic jika diperlukan

### Timeout
- Timeout default: 10 detik
- Jika timeout terjadi, akan mengembalikan error yang informatif

### Data Source
- Data berasal dari OpenStreetMap
- Selalu atributkan sumber data sesuai dengan licence yang diberikan

### Caching
- Pertimbangkan untuk mengimplementasikan caching untuk performa yang lebih baik
- Cache dapat dilakukan di level aplikasi atau menggunakan Redis

## Contoh Penggunaan

### Frontend Integration
```javascript
// Reverse Geocoding
const getAddressFromCoords = async (lat, lon) => {
    try {
        const response = await fetch(`/api/geocoding/reverse?lat=${lat}&lon=${lon}`);
        const data = await response.json();
        return data.data.display_name;
    } catch (error) {
        console.error('Error:', error);
    }
};

// Search Geocoding
const searchLocation = async (query) => {
    try {
        const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### Backend Service Usage
```typescript
// Menggunakan service di dalam controller lain
constructor(private readonly geocodingService: GeocodingService) {}

async someMethod() {
    // Reverse geocoding
    const address = await this.geocodingService.reverseGeocoding(-6.2088, 106.8456);
    
    // Search geocoding
    const locations = await this.geocodingService.searchGeocoding('Jakarta');
}
```
