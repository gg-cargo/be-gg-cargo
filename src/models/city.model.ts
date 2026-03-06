import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Hub } from './hub.model';

@Table({
    tableName: 'city',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class City extends Model<City> {
    @Column({
        type: DataType.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    provinsi: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kota: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kecamatan: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kelurahan: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    kode_pos: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Apakah kota ini bisa sebagai asal/pengirim'
    })
    is_origin: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Apakah kota ini bisa sebagai tujuan/penerima'
    })
    is_destination: boolean;

    @Column({
        type: DataType.ENUM('active', 'inactive', 'limited'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Status coverage: active=full coverage, inactive=no coverage, limited=partial coverage'
    })
    coverage_status: 'active' | 'inactive' | 'limited';

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        comment: 'Catatan tambahan untuk coverage area'
    })
    coverage_notes: string;

    @ForeignKey(() => Hub)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'Hub asal untuk kota ini (opsional)'
    })
    hub_origin: number;

    @BelongsTo(() => Hub, 'hub_origin')
    hubOrigin: Hub;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    updated_at: Date;
} 