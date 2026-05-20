import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { FleetTrip } from '../models/fleet-trip.model';
import { FleetTripAssignment } from '../models/fleet-trip-assignment.model';
import { Saldo } from '../models/saldo.model';
import { User } from '../models/user.model';
import { Vendor } from '../models/vendor.model';
import {
  FleetEstimateRoadType,
  FleetEstimateTripType,
} from './dto/fleet-estimate.dto';
import { calculateFleetOperationalEstimate } from './fleet-estimate.calculator';
import { CreditFleetDepositSaldoDto } from './dto/credit-fleet-deposit-saldo.dto';
import {
  CreditFleetDepositSaldoResponseDto,
  FleetDepositSaldoCreditItemDto,
} from './dto/credit-fleet-deposit-saldo-response.dto';

@Injectable()
export class FleetSaldoService {
  private readonly logger = new Logger(FleetSaldoService.name);

  constructor(
    @InjectModel(FleetTrip)
    private readonly fleetTripModel: typeof FleetTrip,
    @InjectModel(FleetTripAssignment)
    private readonly assignmentModel: typeof FleetTripAssignment,
    @InjectModel(Saldo) private readonly saldoModel: typeof Saldo,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Vendor) private readonly vendorModel: typeof Vendor,
  ) {}

  /**
   * Kredit deposit supir 1 & 2 (dari kalkulator fleet) ke saldo driver di tabel saldo.
   * Mendukung assignee mitra dan vendor.
   */
  async creditFleetTripDepositSaldo(
    trackingNo: string,
    actorUserId: number,
    body?: CreditFleetDepositSaldoDto,
  ): Promise<CreditFleetDepositSaldoResponseDto> {
    const trimmedTracking = trackingNo?.trim();
    if (!trimmedTracking) {
      throw new BadRequestException('tracking_no wajib diisi');
    }

    const trip = await this.fleetTripModel.findOne({
      where: { tracking_no: trimmedTracking },
      include: [
        {
          model: this.assignmentModel,
          as: 'assignment',
          required: false,
          include: [
            {
              association: 'driver1',
              attributes: ['id', 'name', 'freeze_saldo', 'kode_referral'],
              required: false,
            },
            {
              association: 'driver2',
              attributes: ['id', 'name', 'freeze_saldo', 'kode_referral'],
              required: false,
            },
            {
              association: 'vendor',
              attributes: ['id', 'nama_vendor'],
              required: false,
            },
          ],
        },
      ],
    });

    if (!trip) {
      throw new NotFoundException(`Fleet trip ${trimmedTracking} tidak ditemukan`);
    }

    if (trip.getDataValue('deposit_saldo_credited_at')) {
      throw new BadRequestException(
        'Deposit saldo untuk fleet trip ini sudah pernah dikredit',
      );
    }

    const assignment = trip.getDataValue('assignment') as FleetTripAssignment | undefined;
    if (!assignment) {
      throw new BadRequestException('Assignment fleet trip tidak ditemukan');
    }

    const assigneeType = assignment.getDataValue('assignee_type');
    if (assigneeType !== 'mitra' && assigneeType !== 'vendor') {
      throw new BadRequestException('assignee_type tidak valid');
    }

    if (assigneeType === 'vendor') {
      const vendorId = assignment.getDataValue('vendor_id');
      if (!vendorId) {
        throw new BadRequestException(
          'vendor_id wajib pada assignment trip vendor',
        );
      }
      const vendor = await this.vendorModel.findByPk(vendorId);
      if (!vendor) {
        throw new BadRequestException('vendor_id tidak ditemukan');
      }
    }

    const { driver1UserId, driver2UserId } = this.resolveDriverUserIds(
      assignment,
      body,
    );

    if (!driver1UserId) {
      throw new BadRequestException(
        assigneeType === 'vendor'
          ? 'driver_1_user_id wajib (simpan di assignment atau kirim di body) sebelum kredit deposit'
          : 'driver_1_user_id wajib diisi pada assignment trip sebelum kredit deposit',
      );
    }

    const distanceKmInput = this.resolveDistanceKmInputForCalculator(trip);
    let calc;
    try {
      calc = calculateFleetOperationalEstimate({
        kota_asal: trip.getDataValue('kota_asal'),
        kota_tujuan: trip.getDataValue('kota_tujuan'),
        trip_type: trip.getDataValue('trip_type') as FleetEstimateTripType,
        road_type: trip.getDataValue('road_type') as FleetEstimateRoadType,
        vehicle_type: trip.getDataValue('vehicle_type'),
        distance_km: distanceKmInput,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal menghitung deposit';
      throw new BadRequestException(msg);
    }

    const creditsPlan: Array<{
      driver_slot: 1 | 2;
      user_id: number;
      amount: number;
    }> = [];

    const deposit1 = calc.supir_1.deposit.total;
    if (deposit1 > 0) {
      creditsPlan.push({ driver_slot: 1, user_id: driver1UserId, amount: deposit1 });
    }

    const deposit2 = calc.supir_2.deposit.total;
    if (driver2UserId && deposit2 > 0) {
      creditsPlan.push({
        driver_slot: 2,
        user_id: driver2UserId,
        amount: deposit2,
      });
    }

    if (creditsPlan.length === 0) {
      throw new BadRequestException('Tidak ada deposit yang perlu dikredit');
    }

    const sequelize = this.fleetTripModel.sequelize;
    if (!sequelize) {
      throw new InternalServerErrorException('Database connection tidak tersedia');
    }

    const creditedAt = new Date();
    const creditResults: FleetDepositSaldoCreditItemDto[] = [];
    const tripId = Number(trip.getDataValue('id'));

    await sequelize.transaction(async (transaction) => {
      const lockedTrip = await this.fleetTripModel.findByPk(tripId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!lockedTrip) {
        throw new NotFoundException(`Fleet trip ${trimmedTracking} tidak ditemukan`);
      }

      if (lockedTrip.getDataValue('deposit_saldo_credited_at')) {
        throw new BadRequestException(
          'Deposit saldo untuk fleet trip ini sudah pernah dikredit',
        );
      }

      for (const plan of creditsPlan) {
        const result = await this.creditUserSaldo(plan.user_id, plan.amount, transaction);
        const user = await this.userModel.findByPk(plan.user_id, {
          attributes: ['id', 'name'],
          transaction,
        });

        creditResults.push({
          driver_slot: plan.driver_slot,
          user_id: plan.user_id,
          user_name: user?.getDataValue('name') ?? `User #${plan.user_id}`,
          deposit_amount: plan.amount,
          saldo_before: result.saldo_before,
          saldo_after: result.saldo_after,
        });
      }

      await lockedTrip.update(
        {
          deposit_saldo_credited_at: creditedAt,
          updated_at: creditedAt,
        },
        { transaction },
      );

      if (body?.driver_1_user_id != null || body?.driver_2_user_id != null) {
        const lockedAssignment = await this.assignmentModel.findOne({
          where: { fleet_trip_id: tripId },
          lock: transaction.LOCK.UPDATE,
          transaction,
        });
        if (lockedAssignment) {
          await lockedAssignment.update(
            {
              driver_1_user_id: driver1UserId,
              driver_2_user_id: driver2UserId ?? null,
            },
            { transaction },
          );
        }
      }
    });

    this.logger.log(
      `Fleet trip deposit saldo credited: tracking=${trimmedTracking}, assignee=${assigneeType}, trip_id=${tripId}, actor=${actorUserId}, credits=${creditResults.length}`,
    );

    return {
      success: true,
      message: 'Deposit supir berhasil dikredit ke saldo driver',
      data: {
        fleet_trip_id: tripId,
        tracking_no: trimmedTracking,
        deposit_saldo_credited_at: creditedAt,
        credits: creditResults,
      },
    };
  }

  private resolveDriverUserIds(
    assignment: FleetTripAssignment,
    body?: CreditFleetDepositSaldoDto,
  ): { driver1UserId: number | null; driver2UserId: number | null } {
    const fromAssignment1 = assignment.getDataValue('driver_1_user_id');
    const fromAssignment2 = assignment.getDataValue('driver_2_user_id');

    const driver1UserId =
      body?.driver_1_user_id != null
        ? Number(body.driver_1_user_id)
        : fromAssignment1 != null
          ? Number(fromAssignment1)
          : null;

    const driver2UserId =
      body?.driver_2_user_id != null
        ? Number(body.driver_2_user_id)
        : fromAssignment2 != null
          ? Number(fromAssignment2)
          : null;

    return { driver1UserId, driver2UserId };
  }

  /**
   * fleet_trips.distance_km_total = jarak efektif; kalkulator butuh jarak satu arah.
   */
  private resolveDistanceKmInputForCalculator(trip: FleetTrip): number {
    const effectiveKm = Number(trip.getDataValue('distance_km_total'));
    if (!Number.isFinite(effectiveKm) || effectiveKm <= 0) {
      throw new BadRequestException('distance_km_total trip tidak valid');
    }
    const tripType = trip.getDataValue('trip_type');
    if (tripType === 'two_way') {
      return effectiveKm / 2;
    }
    return effectiveKm;
  }

  private async creditUserSaldo(
    userId: number,
    amount: number,
    transaction: Transaction,
  ): Promise<{ saldo_before: number; saldo_after: number }> {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Nominal deposit harus lebih dari 0');
    }

    const user = await this.userModel.findByPk(userId, { transaction });
    if (!user) {
      throw new BadRequestException(`User driver id=${userId} tidak ditemukan`);
    }

    if (String(user.getDataValue('freeze_saldo')) === '1') {
      throw new BadRequestException(
        `Saldo user ${user.getDataValue('name')} sedang dibekukan (freeze_saldo)`,
      );
    }

    let saldoRow = await this.saldoModel.findOne({
      where: { user_id: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const creditAmount = Math.round(amount);

    if (!saldoRow) {
      const saldoBefore = 0;
      const saldoAfter = creditAmount;
      await this.saldoModel.create(
        {
          user_id: userId,
          kode_referral: this.resolveSaldoReferralCode(user),
          pin: 0,
          saldo: saldoAfter,
          saldo_dibekukan: 0,
        } as any,
        { transaction },
      );
      return { saldo_before: saldoBefore, saldo_after: saldoAfter };
    }

    const saldoBefore = Number(saldoRow.getDataValue('saldo') ?? 0);
    const saldoAfter = saldoBefore + creditAmount;
    await saldoRow.update({ saldo: saldoAfter }, { transaction });

    return { saldo_before: saldoBefore, saldo_after: saldoAfter };
  }

  private resolveSaldoReferralCode(user: User): string {
    const code = user.getDataValue('kode_referral');
    if (code && String(code).trim()) {
      return String(code).trim().slice(0, 20);
    }
    return `U${user.getDataValue('id')}`.slice(0, 20);
  }
}
