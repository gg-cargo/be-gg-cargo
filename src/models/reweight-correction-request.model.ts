import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import { Order } from './order.model';
import { OrderPiece } from './order-piece.model';
import { User } from './user.model';

export enum REWEIGHT_CORRECTION_STATUS {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2
}

export enum REWEIGHT_CORRECTION_ACTION_TYPE {
    ADD = 'ADD',
    UPDATE = 'UPDATE',
    REMOVE = 'REMOVE'
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

    @Index
    @Column({
        type: DataType.BIGINT,
        allowNull: true,
        comment: 'ID batch pengajuan koreksi reweight'
    })
    batch_id: number | null;

    @ForeignKey(() => OrderPiece)
    @Index
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        comment: 'ID piece yang dikoreksi'
    })
    piece_id: number | null;

    @Index
    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: REWEIGHT_CORRECTION_ACTION_TYPE.UPDATE,
        comment: 'ADD | UPDATE | REMOVE'
    })
    action_type: REWEIGHT_CORRECTION_ACTION_TYPE;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Berat saat ini sebelum koreksi'
    })
    current_berat: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Panjang saat ini sebelum koreksi'
    })
    current_panjang: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Lebar saat ini sebelum koreksi'
    })
    current_lebar: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Tinggi saat ini sebelum koreksi'
    })
    current_tinggi: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Berat baru yang diminta'
    })
    new_berat: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Panjang baru yang diminta'
    })
    new_panjang: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Lebar baru yang diminta'
    })
    new_lebar: number | null;

    @Column({
        type: DataType.DOUBLE,
        allowNull: true,
        comment: 'Tinggi baru yang diminta'
    })
    new_tinggi: number | null;

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
