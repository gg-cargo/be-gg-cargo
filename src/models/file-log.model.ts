import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
    tableName: 'file_log',
    timestamps: false,
})
export class FileLog extends Model<FileLog> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'Uploader user ID',
    })
    user_id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        comment: 'Nama asli file',
    })
    file_name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        comment: 'Path atau URL file yang disimpan',
    })
    file_path: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
        comment: 'e.g. pdf, jpg, png',
    })
    file_type: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'Ukuran dalam bytes',
    })
    file_size: number;

    @Column({
        type: DataType.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: belum dipakai, 1: sudah dipakai',
    })
    is_assigned: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
        comment: 'Contoh: surat_jalan_balik, bukti_transfer, dll',
    })
    used_for: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updated_at: Date;
} 