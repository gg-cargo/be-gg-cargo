import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import { Order } from './order.model';
import { OrderPiece } from './order-piece.model';
import { User } from './user.model';

export enum REWEIGHT_CORRECTION_STATUS {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2
}

@Table({
    tableName: 'reweight_correction_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
export class ReweightCorrectionRequest extends Model<ReweightCorrectionRequest> {
    declare id: number;

    @ForeignKey(() => Order)
    @Index
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
        comment: 'ID order yang dikoreksi'
    })
    order_id: number;

    @ForeignKey(() => OrderPiece)
    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'ID piece yang dikoreksi'
    })
    piece_id: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Berat saat ini sebelum koreksi'
    })
    current_berat: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Panjang saat ini sebelum koreksi'
    })
    current_panjang: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Lebar saat ini sebelum koreksi'
    })
    current_lebar: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Tinggi saat ini sebelum koreksi'
    })
    current_tinggi: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Berat baru yang diminta'
    })
    new_berat: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Panjang baru yang diminta'
    })
    new_panjang: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Lebar baru yang diminta'
    })
    new_lebar: number;

    @Column({
        type: DataType.DOUBLE,
        allowNull: false,
        comment: 'Tinggi baru yang diminta'
    })
    new_tinggi: number;

    @Column({
        type: DataType.STRING(35),
        allowNull: false,
        comment: 'Catatan koreksi (maks 35 karakter)'
    })
    note: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        comment: 'Alasan detail koreksi'
    })
    alasan_koreksi: string;

    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: REWEIGHT_CORRECTION_STATUS.PENDING,
        comment: '0: pending, 1: approved, 2: rejected'
    })
    status: REWEIGHT_CORRECTION_STATUS;

    @ForeignKey(() => User)
    @Index
    @Column({
        type: DataType.BIGINT,
        allowNull: false,
        comment: 'User yang mengajukan koreksi'
    })
    requested_by: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
        comment: 'User yang menyetujui/menolak koreksi'
    })
    approved_by: number;

    @Column({
        type: DataType.DATE,
        allowNull: true,
        comment: 'Waktu approval/rejection'
    })
    approved_at: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        comment: 'Alasan penolakan jika status = 2'
    })
    rejection_reason: string;

    @Index
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    updated_at: Date;

    // Associations
    @BelongsTo(() => Order, 'order_id')
    order: Order;

    @BelongsTo(() => OrderPiece, 'piece_id')
    piece: OrderPiece;

    @BelongsTo(() => User, 'requested_by')
    requester: User;

    @BelongsTo(() => User, 'approved_by')
    approver: User;
}
