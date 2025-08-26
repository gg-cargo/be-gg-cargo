import { Column, DataType, Model, Table, Index } from 'sequelize-typescript';

@Table({
    tableName: 'job_assigns',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
})
export class JobAssign extends Model<JobAssign> {
    @Column({
        type: DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    number: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    checker_name: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    checker_by: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    expeditor_name: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    expeditor_by: string | null;

    @Index
    @Column({ type: DataType.TEXT, allowNull: true })
    no_polisi: string | null;

    @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '0' })
    distance: string;

    @Index
    @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0, comment: '0: Process | 1: Completed | 2: Confirm' })
    status: number | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    remark: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    waypoints: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    konfirmasi_at: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    completed_at: string | null;

    @Column({ type: DataType.TEXT, allowNull: true })
    completed_day: string | null;

    @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
    created_at: Date;
}
