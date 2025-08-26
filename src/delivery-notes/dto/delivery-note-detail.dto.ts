export class DeliveryNoteDetailTransporterDto {
    id: number;
    nama: string;
    no_polisi: string;
    jenis_kendaraan: string;
}

export class DeliveryNoteDetailHubDto {
    id: number;
    nama: string;
}

export class DeliveryNoteDetailOrderDto {
    no_tracking: string;
    pengirim: string;
    penerima: string;
    total_berat: string;
    jumlah_koli: number;
}

export class DeliveryNoteDetailRouteDto {
    asal: DeliveryNoteDetailHubDto;
    tujuan: DeliveryNoteDetailHubDto;
    transit: DeliveryNoteDetailHubDto | null;
}

export class DeliveryNoteDetailDto {
    id: number;
    no_delivery_note: string;
    tanggal: string | null;
    transporter: DeliveryNoteDetailTransporterDto;
    rute: DeliveryNoteDetailRouteDto;
    orders_list: DeliveryNoteDetailOrderDto[];
}

export class DeliveryNoteDetailResponseDto {
    status: string;
    delivery_note: DeliveryNoteDetailDto;
}
