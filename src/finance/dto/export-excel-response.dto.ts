export class ExportExcelResponseDto {
    message: string;
    success: boolean;
    data: {
        file_name: string;
        url: string;
        total_records: number;
        export_date: string;
    };
}
