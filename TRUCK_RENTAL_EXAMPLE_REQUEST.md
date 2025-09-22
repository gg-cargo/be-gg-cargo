# Contoh Request Endpoint POST /orders/sewa-truk

## Request Body dengan Format yang Benar

### Contoh 1: Pembayaran Full Payment (100%)
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

### Contoh 2: Pembayaran 70% 30%
```json
{
  "nama_pengirim": "Siti Nurhaliza",
  "alamat_pengirim": "Jl. Sudirman No. 100",
  "provinsi_pengirim": "Jawa Barat",
  "kota_pengirim": "Bandung",
  "kecamatan_pengirim": "Coblong",
  "kelurahan_pengirim": "Dago",
  "kodepos_pengirim": "40135",
  "no_telepon_pengirim": "081234567891",
  "nama_penerima": "Ahmad Rizki",
  "alamat_penerima": "Jl. Malioboro No. 1",
  "provinsi_penerima": "DI Yogyakarta",
  "kota_penerima": "Yogyakarta",
  "kecamatan_penerima": "Gondomanan",
  "kelurahan_penerima": "Ngupasan",
  "kodepos_penerima": "55122",
  "no_telepon_penerima": "081231710813",
  "layanan": "Sewa truck",
  "origin_latlng": "-6.9175,107.6191",
  "destination_latlng": "-7.7956,110.3695",
  "isUseToll": false,
  "toll_payment_method": 1,
  "truck_type": "Wingbox",
  "pickup_time": "2025-09-02T08:00:00.000Z",
  "keterangan_barang": "Barang elektronik"
}
```

### Contoh 3: Rute Tol dengan CDD
```json
{
  "nama_pengirim": "PT. Maju Jaya",
  "alamat_pengirim": "Kawasan Industri Cikarang",
  "provinsi_pengirim": "Jawa Barat",
  "kota_pengirim": "Bekasi",
  "kecamatan_pengirim": "Cikarang Selatan",
  "kelurahan_pengirim": "Cikarang Selatan",
  "kodepos_pengirim": "17530",
  "no_telepon_pengirim": "0211234567",
  "nama_penerima": "CV. Sukses Mandiri",
  "alamat_penerima": "Jl. Gatot Subroto No. 200",
  "provinsi_penerima": "Jawa Timur",
  "kota_penerima": "Surabaya",
  "kecamatan_penerima": "Gayungan",
  "kelurahan_penerima": "Menanggal",
  "kodepos_penerima": "60234",
  "no_telepon_penerima": "0311234567",
  "layanan": "Sewa truck",
  "origin_latlng": "-6.2615,107.1528",
  "destination_latlng": "-7.2575,112.7521",
  "isUseToll": true,
  "toll_payment_method": 2,
  "truck_type": "CDD",
  "pickup_time": "2025-09-03T14:30:00.000Z",
  "keterangan_barang": "Mesin industri"
}
```

## Field Validation

### toll_payment_method (Number)
- **1**: Pembayaran 70% 30%
- **2**: Full Payment/100%

### truck_type (String)
- **"Fuso"**: Truk Fuso
- **"Wingbox"**: Truk Wingbox
- **"CDD"**: Truk CDD
- **"CDE"**: Truk CDE
- **"Tronton"**: Truk Tronton

### isUseToll (Boolean)
- **true**: Menggunakan rute tol (jarak lebih pendek, estimasi lebih cepat)
- **false**: Menggunakan rute non-tol (jarak lebih panjang, estimasi lebih lama)

## cURL Examples

### Contoh 1: Full Payment
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

### Contoh 2: Pembayaran 70% 30%
```bash
curl -X POST "http://localhost:3000/orders/sewa-truk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nama_pengirim": "Siti Nurhaliza",
    "alamat_pengirim": "Jl. Sudirman No. 100",
    "provinsi_pengirim": "Jawa Barat",
    "kota_pengirim": "Bandung",
    "kecamatan_pengirim": "Coblong",
    "kelurahan_pengirim": "Dago",
    "kodepos_pengirim": "40135",
    "no_telepon_pengirim": "081234567891",
    "nama_penerima": "Ahmad Rizki",
    "alamat_penerima": "Jl. Malioboro No. 1",
    "provinsi_penerima": "DI Yogyakarta",
    "kota_penerima": "Yogyakarta",
    "kecamatan_penerima": "Gondomanan",
    "kelurahan_penerima": "Ngupasan",
    "kodepos_penerima": "55122",
    "no_telepon_penerima": "081231710813",
    "layanan": "Sewa truck",
    "origin_latlng": "-6.9175,107.6191",
    "destination_latlng": "-7.7956,110.3695",
    "isUseToll": false,
    "toll_payment_method": 1,
    "truck_type": "Wingbox",
    "pickup_time": "2025-09-02T08:00:00.000Z",
    "keterangan_barang": "Barang elektronik"
  }'
```

## Expected Response

### Success Response
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

## Notes

1. **toll_payment_method** harus berupa number (1 atau 2), bukan string
2. **isUseToll** menentukan apakah menggunakan rute tol atau non-tol
3. **Koordinat** harus dalam format `lat,lng` yang valid
4. **pickup_time** harus dalam format ISO 8601
5. **Authentication** diperlukan dengan Bearer Token
6. **Harga** akan dihitung otomatis berdasarkan jarak dan rute yang dipilih

