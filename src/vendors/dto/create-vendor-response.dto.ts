export class CreateVendorResponseDto {
  status: 'success';
  message: string;
  data: {
    vendor_id: number;
    nama_vendor: string;
    kode_vendor?: string;
    pic_nama: string;
    pic_email: string;
    status_vendor: string;
    created_at: Date;
  };
}

