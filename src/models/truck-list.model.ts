import { Column, DataType, Model, Table, Index, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.model';

@Table({
    tableName: 'truck_list',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
})
export class TruckList extends Model<TruckList> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Index
    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    no_polisi: string;

    @Column({
        type: DataType.STRING(200),
        allowNull: true,
    })
    jenis_mobil: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    max_berat: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    max_volume: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    max_kubikasi: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    panjang: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    lebar: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    tinggi: string;

    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: '1:sedang digunakan, 0:tidak digunakan',
    })
    status: number;

    @Index
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    driver_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    used: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    image: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    price: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    priceLower: number;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    tol: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    handling: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    solar: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    ferrie: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    speed: number;

    @Index
    @Column({
        type: DataType.STRING(200),
        allowNull: false,
        defaultValue: '3AxlesTruck',
    })
    type: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    harga_solar: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    konsumsi_solar: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    kir_url: string;
    @Column({ type: DataType.TEXT, allowNull: true })
    stnk_url: string;

    // Associations
    @BelongsTo(() => User, 'driver_id')
    driver: User;
}
