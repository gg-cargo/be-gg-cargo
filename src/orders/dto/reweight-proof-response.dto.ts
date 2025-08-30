export class ReweightProofResponseDto {
    id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    user_id: number;
    used_for: string;
    created_at: Date;
}

export class GetReweightProofResponseDto {
    message: string;
    success: boolean;
    data: {
        order_id: number;
        total_files: number;
        files: ReweightProofResponseDto[];
    };
}
