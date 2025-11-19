import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction, Sequelize } from 'sequelize';
import { Order } from '../models/order.model';
import { OrderShipment } from '../models/order-shipment.model';
import { OrderPiece } from '../models/order-piece.model';
import { OrderHistory } from '../models/order-history.model';
import { OrderList } from '../models/order-list.model';
import { OrderReferensi } from '../models/order-referensi.model';
import { RequestCancel } from '../models/request-cancel.model';
import { User } from '../models/user.model';
import { CreateOrderDto, CreateOrderPieceDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderResponseDto } from './dto/order-response.dto';
import { TrackingHelper } from './helpers/tracking.helper';
import { generateResiPDF } from './helpers/generate-resi-pdf.helper';
import { generatePickupNotePDF } from './helpers/generate-pickup-note-pdf.helper';
import { generateDeliveryNotePDF } from './helpers/generate-delivery-note-pdf.helper';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { ReweightPieceDto } from './dto/reweight-piece.dto';
import { ReweightPieceResponseDto } from './dto/reweight-response.dto';
import { ReweightBulkDto } from './dto/reweight-bulk.dto';
import { ReweightBulkResponseDto } from './dto/reweight-bulk-response.dto';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { BypassReweightDto } from './dto/bypass-reweight.dto';
import { BypassReweightResponseDto } from './dto/bypass-reweight-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OpsOrdersQueryDto, OpsOrdersResponseDto, OrderOpsDto, CustomerDto, PaginationDto, SummaryStatisticsDto } from './dto/ops-orders.dto';
import { AvailableDriversQueryDto, AvailableDriversResponseDto, AvailableDriverDto, DriverLocationDto } from './dto/available-drivers.dto';
import { AssignDriverDto, AssignDriverResponseDto } from './dto/assign-driver.dto';
import { SubmitReweightDto, SubmitReweightResponseDto } from './dto/submit-reweight.dto';
import { EditReweightRequestDto, EditReweightRequestResponseDto } from './dto/edit-reweight-request.dto';
import { ORDER_STATUS, getOrderStatusFromPieces } from '../common/constants/order-status.constants';
import { INVOICE_STATUS } from '../common/constants/invoice-status.constants';
import { Op, fn, col, literal } from 'sequelize';
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';
import { OrderInvoice } from '../models/order-invoice.model';
import { OrderInvoiceDetail } from '../models/order-invoice-detail.model';
import { Bank } from '../models/bank.model';
import { Level } from '../models/level.model';
import { FileLog } from '../models/file-log.model';
import { ReweightCorrectionRequest } from '../models/reweight-correction-request.model';
import { OrderDeliveryNote } from '../models/order-delivery-note.model';
import { FileService } from '../file/file.service';
import { DriversService } from '../drivers/drivers.service';
import { Hub } from '../models/hub.model';
import { generateOrderLabelsPDF } from './helpers/generate-order-labels-pdf.helper';
import { NotificationBadgesService } from '../notification-badges/notification-badges.service';
import { ReportMissingItemDto } from './dto/report-missing-item.dto';
import { ResolveMissingItemDto } from './dto/resolve-missing-item.dto';
import { ForwardToVendorDto, ForwardToVendorResponseDto } from './dto/forward-to-vendor.dto';
import { getOrderHistoryDateTime } from '../common/utils/date.utils';
import { OrderKendala } from '../models/order-kendala.model';
import { ListOrdersDto } from './dto/list-orders.dto';
import { CreateTruckRentalOrderDto } from './dto/create-truck-rental-order.dto';
import { CreateTruckRentalOrderResponseDto } from './dto/create-truck-rental-order-response.dto';
import { RatesService } from '../rates/rates.service';
import { ListTruckRentalDto } from './dto/list-truck-rental.dto';
import { AssignTruckRentalDto } from './dto/assign-truck-rental.dto';
import { AssignTruckRentalResponseDto } from './dto/assign-truck-rental-response.dto';
import type { Express } from 'express';
import { UpdateItemDetailsDto } from './dto/update-item-details.dto';
import { UpdateItemDetailsResponseDto } from './dto/update-item-details-response.dto';
import { JobAssign } from '../models/job-assign.model';
import { TruckList } from '../models/truck-list.model';
import { RevertInTransitDto, RevertInTransitResponseDto } from './dto/revert-in-transit.dto';
import { StartDeliveryDto, StartDeliveryResponseDto } from './dto/start-delivery.dto';
import { BypassInboundDto, BypassInboundResponseDto } from './dto/bypass-inbound.dto';
import { AssignVendorTrackingDto, AssignVendorTrackingResponseDto } from './dto/assign-vendor-tracking.dto';
import { Vendor } from '../models/vendor.model';
import { OrderPickupDriver } from '../models/order-pickup-driver.model';
import { OrderDeliverDriver } from '../models/order-deliver-driver.model';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderShipment)
        private readonly orderShipmentModel: typeof OrderShipment,
        @InjectModel(OrderPiece)
        private readonly orderPieceModel: typeof OrderPiece,
        @InjectModel(OrderHistory)
        private readonly orderHistoryModel: typeof OrderHistory,
        @InjectModel(OrderList)
        private readonly orderListModel: typeof OrderList,
        @InjectModel(OrderReferensi)
        private readonly orderReferensiModel: typeof OrderReferensi,
        @InjectModel(RequestCancel)
        private readonly requestCancelModel: typeof RequestCancel,
        @InjectModel(User)
        private readonly userModel: typeof User,
        @InjectModel(OrderInvoice)
        private readonly orderInvoiceModel: typeof OrderInvoice,
        @InjectModel(OrderInvoiceDetail)
        private readonly orderInvoiceDetailModel: typeof OrderInvoiceDetail,
        @InjectModel(OrderKendala)
        private readonly orderKendalaModel: typeof OrderKendala,
        @InjectModel(Bank)
        private readonly bankModel: typeof Bank,
        @InjectModel(Level)
        private readonly levelModel: typeof Level,
        @InjectModel(FileLog)
        private readonly fileLogModel: typeof FileLog,
        @InjectModel(ReweightCorrectionRequest)
        private readonly reweightCorrectionRequestModel: typeof ReweightCorrectionRequest,
        @InjectModel(OrderDeliveryNote)
        private readonly orderDeliveryNoteModel: typeof OrderDeliveryNote,
        @InjectModel(Hub)
        private readonly hubModel: typeof Hub,
        @InjectModel(JobAssign)
        private readonly jobAssignModel: typeof JobAssign,
        @InjectModel(TruckList)
        private readonly truckListModel: typeof TruckList,
        @InjectModel(Vendor)
        private readonly vendorModel: typeof Vendor,
        @InjectModel(OrderPickupDriver)
        private readonly orderPickupDriverModel: typeof OrderPickupDriver,
        @InjectModel(OrderDeliverDriver)
        private readonly orderDeliverDriverModel: typeof OrderDeliverDriver,
        private readonly fileService: FileService,
        private readonly driversService: DriversService,
        private readonly notificationBadgesService: NotificationBadgesService,
        private readonly ratesService: RatesService,
        @Inject('SEQUELIZE') private readonly sequelize: Sequelize,
    ) { }

    /**
     * Helper function untuk menyimpan foto bukti bypass reweight
     */
    private async saveProofImage(
        proofImage: Express.Multer.File,
        orderId: number,
        userId: number,
        transaction?: Transaction,
        usedFor: string = 'bypass_reweight_proof'
    ): Promise<FileLog> {
        try {
            // Upload file menggunakan FileService
            const uploadResult = await this.fileService.createFileLog(
                proofImage,
                userId,
                usedFor
            );

            // Assign file (set is_assigned = 1)
            await this.fileService.assignFile(uploadResult.data.id);

            // Ambil file log yang sudah dibuat
            const fileLog = await this.fileLogModel.findByPk(uploadResult.data.id);
            if (!fileLog) {
                throw new Error('File log tidak ditemukan setelah upload');
            }

            return fileLog;
        } catch (error) {
            console.error('Error saving proof image:', error);
            throw error;
        }
        // Note: FileService tidak menggunakan transaction, jadi kita tidak bisa rollback file upload
        // Jika ada error setelah file upload, file akan tetap tersimpan di storage
    }

    /**
     * Ubah status dari 'In Transit' ke kondisi 'menunggu pengiriman' (reweight_status = 1)
     */
    async revertInTransitToWaiting(
        noTracking: string,
        dto: RevertInTransitDto,
        updatedByUserId: number
    ): Promise<RevertInTransitResponseDto> {
        const transaction = await this.orderModel.sequelize!.transaction();
        try {
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking },
                attributes: ['id', 'no_tracking', 'status', 'reweight_status', 'assign_driver', 'hub_dest_id'],
                transaction,
                lock: transaction.LOCK.UPDATE as any
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            const currentStatus = order.getDataValue('status');
            if (currentStatus === 'Delivered' || currentStatus === 'Out for Delivery') {
                throw new BadRequestException('Order tidak dapat diubah dari status saat ini');
            }
            if (currentStatus !== 'In Transit') {
                if (order.getDataValue('reweight_status') === 1) {
                    await transaction.commit();
                    return {
                        message: 'Order sudah dalam status menunggu pengiriman',
                        data: {
                            no_tracking: order.getDataValue('no_tracking'),
                            status: order.getDataValue('status'),
                            reweight_status: order.getDataValue('reweight_status'),
                            hub_dest_id: order.getDataValue('hub_dest_id') ?? null,
                        }
                    };
                }
                throw new BadRequestException('Order bukan dalam status In Transit');
            }

            const updateData: any = {
                reweight_status: 1,
                status: 'Pending',
                assign_driver: 0,
                updated_at: new Date()
            };
            if (dto?.hub_id !== undefined) {
                updateData.hub_dest_id = dto.hub_id;
            }

            await this.orderModel.update(updateData, { where: { id: order.getDataValue('id') }, transaction });

            await transaction.commit();

            return {
                message: 'Status berhasil diubah ke menunggu pengiriman',
                data: {
                    no_tracking: order.getDataValue('no_tracking'),
                    status: updateData.status,
                    reweight_status: updateData.reweight_status,
                    hub_dest_id: updateData.hub_dest_id ?? order.getDataValue('hub_dest_id') ?? null
                }
            };
        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error revertInTransitToWaiting: ${error.message}`);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Gagal mengubah status order');
        }
    }


    async startDeliveryFromInTransit(
        noTracking: string,
        dto: StartDeliveryDto,
        updatedByUserId: number
    ): Promise<StartDeliveryResponseDto> {
        const transaction = await this.orderModel.sequelize!.transaction();
        try {
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking },
                attributes: ['id', 'no_tracking', 'status'],
                transaction,
                lock: transaction.LOCK.UPDATE as any
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            const currentStatus = order.getDataValue('status');

            if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
                throw new BadRequestException(`Order tidak dapat diubah dari status ${currentStatus}`);
            }

            if (currentStatus === 'Out for Delivery') {
                return {
                    message: 'Order sudah dalam status Order Kirim (Out for Delivery)',
                    data: {
                        no_tracking: order.getDataValue('no_tracking'),
                        status: 'Out for Delivery'
                    }
                };
            }

            await this.orderModel.update({
                status: 'Out for Delivery',
                updated_at: new Date()
            }, { where: { id: order.getDataValue('id') }, transaction });

            await transaction.commit();

            return {
                message: 'Status berhasil diubah ke Order Kirim (Out for Delivery)',
                data: {
                    no_tracking: order.getDataValue('no_tracking'),
                    status: 'Out for Delivery'
                }
            };
        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error startDeliveryFromInTransit: ${error.message}`);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Gagal mengubah status order');
        }
    }

    /**
     * Bypass inbound receive: terima barang di hub secara manual untuk kasus khusus.
     * - Otorisasi: hanya level 3 (Admin) atau 7 (Ops) yang diizinkan.
     * - Update: set current_hub ke hub_id, pertahankan status ke In Transit (ready for outbound secara operasional).
     * - History: catat 'Tiba di Hub (Bypass Manual)' dengan remark berisi alasan dan nama petugas.
     */
    async bypassInboundReceive(dto: BypassInboundDto): Promise<BypassInboundResponseDto> {
        if (!this.orderModel.sequelize) {
            throw new InternalServerErrorException('Database connection tidak tersedia');
        }
        const transaction = await this.orderModel.sequelize.transaction();

        try {
            const { no_tracking, hub_id, action_by_user_id } = dto;

            // 1) Validasi user dan otorisasi
            const actor = await this.userModel.findByPk(action_by_user_id, { transaction });
            if (!actor) {
                throw new NotFoundException('User yang melakukan bypass tidak ditemukan');
            }

            // 2) Validasi hub
            const hub = await this.hubModel.findByPk(hub_id, {
                attributes: ['id', 'nama'],
                transaction,
            });
            if (!hub) {
                throw new NotFoundException('Hub tidak ditemukan');
            }

            // 3) Validasi order
            const order = await this.orderModel.findOne({
                where: { no_tracking },
                attributes: ['id', 'no_tracking', 'status', 'current_hub'],
                transaction,
                lock: transaction.LOCK.UPDATE as any
            });
            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            const now = new Date();
            await this.orderPieceModel.update({
                inbound_status: 1,
                hub_current_id: hub_id,
                inbound_by: action_by_user_id,
                updatedAt: now
            }, {
                where: { order_id: order.getDataValue('id') },
                transaction
            });

            await this.orderModel.update({
                current_hub: String(hub_id),
                issetManifest_inbound: 1,
                issetManifest_outbound: 0,
                updatedAt: now
            }, {
                where: { id: order.getDataValue('id') },
                transaction
            });

            await transaction.commit();

            return {
                status: 'success',
                message: `Penerimaan barang ${no_tracking} berhasil diproses secara manual (Bypass)`,
                order: {
                    no_tracking,
                    current_status: 'READY FOR OUTBOUND',
                    bypassed_by: actor.getDataValue('name')
                }
            };
        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error bypassInboundReceive: ${error.message}`);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Gagal memproses bypass inbound');
        }
    }
    async listTruckRentalOrders(userId: number, q: ListTruckRentalDto) {
        try {
            const page = Math.max(1, Number(q.page) || 1);
            const limit = Math.max(1, Math.min(100, Number(q.limit) || 20));
            const offset = (page - 1) * limit;

            const where: any = { layanan: 'Sewa truck' };

            if (q.search) {
                where[Op.or] = [
                    { no_tracking: { [Op.like]: `%${q.search}%` } },
                    { nama_pengirim: { [Op.like]: `%${q.search}%` } },
                    { nama_penerima: { [Op.like]: `%${q.search}%` } },
                ];
            }
            if (q.status_pengiriman) where.status = q.status_pengiriman;
            if (q.status_pembayaran) where.invoiceStatus = q.status_pembayaran;
            // Filter hub
            if (q.hub_source_id) where.hub_source_id = q.hub_source_id;
            if (q.hub_dest_id) where.hub_dest_id = q.hub_dest_id;
            if (q.current_hub) where.current_hub = q.current_hub;
            if (q.date_from && q.date_to) {
                const from = new Date(q.date_from);
                const to = new Date(q.date_to);
                if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                    where.created_at = { [Op.between]: [from, to] };
                }
            }

            const include = [
                { model: this.userModel, as: 'orderUser', attributes: [], required: false },
                { model: this.orderShipmentModel, as: 'shipments', attributes: [], required: false },
                { model: this.orderInvoiceModel, as: 'orderInvoice', attributes: [], required: false },
                { model: this.orderKendalaModel, as: 'kendala', attributes: [], required: false },
            ];

            const sortField = q.sort_by || 'created_at';
            const sortOrder = (q.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

            const { count, rows } = await this.orderModel.findAndCountAll({
                where,
                include,
                attributes: [
                    'id',
                    'no_tracking',
                    'nama_pengirim',
                    'nama_penerima',
                    'status',
                    'invoiceStatus',
                    'distance',
                    'total_harga',
                    'order_by',
                    'created_at',
                    'truck_type',
                    'hub_source_id',
                    'hub_dest_id',
                    [fn('MAX', col('orderUser.name')), 'order_user_name'],
                    [fn('COUNT', col('kendala.id')), 'kendala_count'],
                    [fn('SUM', col('shipments.qty')), 'total_koli'],
                ],
                group: ['Order.id'],
                order: [[sortField, sortOrder]],
                limit,
                offset,
                raw: true,
                subQuery: false,
            });

            // Get hub codes for all orders using raw SQL approach
            const orderIds = rows.map((r: any) => r.id);
            const hubCodes: any = {};

            if (orderIds.length > 0) {
                // Get unique hub IDs from orders
                const hubSourceIds = [...new Set(rows.map((r: any) => r.hub_source_id).filter(Boolean))];
                const hubDestIds = [...new Set(rows.map((r: any) => r.hub_dest_id).filter(Boolean))];
                const allHubIds = [...new Set([...hubSourceIds, ...hubDestIds])];

                if (allHubIds.length > 0) {
                    const hubData = await this.hubModel.findAll({
                        where: { id: { [Op.in]: allHubIds } },
                        attributes: ['id', 'kode'],
                        raw: true,
                    });

                    // Create mapping from hub ID to code
                    const hubIdToCode: any = {};
                    hubData.forEach((hub: any) => {
                        hubIdToCode[hub.id] = hub.kode;
                    });

                    // Map hub codes to order IDs
                    rows.forEach((order: any) => {
                        hubCodes[order.id] = {
                            origin_hub_code: order.hub_source_id ? hubIdToCode[order.hub_source_id] || null : null,
                            dest_hub_code: order.hub_dest_id ? hubIdToCode[order.hub_dest_id] || null : null,
                        };
                    });
                }
            }

            const data = rows.map((r: any) => ({
                id: r.id,
                tracking: r.no_tracking,
                pengirim: r.nama_pengirim,
                penerima: r.nama_penerima,
                transporter: r.transporter_name || null,
                kilo_meter: r.distance ? Number(r.distance) : null,
                total_harga: r.total_harga ?? 0,
                pembayaran: r.invoiceStatus,
                pengiriman: r.status,
                kendala: Number(r.kendala_count || 0),
                metode: r.payment_method || null,
                order_by: r.order_user_name || null,
                coo: r.coo || null,
                created_at: r.created_at,
                origin_hub_code: hubCodes[r.id]?.origin_hub_code || null,
                dest_hub_code: hubCodes[r.id]?.dest_hub_code || null,
                truck_type: r.truck_type || null,
            }));

            const totalItems = Array.isArray(count) ? count.length : (count as unknown as number);
            const totalPages = Math.ceil(totalItems / limit);

            return {
                message: 'Data sewa truk berhasil diambil',
                pagination: { page, limit, total_items: totalItems, total_pages: totalPages },
                data,
            };
        } catch (error) {
            this.logger.error('Gagal mengambil data sewa truk', error.stack || error.message);
            throw new InternalServerErrorException('Gagal mengambil data sewa truk');
        }
    }

    async assignTruckRental(noTracking: string, assignTruckRentalDto: AssignTruckRentalDto): Promise<AssignTruckRentalResponseDto> {
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const { transporter_user_id, truck_id, estimated_departure_time, assigned_by_user_id } = assignTruckRentalDto;

            // 1. Validasi Order
            const order = await this.orderModel.findOne({
                where: {
                    no_tracking: noTracking,
                    layanan: 'Sewa truck'
                },
                transaction
            });

            if (!order) {
                throw new NotFoundException('Order sewa truk tidak ditemukan');
            }

            // 2. Validasi Transporter (level 4)
            const transporter = await this.userModel.findOne({
                where: {
                    id: transporter_user_id,
                    level: 4
                },
                transaction
            });

            if (!transporter) {
                throw new BadRequestException('Transporter tidak valid atau tidak memiliki level 4');
            }

            // 3. Validasi Ketersediaan Truck
            const truck = await this.truckListModel.findOne({
                where: {
                    id: truck_id,
                    status: 0 // tidak digunakan
                },
                transaction
            });

            if (!truck) {
                throw new BadRequestException('Truck tidak tersedia atau sedang digunakan');
            }

            // 4. Update Order Status dan Assignment
            await order.update({
                status: ORDER_STATUS.PICKED_UP,
                transporter_id: transporter_user_id.toString(),
                truck_id: truck_id.toString(),
                assign_driver: assigned_by_user_id,
                updated_at: new Date()
            }, { transaction });

            // 5. Update Truck Status
            await truck.update({
                status: 1, // sedang digunakan
            }, { transaction });

            // 6. Create Job Assignment Record
            await this.jobAssignModel.create({
                number: noTracking,
                expeditor_name: transporter.name,
                expeditor_by: transporter_user_id.toString(),
                no_polisi: truck.no_polisi,
                status: 0, // Process
                distance: order.distance || '0',
                created_at: new Date()
            } as any, { transaction });

            // Buat order history dengan format tanggal dan waktu yang benar
            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: order.id,
                status: 'Driver Assigned for Pickup truk',
                remark: `Order ditugaskan kepada ${transporter.name} untuk sewa truk`,
                date: date,
                time: time,
                created_by: assigned_by_user_id,
                created_at: new Date(),
                provinsi: '', // default empty string untuk field wajib
                kota: ''     // default empty string untuk field wajib
            }, { transaction });

            await transaction.commit();

            return {
                message: 'Transporter dan truck berhasil ditugaskan untuk sewa truk',
                data: {
                    no_tracking: noTracking,
                    transporter_user_id,
                    truck_id,
                    estimated_departure_time,
                    assigned_by_user_id,
                    status: 'In Transit',
                    updated_at: new Date()
                }
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error('Error assigning truck rental:', error);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Gagal menugaskan transporter dan truck');
        }
    }

    async updateItemDetails(noTracking: string, updateItemDetailsDto: UpdateItemDetailsDto, userId: number): Promise<UpdateItemDetailsResponseDto> {
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const { total_koli, total_berat, total_kubikasi } = updateItemDetailsDto;

            // 1. Validasi Order
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking },
                transaction,
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // 2. Simpan nilai lama untuk audit trail
            const oldValues = {
                total_koli: order.getDataValue('total_koli'),
                total_berat: order.getDataValue('total_berat'),
                sewaTruckKoli: order.sewaTruckKoli,
                sewaTruckBerat: order.getDataValue('sewaTruckBerat'),
                countUpdateKoli: order.getDataValue('countUpdateKoli'),
            };

            // 3. Siapkan data untuk update berdasarkan layanan
            const updateData: any = {
                updated_at: new Date()
            };

            if (order.getDataValue('layanan') === "Sewa truck") {
                // Untuk layanan Sewa truck, update sewaTruckKoli dan sewaTruckBerat
                if (total_koli !== undefined) updateData.sewaTruckKoli = total_koli.toString();
                if (total_berat !== undefined) updateData.sewaTruckBerat = total_berat.toString();
            } else {
                // Untuk layanan lain, update countUpdateKoli dan total_berat
                if (total_koli !== undefined) updateData.countUpdateKoli = total_koli;
                if (total_berat !== undefined) updateData.total_berat = total_berat.toString();
            }

            // Update total_kubikasi untuk semua layanan
            if (total_kubikasi !== undefined) {
                updateData.total_kubikasi = total_kubikasi;
            }

            // 4. Update Order
            await order.update(updateData, { transaction });

            await transaction.commit();

            // 7. Response berdasarkan layanan
            const responseData: any = {
                no_tracking: noTracking,
                updated_at: new Date()
            };

            if (order.getDataValue('layanan') == 'Sewa truck') {
                responseData.jumlah_koli = total_koli !== undefined ? total_koli : parseInt(order.sewaTruckKoli || '0');
                responseData.total_berat = total_berat !== undefined ? total_berat : parseFloat(order.sewaTruckBerat || '0');
            } else {
                responseData.jumlah_koli = total_koli !== undefined ? total_koli : order.countUpdateKoli;
                responseData.total_berat = total_berat !== undefined ? total_berat : parseFloat(order.total_berat || '0');
            }

            // Ambil total_kubikasi dari database (baik yang baru diupdate atau yang sudah ada)
            responseData.total_kubikasi = total_kubikasi !== undefined ? total_kubikasi : parseFloat(order.total_kubikasi?.toString() || '0');

            return {
                message: 'Detail barang master berhasil diperbarui',
                order: responseData
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error('Error updating item details:', error);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Gagal memperbarui detail barang');
        }
    }

    /**
     * Cari hub yang cocok berdasarkan provinsi/kota/alamat.
     * Strategi sederhana: cocokan nama kota terlebih dahulu, jika tidak ketemu gunakan provinsi,
     * jika masih tidak ketemu, fallback ke hub id 1.
     */
    private async findHubIdForAddress(
        provinsi?: string,
        kota?: string,
        alamat?: string,
    ): Promise<number> {
        try {
            const normalizedCity = (kota || '').toLowerCase();
            const normalizedProvince = (provinsi || '').toLowerCase();
            const normalizedAddress = (alamat || '').toLowerCase();

            // Pecah kota menjadi token kata: contoh "jakarta selatan" => ["jakarta", "selatan"]
            const cityTokens = normalizedCity
                .split(/[^a-z0-9]+/g)
                .map(t => t.trim())
                .filter(t => t.length > 0);

            // 1) Cari berdasarkan kota (utuh atau token) di kolom alamat atau lokasi
            if (normalizedCity) {
                const cityWhereOr: any[] = [
                    { alamat: { [Op.like]: `%${normalizedCity}%` } },
                    { lokasi: { [Op.like]: `%${normalizedCity}%` } },
                ];
                for (const token of cityTokens) {
                    cityWhereOr.push({ alamat: { [Op.like]: `%${token}%` } });
                    cityWhereOr.push({ lokasi: { [Op.like]: `%${token}%` } });
                }

                const byCity = await this.hubModel.findOne({
                    where: { [Op.or]: cityWhereOr },
                    attributes: ['id'],
                });
                if (byCity) return byCity.id;
            }

            // Default hub id 0 jika tidak ditemukan
            return 0;
        } catch (err) {
            // Jika terjadi error, fallback default hub 0
            return 0;
        }
    }

    /**
     * Helper function untuk auto-create invoice ketika bypass reweight diaktifkan
     */
    private async autoCreateInvoice(orderId: number, transaction: Transaction): Promise<any> {
        try {
            // Ambil data order
            const order = await this.orderModel.findByPk(orderId, {
                transaction,
                include: [
                    { model: this.orderPieceModel, as: 'pieces' },
                    { model: this.orderInvoiceModel, as: 'orderInvoice' }
                ]
            });

            if (!order) {
                throw new Error('Order tidak ditemukan');
            }

            // Validasi apakah sudah ada invoice
            if (order.getDataValue('orderInvoice') && order.getDataValue('orderInvoice').getDataValue('invoice_no')) {
                return null; // Sudah ada invoice
            }

            // Ambil info bank default
            const bank = await this.bankModel.findOne({ transaction });
            if (!bank) {
                throw new Error('Info bank perusahaan belum diatur');
            }

            // Generate invoice number berdasarkan no_tracking
            const noTracking = order.getDataValue('no_tracking');
            let invoice_no = noTracking;

            // Cek apakah sudah ada invoice dengan no_tracking yang sama
            const existingInvoice = await this.orderInvoiceModel.findOne({
                where: {
                    [Op.or]: [
                        { invoice_no: noTracking },
                        { invoice_no: { [Op.like]: `${noTracking}-%` } }
                    ]
                },
                order: [['invoice_no', 'DESC']],
                transaction
            });

            if (existingInvoice && existingInvoice.invoice_no !== noTracking) {
                // Jika ada invoice dengan format no_tracking-xxx, gunakan format berikutnya
                const match = existingInvoice.invoice_no.match(new RegExp(`${noTracking}-(\\d+)`));
                if (match) {
                    const nextNumber = parseInt(match[1], 10) + 1;
                    invoice_no = `${noTracking}-${String(nextNumber).padStart(3, '0')}`;
                } else {
                    invoice_no = `${noTracking}-001`;
                }
            }

            const now = new Date();
            const invoice_date = now.toISOString().split('T')[0];

            // Komponen biaya
            const items: {
                description: string;
                qty: number;
                uom: string;
                unit_price: number;
                remark: string;
            }[] = [];

            // Hitung chargeable weight berdasarkan order shipments
            let totalWeight = 0;
            let totalVolume = 0;
            let totalBeratVolume = 0;

            // Ambil semua shipments untuk order ini
            const orderShipments = await this.orderShipmentModel.findAll({
                where: { order_id: orderId },
                attributes: ['qty', 'berat', 'panjang', 'lebar', 'tinggi'],
                transaction
            });

            // Hitung total weight dan volume dari shipments
            orderShipments.forEach((shipment) => {
                const qty = Number(shipment.getDataValue('qty')) || 0;
                const berat = Number(shipment.getDataValue('berat')) || 0;
                const panjang = Number(shipment.getDataValue('panjang')) || 0;
                const lebar = Number(shipment.getDataValue('lebar')) || 0;
                const tinggi = Number(shipment.getDataValue('tinggi')) || 0;

                // Hitung per item
                const itemWeight = berat * qty;
                let itemVolume = 0;
                let itemBeratVolume = 0;

                if (panjang && lebar && tinggi) {
                    itemVolume = this.calculateVolume(panjang, lebar, tinggi) * qty;
                    itemBeratVolume = this.calculateBeratVolume(panjang, lebar, tinggi) * qty;
                }

                // Akumulasi total
                totalWeight += itemWeight;
                totalVolume += itemVolume;
                totalBeratVolume += itemBeratVolume;
            });

            // Chargeable weight = max(total berat aktual, total berat volume)
            const chargeableWeight = Math.max(totalWeight, totalBeratVolume);

            // Biaya Pengiriman
            items.push({
                description: 'Biaya Pengiriman Barang',
                qty: chargeableWeight,
                uom: 'kg',
                unit_price: order.total_harga || 0,
                remark: `Berat terberat: ${chargeableWeight.toFixed(2)} kg (Aktual: ${totalWeight.toFixed(2)} kg, Volume: ${totalBeratVolume.toFixed(2)} kg)`
            });

            // Biaya Asuransi
            if (order.asuransi === 1) {
                items.push({
                    description: 'Biaya Asuransi',
                    qty: 1,
                    uom: 'pcs',
                    unit_price: Math.round((order.harga_barang || 0) * 0.002),
                    remark: ''
                });
            }

            // Biaya Packing
            if (order.packing === 1) {
                items.push({
                    description: 'Biaya Packing',
                    qty: 1,
                    uom: 'pcs',
                    unit_price: 5000,
                    remark: ''
                });
            }

            // Diskon (jika ada)
            if (order.voucher) {
                items.push({
                    description: 'Diskon',
                    qty: 1,
                    uom: 'voucher',
                    unit_price: -10000,
                    remark: order.voucher
                });
            }

            // Hitung total
            const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);
            const ppn = Math.round(subtotal * 0.1); // 10% PPN
            const pph = 0;
            const kode_unik = Math.floor(100 + Math.random() * 900);

            // Insert ke order_invoices
            const invoice = await this.orderInvoiceModel.create({
                order_id: orderId,
                invoice_no,
                invoice_date,
                payment_terms: 'Net 30',
                vat: ppn,
                discount: 0,
                packing: order.packing,
                asuransi: order.asuransi,
                ppn,
                pph,
                kode_unik,
                notes: 'Invoice otomatis dibuat dari bypass reweight',
                beneficiary_name: bank.account_name,
                acc_no: bank.no_account,
                bank_name: bank.bank_name,
                bank_address: '',
                swift_code: '',
                payment_info: 0,
                fm: 0,
                lm: 0,
                bill_to_name: order.getDataValue('billing_name') || order.getDataValue('nama_pengirim'),
                bill_to_phone: order.getDataValue('billing_phone') || order.getDataValue('no_telepon_pengirim'),
                bill_to_address: order.getDataValue('billing_address') || order.getDataValue('alamat_pengirim'),
                create_date: now,
                noFaktur: '',
            }, { transaction });

            // Insert ke order_invoice_details
            for (const item of items) {
                await this.orderInvoiceDetailModel.create({
                    invoice_id: invoice.id,
                    description: item.description || '',
                    qty: item.qty || 0,
                    uom: item.uom || '',
                    unit_price: item.unit_price || 0,
                    remark: item.remark || ''
                }, { transaction });
            }

            return {
                invoice_no: invoice.invoice_no,
                invoice_id: invoice.id,
                total_amount: subtotal + ppn - pph
            };

        } catch (error) {
            console.error('Error auto-create invoice:', error);
            throw error;
        }
    }

    async bypassReweight(orderId: number, bypassDto: BypassReweightDto): Promise<BypassReweightResponseDto> {
        const {
            bypass_reweight_status,
            reason,
            updated_by_user_id,
            proof_image,
        } = bypassDto;

        // Validasi order exists
        const order = await this.orderModel.findByPk(orderId, {
            include: [
                {
                    model: this.orderPieceModel,
                    as: 'pieces',
                    attributes: ['id', 'reweight_status'],
                },
            ],
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Ambil data hub asal
        const hubAsal = await this.hubModel.findByPk(order.getDataValue('hub_source_id'), {
            attributes: ['id', 'nama'],
            raw: true,
        });

        // Validasi user authorization (hanya Admin/Super Admin)
        // Note: Implementasi validasi level user bisa ditambahkan sesuai kebutuhan
        // const user = await this.userModel.findByPk(updated_by_user_id, {
        //     include: [{ model: this.levelModel, as: 'levelData' }]
        // });
        // if (!user || !['Admin', 'Super Admin'].includes(user.levelData?.nama)) {
        //     throw new BadRequestException('Anda tidak memiliki izin untuk melakukan bypass reweight');
        // }

        // Validasi foto bukti wajib jika bypass diaktifkan
        if (bypass_reweight_status === 'true' && !proof_image) {
            throw new BadRequestException('Foto bukti wajib diupload saat mengaktifkan bypass reweight');
        }

        // Validasi format file jika ada
        if (proof_image) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(proof_image.mimetype)) {
                throw new BadRequestException('Format file tidak didukung. Gunakan JPG, PNG, atau GIF');
            }

            // Validasi ukuran file (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (proof_image.size > maxSize) {
                throw new BadRequestException('Ukuran file terlalu besar. Maksimal 5MB');
            }
        }

        // Validasi status order untuk bypass
        const currentBypassStatus = order.getDataValue('bypass_reweight');
        const currentReweightStatus = order.getDataValue('reweight_status');

        // Jika order sudah di-reweight dan bypass diaktifkan, berikan warning
        if (currentReweightStatus === 1 && bypass_reweight_status === 'true') {
            console.warn(`Order ${orderId} sudah di-reweight, bypass reweight diaktifkan`);
        }

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const now = new Date();
            const isBypassEnabled = bypass_reweight_status === 'true';

            // 1. Update order bypass status
            await this.orderModel.update(
                {
                    bypass_reweight: bypass_reweight_status,
                    remark_reweight: reason || (isBypassEnabled ? 'Bypass reweight diaktifkan' : 'Bypass reweight dinonaktifkan'),
                    updated_at: now,
                },
                {
                    where: { id: orderId },
                    transaction,
                }
            );

            let orderPiecesUpdated = 0;

            // 2. Update order_pieces jika bypass diaktifkan
            if (isBypassEnabled) {
                // Set semua pieces menjadi reweighted
                const updateResult = await this.orderPieceModel.update(
                    {
                        reweight_status: 1,
                        reweight_by: updated_by_user_id,
                        updatedAt: now,
                    },
                    {
                        where: {
                            order_id: orderId,
                            reweight_status: 0 // Hanya update yang belum di-reweight
                        },
                        transaction,
                    }
                );
                orderPiecesUpdated = updateResult[0];

                // Update order reweight status
                await this.orderModel.update(
                    {
                        reweight_status: 1,
                        isUnreweight: 0,
                    },
                    {
                        where: { id: orderId },
                        transaction,
                    }
                );
            } else {
                // Jika bypass dinonaktifkan, reset reweight status pieces yang belum di-reweight manual
                const updateResult = await this.orderPieceModel.update(
                    {
                        reweight_status: 0,
                        reweight_by: null,
                        updatedAt: now,
                    },
                    {
                        where: {
                            order_id: orderId,
                            reweight_by: updated_by_user_id // Reset hanya yang di-bypass
                        },
                        transaction,
                    }
                );
                orderPiecesUpdated = updateResult[0];

                // Check if any pieces still need reweight
                const remainingPieces = await this.orderPieceModel.count({
                    where: {
                        order_id: orderId,
                        reweight_status: 0
                    },
                    transaction,
                });

                if (remainingPieces > 0) {
                    // Reset order reweight status jika masih ada pieces yang belum di-reweight
                    await this.orderModel.update(
                        {
                            reweight_status: 0,
                            isUnreweight: 1,
                        },
                        {
                            where: { id: orderId },
                            transaction,
                        }
                    );
                }
            }

            // 3. Simpan foto bukti jika bypass diaktifkan
            let proofImageData: FileLog | null = null;
            if (isBypassEnabled && proof_image) {
                try {
                    proofImageData = await this.saveProofImage(proof_image, orderId, updated_by_user_id, transaction);
                } catch (proofError) {
                    console.error(`Gagal menyimpan foto bukti untuk order ${orderId}:`, proofError.message);
                    throw new Error('Gagal menyimpan foto bukti. Proses bypass reweight dibatalkan.');
                }
            }

            if (isBypassEnabled) {
                // Buat notification badge untuk order baru
                await this.createNotificationBadge(orderId, 'Dalam pengiriman', 'order');

                // Tandai notification "Reweight" sebagai sudah dibaca
                await this.markOrderReweight(orderId);
            }

            // 5. Create order_histories
            const hubAsalName = hubAsal?.nama || 'Unknown Hub';
            const statusText = isBypassEnabled ? 'Reweight Bypass Enabled' : 'Reweight Bypass Disabled';

            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create(
                {
                    order_id: orderId,
                    status: statusText,
                    remark: `pesanan diproses di ${hubAsalName}`,
                    provinsi: order.getDataValue('provinsi_pengirim') || '',
                    kota: order.getDataValue('kota_pengirim') || '',
                    date: date,
                    time: time,
                    created_by: updated_by_user_id,
                },
                { transaction }
            );

            await transaction.commit();

            return {
                message: `Bypass reweight berhasil ${isBypassEnabled ? 'diaktifkan' : 'dinonaktifkan'}`,
                success: true,
                data: {
                    order_id: orderId,
                    no_tracking: order.getDataValue('no_tracking'),
                    bypass_reweight_status,
                    reason,
                    updated_by_user: `User ID ${updated_by_user_id}`,
                    updated_at: now,
                    order_pieces_updated: orderPiecesUpdated,
                    proof_image: proofImageData ? {
                        file_name: proofImageData.file_name,
                        file_path: proofImageData.file_path,
                        file_id: proofImageData.id
                    } : null,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    async createOrder(createOrderDto: CreateOrderDto, userId: number): Promise<CreateOrderResponseDto> {
        // Validasi tambahan
        this.validateOrderData(createOrderDto);

        // Validasi qty maksimal per piece dan total
        this.validateQtyLimits(createOrderDto.pieces);

        // Generate no_tracking
        const noTracking = TrackingHelper.generateNoTracking();

        // Hitung total koli, berat, volume, dan berat volume
        const shipmentData = this.calculateShipmentData(createOrderDto.pieces);

        // Tentukan hub source/dest berdasarkan alamat
        const hubSourceId = await this.findHubIdForAddress(
            createOrderDto.provinsi_pengirim,
            createOrderDto.kota_pengirim,
            createOrderDto.alamat_pengirim,
        );
        const hubDestId = await this.findHubIdForAddress(
            createOrderDto.provinsi_penerima,
            createOrderDto.kota_penerima,
            createOrderDto.alamat_penerima,
        );

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            // 1. Simpan ke tabel orders
            const order = await this.orderModel.create({
                no_tracking: noTracking,
                //pengirim
                nama_pengirim: createOrderDto.nama_pengirim,
                alamat_pengirim: createOrderDto.alamat_pengirim,
                provinsi_pengirim: createOrderDto.provinsi_pengirim,
                kota_pengirim: createOrderDto.kota_pengirim,
                kecamatan_pengirim: createOrderDto.kecamatan_pengirim,
                kelurahan_pengirim: createOrderDto.kelurahan_pengirim,
                kodepos_pengirim: createOrderDto.kodepos_pengirim,
                no_telepon_pengirim: createOrderDto.no_telepon_pengirim,
                email_pengirim: createOrderDto.email_pengirim,

                //penerima
                nama_penerima: createOrderDto.nama_penerima,
                alamat_penerima: createOrderDto.alamat_penerima,
                provinsi_penerima: createOrderDto.provinsi_penerima,
                kota_penerima: createOrderDto.kota_penerima,
                kecamatan_penerima: createOrderDto.kecamatan_penerima,
                kelurahan_penerima: createOrderDto.kelurahan_penerima,
                kodepos_penerima: createOrderDto.kodepos_penerima,
                no_telepon_penerima: createOrderDto.no_telepon_penerima,
                email_penerima: createOrderDto.email_penerima,

                //barang
                nama_barang: createOrderDto.nama_barang,
                layanan: createOrderDto.layanan,
                no_referensi: createOrderDto.no_referensi,
                asuransi: createOrderDto.asuransi || 0,
                packing: createOrderDto.packing || 0,
                harga_barang: createOrderDto.harga_barang || 0,

                //billing
                billing_name: createOrderDto.billing_name,
                billing_phone: createOrderDto.billing_phone,
                billing_address: createOrderDto.billing_address,
                billing_email: createOrderDto.billing_email,

                //surat jalan
                isSuratJalanBalik: createOrderDto.isSuratJalanBalik || "0",
                SJName: createOrderDto.SJName,
                SJPhone: createOrderDto.SJPhone,
                SJAddress: createOrderDto.SJAddress,
                SJLocation: createOrderDto.SJLocation,
                SJLatlng: createOrderDto.SJLatlng,
                surat_jalan_balik: createOrderDto.surat_jalan_balik,

                //pickup_time
                pickup_time: createOrderDto.pickup_time || null,

                status: ORDER_STATUS.DRAFT,
                created_by: userId,
                order_by: userId,
                hub_source_id: hubSourceId,
                hub_dest_id: hubDestId,
            }, { transaction });

            // 2. Simpan ke tabel order_shipments dan order_pieces secara batch
            let shipmentGlobalCounter = 1;
            let pieceGlobalCounter = 1;
            const shipmentsToCreate: Partial<OrderShipment>[] = [];
            const piecesToCreate: Partial<OrderPiece>[] = [];

            for (const piece of createOrderDto.pieces) {
                // Siapkan data shipment
                const shipmentData = {
                    order_id: order.id,
                    qty: piece.qty,
                    berat: piece.berat,
                    panjang: piece.panjang,
                    lebar: piece.lebar,
                    tinggi: piece.tinggi,
                    created_by: userId,
                };
                shipmentsToCreate.push(shipmentData);
            }

            // Bulk insert shipments
            const createdShipments = await this.orderShipmentModel.bulkCreate(shipmentsToCreate, { transaction, returning: true });

            // Siapkan data pieces
            for (let s = 0; s < createdShipments.length; s++) {
                const shipment = createdShipments[s];
                const piece = createOrderDto.pieces[s];
                for (let i = 0; i < piece.qty; i++) {
                    const pieceId = `P${order.id}-${pieceGlobalCounter++}`;
                    piecesToCreate.push({
                        order_id: order.id,
                        order_shipment_id: shipment.id,
                        piece_id: pieceId,
                        berat: piece.berat,
                        panjang: piece.panjang,
                        lebar: piece.lebar,
                        tinggi: piece.tinggi,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                }
            }

            // Bulk insert pieces
            await this.orderPieceModel.bulkCreate(piecesToCreate, { transaction });

            // 4. Simpan ke tabel order_histories
            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: order.id,
                status: ORDER_STATUS.DRAFT,
                date: date,
                time: time,
                remark: 'Pesanan berhasil dibuat',
                provinsi: createOrderDto.provinsi_pengirim,
                kota: createOrderDto.kota_pengirim,
                created_by: userId,
            }, { transaction });

            // 5. Simpan ke tabel order_list
            // @ts-ignore
            await this.orderListModel.create({
                //pengirim
                no_tracking: noTracking,
                nama_pengirim: createOrderDto.nama_pengirim,
                alamat_pengirim: createOrderDto.alamat_pengirim,
                provinsi_pengirim: createOrderDto.provinsi_pengirim,
                kota_pengirim: createOrderDto.kota_pengirim,
                kecamatan_pengirim: createOrderDto.kecamatan_pengirim,
                kelurahan_pengirim: createOrderDto.kelurahan_pengirim,
                kodepos_pengirim: createOrderDto.kodepos_pengirim,
                no_telepon_pengirim: createOrderDto.no_telepon_pengirim,
                email_pengirim: createOrderDto.email_pengirim,

                //penerima
                nama_penerima: createOrderDto.nama_penerima,
                alamat_penerima: createOrderDto.alamat_penerima,
                provinsi_penerima: createOrderDto.provinsi_penerima,
                kota_penerima: createOrderDto.kota_penerima,
                kecamatan_penerima: createOrderDto.kecamatan_penerima,
                kelurahan_penerima: createOrderDto.kelurahan_penerima,
                kodepos_penerima: createOrderDto.kodepos_penerima,
                no_telepon_penerima: createOrderDto.no_telepon_penerima,
                email_penerima: createOrderDto.email_penerima || '',

                //pickup
                status_pickup: 'Pending',
                nama_barang: createOrderDto.nama_barang || '',
                harga_barang: createOrderDto.harga_barang || 0,
                asuransi: createOrderDto.asuransi || 0,
                pickup_time: createOrderDto.pickup_time || new Date(),
                total_berat: shipmentData.totalBerat?.toString() || '0',
                total_harga: 0, // Akan dihitung nanti
                status: 'Menunggu diproses',
                payment_status: 'pending',
                pickup_id: 0,
                is_gagal_pickup: 0,
                order_by: userId,
                svc_source_id: 0,
                hub_source_id: hubSourceId,
                svc_dest_id: 0,
                hub_dest_id: hubDestId,
                jumlah_koli: shipmentData.totalKoli || 0,
                total_price: 0,
            }, { transaction });

            // 6. Buat invoice
            const invoiceAmounts = this.calculateInvoiceAmounts(shipmentData, createOrderDto);
            const invoiceDate = new Date();

            const invoice = await this.orderInvoiceModel.create({
                order_id: order.id,
                invoice_no: noTracking,
                invoice_date: invoiceDate,
                payment_terms: 'Net 30',
                vat: 0,
                discount: 0,
                packing: invoiceAmounts.packing,
                asuransi: invoiceAmounts.asuransi,
                ppn: invoiceAmounts.ppn,
                pph: 0,
                kode_unik: 0,
                konfirmasi_bayar: 0,
                notes: `Invoice untuk order ${noTracking}`,
                beneficiary_name: createOrderDto.billing_name || createOrderDto.nama_pengirim,
                acc_no: '',
                bank_name: '',
                bank_address: '',
                swift_code: '',
                paid_attachment: '',
                payment_info: 0,
                fm: 0,
                lm: 0,
                bill_to_name: createOrderDto.billing_name || createOrderDto.nama_pengirim,
                bill_to_phone: createOrderDto.billing_phone || createOrderDto.no_telepon_pengirim,
                bill_to_address: createOrderDto.billing_address || createOrderDto.alamat_pengirim,
                create_date: invoiceDate,
                created_at: invoiceDate,
                updated_at: invoiceDate,
                isGrossUp: 0,
                isUnreweight: 0,
                noFaktur: '',
            }, { transaction });

            // 7. Buat invoice details
            const invoiceDetails: any[] = [];

            // Tambahkan item pengiriman dengan chargeable weight
            invoiceDetails.push({
                invoice_id: invoice.id,
                description: "Biaya Pengiriman Barang",
                qty: invoiceAmounts.chargeableWeight,
                uom: 'KG',
                unit_price: 1000,
                remark: `Berat terberat: ${invoiceAmounts.chargeableWeight.toFixed(2)} kg (Aktual: ${shipmentData.totalBerat.toFixed(2)} kg, Volume: ${shipmentData.beratVolume.toFixed(2)} kg)`,
                created_at: invoiceDate,
                updated_at: invoiceDate,
            });

            // Tambahkan packing dan asuransi sebagai item terpisah jika ada
            if (invoiceAmounts.packing > 0) {
                invoiceDetails.push({
                    invoice_id: invoice.id,
                    description: 'Biaya Packing',
                    qty: 1,
                    uom: 'KG',
                    unit_price: invoiceAmounts.packing,
                    remark: 'Biaya packing dan handling',
                    created_at: invoiceDate,
                    updated_at: invoiceDate,
                });
            }

            if (invoiceAmounts.asuransi > 0) {
                invoiceDetails.push({
                    invoice_id: invoice.id,
                    description: 'Biaya Asuransi',
                    qty: 1,
                    uom: 'KG',
                    unit_price: invoiceAmounts.asuransi,
                    remark: 'Biaya asuransi pengiriman',
                    created_at: invoiceDate,
                    updated_at: invoiceDate,
                });
            }

            // Bulk insert invoice details
            await this.orderInvoiceDetailModel.bulkCreate(invoiceDetails, { transaction });

            // 8. Update order dengan invoice info
            await this.orderModel.update({
                invoiceStatus: INVOICE_STATUS.BELUM_PROSES,
                isUnpaid: 1,
                total_harga: invoiceAmounts.total,
            }, {
                where: { id: order.id },
                transaction
            });

            // Commit transaction
            await transaction.commit();

            // Schedule automatic "pesanan diproses" entry after 5 minutes
            this.scheduleAutoProcessOrder(order.id, userId);

            // Buat notification badge untuk order baru
            await this.createNotificationBadge(order.id, 'Order Masuk', 'order');

            // Buat notification badge untuk hub kosong jika ada hub_id yang 0
            if (hubSourceId === 0 || hubDestId === 0) {
                await this.createNotificationBadge(order.id, 'hub kosong', 'order');
            }

            await this.autoAssignPickupDriver(order, hubSourceId, userId);

            return {
                order_id: order.id,
                no_tracking: noTracking,
                status: 'Order diproses',
                message: 'Order berhasil dibuat',
                invoice: {
                    invoice_no: noTracking,
                    invoice_date: invoiceDate.toISOString(),
                    total_amount: invoiceAmounts.total,
                    status: INVOICE_STATUS.BELUM_PROSES
                }
            };

        } catch (error) {
            // Rollback transaction jika terjadi error
            await transaction.rollback();
            throw new BadRequestException('Gagal membuat order: ' + error.message);
        }
    }

    private async autoAssignPickupDriver(order: Order, hubSourceId: number | null, assignedByUserId: number): Promise<void> {
        if (!order) {
            return;
        }

        const orderId = order.getDataValue('id');
        const targetHubId = hubSourceId ?? order.getDataValue('hub_source_id') ?? null;

        try {
            let selectedDriver = await this.findBestPickupDriver(targetHubId);

            if (!selectedDriver && targetHubId) {
                selectedDriver = await this.findBestPickupDriver();
            }

            if (!selectedDriver) {
                this.logger.warn(`Auto assign pickup: tidak ada kurir tersedia untuk order ${orderId} (hub ${targetHubId ?? 'global'})`);
                return;
            }

            await this.driversService.assignDriverToOrder({
                order_id: orderId,
                driver_id: selectedDriver.id,
                assigned_by_user_id: assignedByUserId,
                task_type: 'pickup',
            });
        } catch (error) {
            this.logger.error(
                `Auto assign pickup gagal untuk order ${orderId}: ${error instanceof Error ? error.message : error}`,
                error instanceof Error ? error.stack : undefined,
            );
        }
    }

    private async findBestPickupDriver(hubId?: number | null): Promise<{ id: number; name: string } | null> {
        const driverWhereClause: any = {
            level: 8,
            aktif: 1,
            status_app: 1,
            freeze_saldo: 0,
            freeze_gps: 0,
        };

        if (hubId) {
            driverWhereClause.hub_id = hubId;
        }

        const drivers = await this.userModel.findAll({
            where: driverWhereClause,
            attributes: ['id', 'name', 'hub_id'],
            raw: true,
        });

        if (!drivers.length) {
            return null;
        }

        const driverIds = drivers.map((driver: any) => Number(driver.id));

        const lastAssignRows = await this.orderPickupDriverModel.findAll({
            attributes: [
                'driver_id',
                [fn('MAX', col('assign_date')), 'last_assign_date'],
            ],
            where: {
                driver_id: { [Op.in]: driverIds },
            },
            group: ['driver_id'],
            raw: true,
        }) as unknown as Array<Record<string, any>>;

        const lastAssignMap = new Map<number, Date>();
        for (const row of lastAssignRows) {
            const driverId = Number(row.driver_id);
            const lastAssignDate = row.last_assign_date ? new Date(row.last_assign_date) : new Date(0);
            lastAssignMap.set(driverId, lastAssignDate);
        }

        const scoredDrivers = drivers.map((driver: any) => {
            const driverId = Number(driver.id);
            return {
                driver,
                lastAssignDate: lastAssignMap.get(driverId) ?? new Date(0),
            };
        });

        scoredDrivers.sort((a, b) => {
            return a.lastAssignDate.getTime() - b.lastAssignDate.getTime();
        });

        return scoredDrivers.length > 0 ? scoredDrivers[0].driver : null;
    }

    async generateOrderLabelsPdf(noTracking: string): Promise<string> {
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        const pieces: any[] = await this.orderPieceModel.findAll({ where: { order_id: order.id }, attributes: ['piece_id', 'berat', 'panjang', 'lebar', 'tinggi'], raw: true });
        if (!pieces || pieces.length === 0) {
            throw new NotFoundException('Order belum memiliki piece');
        }

        const pieceIds = pieces.map(p => String(p.piece_id));

        // Hitung chargeable weight (maks dari total berat aktual vs total berat volume)
        let totalBerat = 0;
        let totalBeratVolume = 0;
        for (const p of pieces) {
            const berat = Number(p.berat) || 0;
            const panjang = Number(p.panjang) || 0;
            const lebar = Number(p.lebar) || 0;
            const tinggi = Number(p.tinggi) || 0;
            totalBerat += berat;
            if (panjang && lebar && tinggi) {
                totalBeratVolume += this.calculateBeratVolume(panjang, lebar, tinggi);
            }
        }
        const chargeableWeight = Math.max(totalBerat, totalBeratVolume);

        const orderForLabels = {
            no_tracking: order.no_tracking,
            created_at: order.created_at,
            layanan: order.layanan,
            total_berat: chargeableWeight,
            nama_pengirim: order.nama_pengirim,
            alamat_pengirim: order.alamat_pengirim,
            nama_penerima: order.nama_penerima,
            alamat_penerima: order.alamat_penerima,
        };

        return await generateOrderLabelsPDF(orderForLabels, pieceIds);
    }

    async generatePickupNotePdf(noTracking: string): Promise<string> {
        // Validasi order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');
        // Hapus validasi status_pickup agar bisa generate meskipun belum complete

        // Ringkasan koli & berat dari pieces
        const pieceAgg = await this.orderPieceModel.findAll({
            where: { order_id: order.id },
            attributes: [[fn('COUNT', col('id')), 'jumlah_koli'], [fn('SUM', col('berat')), 'berat_total']],
            raw: true,
        });
        const qty = Number((pieceAgg[0] as any)?.jumlah_koli || 0);
        const berat_total = Number((pieceAgg[0] as any)?.berat_total || 0);

        // Ambil tanda tangan customer dan nama kurir dari order_pickup_drivers
        const pickupDriver = await this.orderPickupDriverModel.findOne({
            where: { order_id: order.id },
            attributes: ['signature', 'name'],
            raw: true,
            order: [['updated_at', 'DESC']],
        }).catch(() => null);

        const customerSignature = pickupDriver?.signature || null;
        const courierName = pickupDriver?.name || null;

        const driverSignatureFile = await this.fileLogModel.findOne({
            where: { used_for: `driver_signature_order_id_${order.id}`, is_assigned: 1 },
            raw: true,
            order: [['created_at', 'DESC']],
        }).catch(() => null);

        // Ambil foto dari file_log (maks 3) berdasarkan used_for = 'pickup_proof'
        const fileProofs = await this.fileLogModel.findAll({
            where: { used_for: `pickup_proof_order_id_${order.id}`, is_assigned: 1 },
            raw: true,
            order: [['created_at', 'DESC']],
        }).catch(() => []);

        // Ambil foto bukti (maksimal 3)
        const photos = [] as Array<{ image: string; datetime?: string; latlng?: string }>;
        for (const f of fileProofs.slice(0, 3)) {
            if (f?.file_path) {
                photos.push({
                    image: f.file_path,
                    datetime: f.created_at ? new Date(f.created_at).toLocaleString('id-ID') : undefined,
                    latlng: undefined
                });
            }
        }

        // Fallback ke order_histories jika tidak ada file di file_log
        if (photos.length === 0) {
            const histories = await this.orderHistoryModel.findAll({
                where: { order_id: order.id },
                raw: true,
                order: [['created_at', 'DESC']]
            });
            const base64Foto = histories.find((h: any) => h.base64Foto)?.base64Foto;
            const firstHistory = histories[0] as any;

            if (base64Foto) {
                photos.push({
                    image: base64Foto,
                    datetime: `${firstHistory?.date || ''} ${firstHistory?.time || ''}`,
                    latlng: firstHistory?.latlng || ''
                });
            }
        }

        // Siapkan payload PDF
        const link = await generatePickupNotePDF({
            no_tracking: noTracking,
            from: {
                nama: order.nama_pengirim || '-',
                alamat: order.alamat_pengirim || '-',
                phone: order.no_telepon_pengirim || '-'
            },
            to: {
                nama: order.nama_penerima || '-',
                alamat: order.alamat_penerima || '-',
                phone: order.no_telepon_penerima || '-'
            },
            summary: { qty, berat_total },
            signature_customer: customerSignature || undefined,
            courier_name: courierName || undefined,
            layanan: order?.layanan || 'Reguler',
            deskripsi: order?.nama_barang || 'Paket',
            catatan: order?.remark_sales || '',
            packing: order?.packing ? 'Ya' : 'Tidak',
            surat_jalan_balik: order?.surat_jalan_balik || 'Tidak',
            photos,
        });
        return link;
    }

    async updatePickupNote(noTracking: string, updateData: any, userId: number): Promise<{ message: string; data: any }> {
        // Validasi order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // Validasi status pickup - hanya bisa diupdate jika belum di-pickup
        if (order.status_pickup && order.status_pickup !== 'Assigned') {
            throw new BadRequestException(`Order tidak dapat diupdate karena sudah dalam status: ${order.status_pickup}`);
        }

        const updateFields: any = {};

        // Update field yang ada di tabel orders
        if (updateData.pickup_time !== undefined) {
            updateFields.pickup_time = updateData.pickup_time;
        }

        // Update order jika ada field yang berubah
        if (Object.keys(updateFields).length > 0) {
            await this.orderModel.update(updateFields, { where: { no_tracking: noTracking } });
        }

        // Update tanda tangan - simpan sebagai file di file_log dan update order_pickup_driver
        if (updateData.customer_signature || updateData.driver_signature) {
            // Cari atau buat record order_pickup_driver
            let pickupDriver = await this.orderModel.sequelize?.models.OrderPickupDriver?.findOne({
                where: { order_id: order.id },
                order: [['created_at', 'DESC']]
            });

            if (!pickupDriver) {
                // Buat record baru jika belum ada
                pickupDriver = await this.orderModel.sequelize?.models.OrderPickupDriver?.create({
                    order_id: order.id,
                    driver_id: userId, // Gunakan user yang melakukan update
                    assign_date: new Date(),
                    name: 'Driver', // Default name
                    photo: '',
                    notes: 'Pickup note update',
                    signature: '',
                    status: 0, // Default status
                } as any);
            }

            const pickupDriverUpdates: any = {};

            // Simpan customer signature sebagai file
            if (updateData.customer_signature) {
                const customerSignatureFile = await this.fileLogModel.create({
                    file_name: updateData.customer_signature.split('/').pop() || 'customer_signature.png',
                    file_path: updateData.customer_signature,
                    used_for: `customer_signature_order_id_${order.id}`,
                    is_assigned: 1,
                    user_id: userId,
                    file_type: 'image/png',
                } as any);

                // Update order_pickup_driver dengan link file
                pickupDriverUpdates.signature = customerSignatureFile.file_path;
            }

            // Simpan driver signature sebagai file
            if (updateData.driver_signature) {
                const driverSignatureFile = await this.fileLogModel.create({
                    file_name: updateData.driver_signature.split('/').pop() || 'driver_signature.png',
                    file_path: updateData.driver_signature,
                    used_for: `driver_signature_order_id_${order.id}`,
                    is_assigned: 1,
                    user_id: userId,
                    file_type: 'image/png',
                } as any);

                // Update order_pickup_driver dengan link file
                pickupDriverUpdates.photo = driverSignatureFile.file_path;
            }

            // Update order_pickup_driver
            if (Object.keys(pickupDriverUpdates).length > 0 && pickupDriver) {
                await this.orderModel.sequelize?.models.OrderPickupDriver?.update(
                    pickupDriverUpdates,
                    { where: { id: (pickupDriver as any).id } }
                );
            }
        }

        // Update foto bukti di file_log
        if (updateData.proof_photos && updateData.proof_photos.length > 0) {
            // Hapus foto lama yang terkait dengan order ini
            await this.fileLogModel.update(
                { is_assigned: 0 },
                { where: { used_for: `pickup_proof_order_id_${order.id}` } }
            );

            // Tambahkan foto baru
            for (const photoPath of updateData.proof_photos) {
                await this.fileLogModel.create({
                    file_name: photoPath.split('/').pop() || 'photo.jpg', // Ambil nama file dari path
                    file_path: photoPath,
                    used_for: `pickup_proof_order_id_${order.id}`,
                    is_assigned: 1,
                    user_id: userId,
                    file_type: 'image/jpeg', // Default type
                } as any);
            }
        }

        // Ambil data terbaru untuk response
        const updatedOrder = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        const updatedPickupDriver = await this.orderModel.sequelize?.models.OrderPickupDriver?.findOne({
            where: { order_id: order.id },
            order: [['created_at', 'DESC']]
        });

        return {
            message: 'Pickup note berhasil diupdate',
            data: {
                no_tracking: noTracking,
                pickup_time: updatedOrder?.pickup_time,
                customer_signature: (updatedPickupDriver as any)?.signature || null,
                driver_signature: (updatedPickupDriver as any)?.photo || null,
                proof_photos: updateData.proof_photos || [],
            }
        };
    }

    async generateDeliveryNotePdf(noTracking: string): Promise<string> {
        // Validasi order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // Ringkasan koli & berat dari pieces
        const pieceAgg = await this.orderPieceModel.findAll({
            where: { order_id: order.id },
            attributes: [[fn('COUNT', col('id')), 'jumlah_koli'], [fn('SUM', col('berat')), 'berat_total']],
            raw: true,
        });
        const qty = Number((pieceAgg[0] as any)?.jumlah_koli || 0);
        const berat_total = Number((pieceAgg[0] as any)?.berat_total || 0);


        const deliveryDriver = await this.orderDeliverDriverModel.findOne({
            where: { order_id: order.id },
            attributes: ['signature', 'name'],
            raw: true,
            order: [['updated_at', 'DESC']],
        }).catch(() => null);

        const customerSignature = deliveryDriver?.signature || null;
        const courierName = deliveryDriver?.name || null;

        const fileProofs = await this.fileLogModel.findAll({
            where: { used_for: `delivery_proof_order_id_${order.id}`, is_assigned: 1 },
            raw: true,
            order: [['created_at', 'DESC']],
        }).catch(() => []);

        const photos = [] as Array<{ image: string; datetime?: string; latlng?: string }>;
        for (const f of fileProofs.slice(0, 3)) {
            if (f?.file_path) {
                photos.push({
                    image: f.file_path,
                    datetime: f.created_at ? new Date(f.created_at).toLocaleString('id-ID') : undefined,
                    latlng: undefined
                });
            }
        }

        const link = await generateDeliveryNotePDF({
            no_tracking: noTracking,
            from: {
                nama: order.nama_pengirim || '-',
                alamat: order.alamat_pengirim || '-',
                phone: order.no_telepon_pengirim || '-'
            },
            to: {
                nama: order.nama_penerima || '-',
                alamat: order.alamat_penerima || '-',
                phone: order.no_telepon_penerima || '-'
            },
            summary: { qty, berat_total },
            signature_customer: customerSignature || undefined,
            courier_name: courierName || undefined,
            layanan: order?.layanan || 'Reguler',
            deskripsi: order?.nama_barang || 'Paket',
            catatan: order?.remark_sales || '',
            packing: order?.packing ? 'Ya' : 'Tidak',
            surat_jalan_balik: order?.surat_jalan_balik || 'Tidak',
            photos,
        });
        return link;
    }

    async updateDeliveryNote(noTracking: string, updateData: any, userId: number): Promise<{ message: string; data: any }> {
        // Validasi order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // Validasi status delivery - hanya bisa diupdate jika belum di-deliver
        if (order.status_delivery && order.status_delivery !== 'Assigned') {
            throw new BadRequestException(`Order tidak dapat diupdate karena sudah dalam status: ${order.status_delivery}`);
        }

        const updateFields: any = {};

        // Update field yang ada di tabel orders (jika ada field lain yang perlu diupdate)
        // Update order jika ada field yang berubah
        if (Object.keys(updateFields).length > 0) {
            await this.orderModel.update(updateFields, { where: { no_tracking: noTracking } });
        }

        // Update tanda tangan - simpan sebagai file di file_log
        if (updateData.customer_signature || updateData.driver_signature) {
            // Simpan customer signature sebagai file
            if (updateData.customer_signature) {
                await this.fileLogModel.create({
                    file_name: updateData.customer_signature.split('/').pop() || 'customer_signature.png',
                    file_path: updateData.customer_signature,
                    used_for: `customer_signature_delivery_order_id_${order.id}`,
                    is_assigned: 1,
                    user_id: userId,
                    file_type: 'image/png',
                } as any);
            }

            // Simpan driver signature sebagai file
            if (updateData.driver_signature) {
                await this.fileLogModel.create({
                    file_name: updateData.driver_signature.split('/').pop() || 'driver_signature.png',
                    file_path: updateData.driver_signature,
                    used_for: `driver_signature_order_id_${order.id}`,
                    is_assigned: 1,
                    user_id: userId,
                    file_type: 'image/png',
                } as any);
            }
        }

        // Update foto bukti di file_log
        if (updateData.proof_photos && updateData.proof_photos.length > 0) {
            // Hapus foto lama yang terkait dengan order ini
            await this.fileLogModel.update(
                { is_assigned: 0 },
                { where: { used_for: `delivery_proof_order_id_${order.id}` } }
            );

            // Tambahkan foto baru
            for (const photoPath of updateData.proof_photos) {
                await this.fileLogModel.create({
                    file_name: photoPath.split('/').pop() || 'photo.jpg',
                    file_path: photoPath,
                    used_for: `delivery_proof_order_id_${order.id}`,
                    is_assigned: 1,
                    user_id: userId,
                    file_type: 'image/jpeg',
                } as any);
            }
        }

        // Ambil data terbaru untuk response
        const updatedOrder = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });

        return {
            message: 'Delivery note berhasil diupdate',
            data: {
                no_tracking: noTracking,
                customer_signature: updateData.customer_signature || null,
                driver_signature: updateData.driver_signature || null,
                proof_photos: updateData.proof_photos || [],
            }
        };
    }

    async reportMissingItem(noTracking: string, dto: ReportMissingItemDto): Promise<{ message: string; data: any }> {
        // Validasi order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // Validasi user yang melaporkan (harus level ops)
        const reporter: any = await this.userModel.findOne({
            where: { id: dto.reported_by_user_id },
            include: [{ model: this.levelModel, as: 'levelData' }],
            raw: true,
            nest: true
        });

        if (!reporter) throw new NotFoundException('User yang melaporkan tidak ditemukan');

        // Validasi level user (harus level ops - biasanya level 2 atau 3)
        if (!reporter.levelData || (reporter.levelData.level !== 7 && reporter.levelData.level !== 3)) {
            throw new BadRequestException('Hanya tim OPS yang dapat melaporkan barang hilang');
        }

        // Validasi piece IDs
        const validPieces = await this.orderPieceModel.findAll({
            where: {
                order_id: order.id,
                piece_id: { [Op.in]: dto.missing_piece_ids }
            },
            raw: true
        });

        if (validPieces.length !== dto.missing_piece_ids.length) {
            const foundPieceIds = validPieces.map(p => p.piece_id);
            const missingPieceIds = dto.missing_piece_ids.filter(id => !foundPieceIds.includes(id));
            throw new BadRequestException(`Piece ID tidak valid: ${missingPieceIds.join(', ')}`);
        }

        // Buat entri di order_kendala
        const orderKendala = await this.orderKendalaModel.create({
            order_id: String(order.id),
            user_id: String(dto.reported_by_user_id),
            message: dto.message,
            status: 0 // Ongoing
        });

        // Update status pieces yang hilang - gunakan inbound_status = 2 untuk menandai missing
        await this.orderPieceModel.update(
            {
                inbound_status: 2, // 2 = Missing
                updated_at: new Date()
            },
            {
                where: {
                    order_id: order.id,
                    piece_id: { [Op.in]: dto.missing_piece_ids }
                }
            }
        );

        return {
            message: 'Laporan barang hilang berhasil disimpan',
            data: {
                no_tracking: noTracking,
                missing_piece_ids: dto.missing_piece_ids,
                reported_by: reporter.name,
                reported_at: new Date(),
                order_kendala_id: (orderKendala as any)?.id,
                status: 'Item Missing'
            }
        };
    }

    async resolveMissingItem(noTracking: string, dto: ResolveMissingItemDto): Promise<{ message: string; data: any }> {
        // Validasi order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // Validasi status order harus 'Item Missing'
        if (order.status !== 'Item Missing') {
            throw new BadRequestException(`Order tidak dalam status 'Item Missing'. Status saat ini: ${order.status}`);
        }

        // Validasi user yang menyelesaikan (harus traffic controller atau admin)
        const resolver: any = await this.userModel.findOne({
            where: { id: dto.resolved_by_user_id },
            include: [{ model: this.levelModel, as: 'levelData' }],
            raw: true,
            nest: true
        });

        if (!resolver) throw new NotFoundException('User yang menyelesaikan tidak ditemukan');

        // // Validasi level user (harus traffic controller atau admin - level 1, 2, atau 3)
        // if (!resolver.levelData || ![1, 2, 3].includes(resolver.levelData.level)) {
        //     throw new BadRequestException('Hanya Traffic Controller atau Admin yang dapat menyelesaikan masalah');
        // }

        // Validasi piece ID
        const piece: any = await this.orderPieceModel.findOne({
            where: {
                order_id: order.id,
                piece_id: dto.piece_id,
                inbound_status: 2 // 2 = Missing
            },
            raw: true
        });

        if (!piece) {
            throw new BadRequestException(`Piece ID ${dto.piece_id} tidak ditemukan atau tidak dalam status 'Missing'`);
        }

        // Validasi hub
        const hub: any = await this.hubModel.findByPk(dto.found_at_hub_id, { raw: true });
        if (!hub) throw new NotFoundException('Hub tidak ditemukan');

        // Update status piece menjadi 'Found' (inbound_status = 1)
        await this.orderPieceModel.update(
            {
                inbound_status: 1, // 1 = Found/Received
                hub_current_id: dto.found_at_hub_id,
                updated_at: new Date()
            },
            {
                where: {
                    order_id: order.id,
                    piece_id: dto.piece_id
                }
            }
        );

        // Cari dan update order_kendala
        const orderKendala: any = await this.orderKendalaModel.findOne({
            where: {
                order_id: String(order.id),
                status: 0 // Ongoing
            },
            order: [['created_at', 'DESC']],
            raw: true
        });

        if (orderKendala) {
            // Update status kendala
            await this.orderKendalaModel.update(
                {
                    status: 1, // Completed
                    message_completed: dto.notes_on_finding,
                    url_image_1: dto.photo_file || null,
                    updated_at: new Date()
                },
                { where: { id: orderKendala.id } }
            );
        }

        // Cek apakah semua piece yang hilang sudah ditemukan
        const totalMissingPieces = await this.orderPieceModel.count({
            where: {
                order_id: order.id,
                inbound_status: 2 // 2 = Missing
            }
        });

        // Jika semua piece sudah ditemukan, update status order
        if (totalMissingPieces === 0) {
            await this.orderModel.update(
                {
                    isProblem: 0,
                    status: 'Ready for Delivery',
                    updatedAt: new Date()
                },
                { where: { no_tracking: noTracking } }
            );
        }

        return {
            message: 'Masalah barang hilang berhasil diselesaikan',
            data: {
                no_tracking: noTracking,
                piece_id: dto.piece_id,
                found_at_hub: hub.nama_hub,
                resolved_by: resolver.name,
                resolved_at: new Date(),
                all_pieces_found: totalMissingPieces === 0,
                order_status: totalMissingPieces === 0 ? 'Ready for Delivery' : 'Item Missing'
            }
        };
    }

    async getMissingItems(noTracking: string): Promise<{ success: boolean; message: string; data: any }> {
        // Ambil order
        const order: any = await this.orderModel.findOne({ where: { no_tracking: noTracking }, raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // Ambil pieces yang missing (inbound_status = 2)
        const pieces = await this.orderPieceModel.findAll({
            where: {
                order_id: order.id,
                inbound_status: 2 // 2 = Missing
            },
            attributes: ['id', 'piece_id', 'berat', 'panjang', 'lebar', 'tinggi', 'updated_at'],
            raw: true,
        });

        // Ambil kendala terbaru (ongoing) jika ada
        const kendala = await this.orderKendalaModel.findOne({
            where: { order_id: String(order.id), status: 0 },
            order: [['created_at', 'DESC']],
            raw: true,
        });

        return {
            success: true,
            message: 'Data missing items berhasil diambil',
            data: {
                no_tracking: noTracking,
                total_missing: Array.isArray(pieces) ? pieces.length : 0,
                pieces,
                kendala,
            },
        };
    }

    async createResiReferensi(orderId: number) {
        // 1. Ambil data order
        const order = await this.orderModel.findByPk(orderId, { raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // 2. Ambil data shipments dan pieces
        const shipments = await this.orderShipmentModel.findAll({ where: { order_id: orderId }, raw: true });
        const pieces = await this.orderPieceModel.findAll({ where: { order_id: orderId }, raw: true });

        // 3. Generate no_tracking jika belum ada
        let noTracking = order.no_tracking;
        if (!noTracking) {
            noTracking = 'GGK' + Math.floor(Math.random() * 1e10).toString().padStart(10, '0');
            order.no_tracking = noTracking;
            await order.save();
        }

        // 4. Hitung ringkasan koli dan siapkan data item per shipment
        let totalWeight = 0;
        let totalQty = 0;
        let totalVolume = 0;

        // Siapkan array untuk item shipment
        const shipmentItems: Array<{
            qty: number;
            berat: number;
            panjang: number;
            lebar: number;
            tinggi: number;
        }> = [];

        for (const s of shipments) {
            const qty = Number(s.qty) || 0;
            const berat = Number(s.berat) || 0;
            const panjang = Number(s.panjang) || 0;
            const lebar = Number(s.lebar) || 0;
            const tinggi = Number(s.tinggi) || 0;

            totalQty += qty;
            totalWeight += berat * qty;
            const volume = (panjang * lebar * tinggi * qty) / 1000000;
            totalVolume += volume;

            // Tambahkan item shipment ke array
            shipmentItems.push({
                qty: qty,
                berat: berat,
                panjang: panjang,
                lebar: lebar,
                tinggi: tinggi
            });
        }

        const volumeWeight = totalVolume * 250;
        const kubikasi = totalVolume.toFixed(2);
        const beratVolume = volumeWeight.toFixed(2);

        // 5. Siapkan data untuk PDF
        const dataPDF: any = {
            no_tracking: noTracking,
            created_at: order.created_at,
            layanan: order.layanan || 'REGULER',
            pengirim: {
                nama: order.nama_pengirim,
                alamat: order.alamat_pengirim,
                provinsi: order.provinsi_pengirim,
                kota: order.kota_pengirim,
                kecamatan: order.kecamatan_pengirim,
                kelurahan: order.kelurahan_pengirim,
                kodepos: order.kodepos_pengirim,
                telepon: order.no_telepon_pengirim,
            },
            penerima: {
                nama: order.nama_penerima,
                alamat: order.alamat_penerima,
                provinsi: order.provinsi_penerima,
                kota: order.kota_penerima,
                kecamatan: order.kecamatan_penerima,
                kelurahan: order.kelurahan_penerima,
                kodepos: order.kodepos_penerima,
                telepon: order.no_telepon_penerima,
            },
            barang: {
                nama_barang: order.nama_barang,
                harga_barang: order.harga_barang ? `IDR ${order.harga_barang.toLocaleString('id-ID')}` : '-',
                asuransi: order.asuransi ? 'Ya' : 'Tidak',
                packing: order.packing ? 'Ya' : 'Tidak',
                surat_jalan_balik: order.surat_jalan_balik || 'Tidak',
                catatan: order.remark_sales || '-',
                jumlah_koli: totalQty,
                berat_aktual: totalWeight,
                berat_volume: beratVolume,
                kubikasi: kubikasi,
            },
            ringkasan: shipmentItems, // Array item shipment satu-satu
        };

        // 5.1. Tambahkan informasi vendor jika order sudah diteruskan ke vendor
        if (order.remark_traffic && order.remark_traffic.includes('Vendor:')) {
            // Parse vendor details dari remark_traffic
            const vendorMatch = order.remark_traffic.match(/Vendor: ([^|]+) \| PIC: ([^|]+) \| Phone: ([^|]+)(?:\s*\|\s*Note: ([^|]+))?/);

            if (vendorMatch) {
                const vendorName = vendorMatch[1]?.trim();
                const vendorPic = vendorMatch[2]?.trim();
                const vendorPhone = vendorMatch[3]?.trim();
                const vendorNote = vendorMatch[4]?.trim() || '';

                // Ambil informasi user yang meneruskan dari order history
                const forwardingHistory = await this.orderHistoryModel.findOne({
                    where: {
                        order_id: orderId,
                        remark: { [Op.like]: '%diteruskan ke vendor%' }
                    },
                    order: [['created_at', 'DESC']],
                    include: [
                        {
                            model: this.userModel,
                            as: 'createdByUser',
                            attributes: ['name']
                        }
                    ]
                });

                // Ambil informasi hub tujuan
                const destinationHub = await this.hubModel.findByPk(order.next_hub, {
                    attributes: ['id', 'nama', 'kode']
                });

                dataPDF.vendor_details = {
                    name: vendorName,
                    pic: vendorPic,
                    phone: vendorPhone,
                    note: vendorNote,
                    forwarded_at: forwardingHistory?.getDataValue('created_at') || order.updated_at,
                    forwarded_by: forwardingHistory?.getDataValue('createdByUser')?.getDataValue('name') || 'System',
                    destination_hub: destinationHub ? {
                        id: destinationHub.getDataValue('id'),
                        name: destinationHub.getDataValue('nama'),
                        code: destinationHub.getDataValue('kode')
                    } : null
                };
            }
        }

        // 6. Generate PDF
        let url;
        try {
            url = await generateResiPDF(dataPDF);
        } catch (err) {
            throw new InternalServerErrorException(`Gagal generate PDF: ${err.message}`);
        }

        // 7. Simpan ke order_referensi
        await this.orderReferensiModel.create({
            order_id: orderId,
            nomor: noTracking,
            source: 'resi',
            url,
        });

        // 8. Return response
        return {
            message: 'Resi berhasil dibuat',
            data: {
                order_id: orderId,
                no_tracking: noTracking,
                url,
            },
        };
    }

    async addOrderHistory(orderId: number, dto: CreateOrderHistoryDto) {
        // 1. Pastikan order ada
        const order = await this.orderModel.findByPk(orderId, { raw: true });
        if (!order) throw new NotFoundException('Order tidak ditemukan');

        // 2. Simpan history baru, isi field NOT NULL dari order jika tidak diisi user
        const { date, time } = getOrderHistoryDateTime();
        const history = await this.orderHistoryModel.create({
            order_id: orderId,
            status: dto.status,
            provinsi: (dto as any).provinsi || order.provinsi_pengirim || '-',
            kota: (dto as any).kota || order.kota_pengirim || '-',
            remark: (dto as any).keterangan || '-',
            date: date,
            time: time,
            created_at: new Date(),
            updated_at: new Date(),
        });

        return {
            message: 'Riwayat tracking berhasil ditambahkan',
            data: history,
        };
    }

    async listOrders(userId: number, query?: ListOrdersDto) {
        let tipeFilter: any = {};
        if (query?.tipe) {
            switch (query.tipe) {
                case 'barang':
                    tipeFilter = { layanan: { [Op.notIn]: ['Sewa truck', 'International'] } };
                    break;
                case 'sewa_truk':
                    tipeFilter = { layanan: 'Sewa truck' };
                    break;
                case 'international':
                    tipeFilter = { layanan: 'International' };
                    break;
            }
        }
        if (query?.missing_items) {
            const missingItemsOrders = await this.orderModel.findAll({
                where: tipeFilter,
                include: [
                    {
                        model: this.orderShipmentModel,
                        as: 'shipments',
                        attributes: [],
                    },
                    {
                        model: this.orderPieceModel,
                        as: 'pieces',
                        where: {
                            inbound_status: 2 // Missing items
                        },
                        attributes: [],
                        required: true
                    },
                ],
                attributes: [
                    'id',
                    'no_tracking',
                    'nama_pengirim',
                    'nama_penerima',
                    'alamat_pengirim',
                    'alamat_penerima',
                    'layanan',
                    'invoiceStatus',
                    'status',
                    'id_kontrak',
                    'created_at',
                    'order_by',
                    [fn('SUM', col('shipments.qty')), 'total_koli'],
                ],
                group: ['Order.id'],
                order: [['created_at', 'DESC']],
                raw: true,
            });

            return {
                message: 'Data order dengan missing items berhasil diambil',
                data: missingItemsOrders.map(order => ({
                    id: order.id,
                    no_tracking: order.no_tracking,
                    nama_pengirim: order.nama_pengirim,
                    nama_penerima: order.nama_penerima,
                    layanan: order.layanan,
                    status_tagihan: order.invoiceStatus,
                    status_pengiriman: order.status,
                    id_kontrak: order.id_kontrak,
                    created_at: order.created_at,
                    order_by: order.order_by,
                    total_koli: order.total_koli,
                })),
            };
        }

        if (query?.missing_hub) {
            const missingHubOrders = await this.orderModel.findAll({
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { hub_dest_id: 0 },
                                { hub_source_id: 0 }
                            ]
                        },
                        tipeFilter
                    ]
                },
                include: [
                    {
                        model: this.orderShipmentModel,
                        as: 'shipments',
                        attributes: [],
                    },
                    {
                        model: this.hubModel,
                        as: 'hubDestination',
                        attributes: ['nama'],
                        required: false,
                    },
                    {
                        model: this.hubModel,
                        as: 'hubSource',
                        attributes: ['nama'],
                        required: false,
                    },
                ],
                attributes: [
                    'id',
                    'no_tracking',
                    'nama_pengirim',
                    'nama_penerima',
                    'alamat_pengirim',
                    'alamat_penerima',
                    'layanan',
                    'invoiceStatus',
                    'status',
                    'id_kontrak',
                    'created_at',
                    'hub_dest_id',
                    'hub_source_id',
                    [fn('SUM', col('shipments.qty')), 'total_koli'],
                ],
                group: ['Order.id', 'hubDestination.id', 'hubSource.id'],
                order: [['created_at', 'DESC']],
                raw: false,
            });

            return {
                message: 'Data order dengan missing hub berhasil diambil',
                data: missingHubOrders.map(order => ({
                    id: order.getDataValue('id'),
                    no_tracking: order.getDataValue('no_tracking'),
                    nama_pengirim: order.getDataValue('nama_pengirim'),
                    nama_penerima: order.getDataValue('nama_penerima'),
                    alamat_pengirim: order.getDataValue('alamat_pengirim'),
                    alamat_penerima: order.getDataValue('alamat_penerima'),
                    layanan: order.getDataValue('layanan'),
                    status_tagihan: order.getDataValue('invoiceStatus'),
                    status_pengiriman: order.getDataValue('status'),
                    id_kontrak: order.getDataValue('id_kontrak'),
                    created_at: order.getDataValue('created_at'),
                    hub_dest_id: order.getDataValue('hub_dest_id'),
                    hub_source_id: order.getDataValue('hub_source_id'),
                    hub_dest_nama: order.getDataValue('hub_dest_id') === 0 ? null : order.getDataValue('hubDestination')?.getDataValue('nama') || null,
                    hub_source_nama: order.getDataValue('hub_source_id') === 0 ? null : order.getDataValue('hubSource')?.getDataValue('nama') || null,
                    total_koli: order.getDataValue('total_koli'),
                })),
            };
        }

        // Ambil orders milik user, join ke order_shipments, hitung total koli, hanya field tertentu
        const orders = await this.orderModel.findAll({
            where: { [Op.and]: [{ order_by: userId }, tipeFilter] },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'nama_penerima',
                'layanan',
                'invoiceStatus',
                'status',
                'id_kontrak',
                'created_at',
                [fn('SUM', col('shipments.qty')), 'total_koli'],
            ],
            group: ['Order.id'],
            order: [['created_at', 'DESC']],
            raw: true,
        });
        return {
            message: 'Data order berhasil diambil',
            data: orders.map(order => ({
                id: order.id,
                no_tracking: order.no_tracking,
                nama_pengirim: order.nama_pengirim,
                nama_penerima: order.nama_penerima,
                layanan: order.layanan,
                status_tagihan: order.invoiceStatus,
                status_pengiriman: order.status,
                id_kontrak: order.id_kontrak,
                created_at: order.created_at,
                total_koli: order.total_koli,
            })),
        };
    }

    async getDashboardStatistics(userId: number) {
        // Gunakan single query dengan aggregation untuk efisiensi
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Single query dengan conditional aggregation
        const result = await this.orderModel.findOne({
            where: { order_by: userId },
            attributes: [
                [fn('COUNT', col('id')), 'total_shipment'],
                [fn('SUM', literal(`CASE WHEN status IN ('Draft', 'Ready for Pickup', 'Picked Up') THEN 1 ELSE 0 END`)), 'on_going'],
                [fn('SUM', literal(`CASE WHEN status IN ('In Transit', 'Out for Delivery') THEN 1 ELSE 0 END`)), 'on_delivery'],
                [fn('SUM', literal(`CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END`)), 'completed'],
                [fn('SUM', literal(`CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END`)), 'canceled'],
                [fn('SUM', literal(`CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END`)), 'payment_completed'],
                [fn('SUM', literal(`CASE WHEN payment_status IS NULL OR payment_status != 'paid' THEN 1 ELSE 0 END`)), 'payment_pending'],
                // Monthly statistics
                [fn('SUM', literal(`CASE WHEN created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_total'],
                [fn('SUM', literal(`CASE WHEN status IN ('Draft', 'Ready for Pickup', 'Picked Up') AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_on_going'],
                [fn('SUM', literal(`CASE WHEN status IN ('In Transit', 'Out for Delivery') AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_on_delivery'],
                [fn('SUM', literal(`CASE WHEN status = 'Delivered' AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_completed'],
                [fn('SUM', literal(`CASE WHEN status = 'Cancelled' AND created_at BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}' THEN 1 ELSE 0 END`)), 'monthly_canceled'],
            ],
            raw: true,
        }) as any;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const payload = {
            total_shipment: parseInt(result?.total_shipment) || 0,
            on_going: parseInt(result?.on_going) || 0,
            on_delivery: parseInt(result?.on_delivery) || 0,
            completed: parseInt(result?.completed) || 0,
            canceled: parseInt(result?.canceled) || 0,
            payment_completed: parseInt(result?.payment_completed) || 0,
            payment_pending: parseInt(result?.payment_pending) || 0,
            monthly: {
                month: monthNames[currentDate.getMonth()],
                total: parseInt(result?.monthly_total) || 0,
                on_going: parseInt(result?.monthly_on_going) || 0,
                on_delivery: parseInt(result?.monthly_on_delivery) || 0,
                completed: parseInt(result?.monthly_completed) || 0,
                canceled: parseInt(result?.monthly_canceled) || 0,
            }
        };

        return {
            message: 'Data statistik berhasil diambil',
            data: payload,
        };
    }

    async getMasterDashboardStats(tahun?: string) {
        try {
            const currentYear = new Date().getFullYear();
            const filterYear = tahun ? parseInt(tahun) : currentYear;

            // 1. Header Stats - Total semua order dengan filter tahun
            const headerStats = await this.orderModel.findOne({
                where: literal(`YEAR(created_at) = ${filterYear}`),
                attributes: [
                    [fn('COUNT', col('id')), 'total_pengiriman'],
                    [fn('SUM', literal(`CASE WHEN status IN ('In Transit', 'Out for Delivery', 'Ready for Pickup', 'Picked Up') THEN 1 ELSE 0 END`)), 'dalam_pengiriman'],
                    [fn('SUM', literal(`CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END`)), 'pengiriman_berhasil'],
                    [fn('SUM', literal(`CASE WHEN status IN ('Cancelled', 'Failed') OR is_gagal_pickup = 1 THEN 1 ELSE 0 END`)), 'pengiriman_gagal'],
                ],
                raw: true,
            }) as any;

            // 2. Service Breakdown - Breakdown per layanan dengan filter tahun
            const serviceBreakdown = await this.orderModel.findAll({
                where: literal(`YEAR(created_at) = ${filterYear}`),
                attributes: [
                    'layanan',
                    [fn('COUNT', col('id')), 'total_order']
                ],
                group: ['layanan'],
                raw: true,
            }) as any[];

            // Hitung persentase untuk service breakdown
            const totalOrders = parseInt(headerStats?.total_pengiriman) || 0;
            const serviceBreakdownWithPercentage = serviceBreakdown.map(service => {
                const total = parseInt(service.total_order) || 0;
                const percentage = totalOrders > 0 ? ((total / totalOrders) * 100).toFixed(2) : '0.00';
                return {
                    layanan: service.layanan,
                    total_order: total,
                    persentase: `${percentage}%`
                };
            });

            // 3. Monthly Trends - Data per bulan untuk tahun yang dipilih
            const monthlyTrends = await this.orderModel.findAll({
                attributes: [
                    [fn('MONTH', col('created_at')), 'bulan'],
                    [fn('COUNT', col('id')), 'total_pengiriman'],
                    [fn('SUM', literal(`CASE WHEN layanan = 'Sewa Truk' THEN 1 ELSE 0 END`)), 'total_sewa_truck'],
                    [fn('SUM', literal(`CASE WHEN layanan = 'Kirim Motor' THEN 1 ELSE 0 END`)), 'total_kirim_motor'],
                    [fn('SUM', literal(`CASE WHEN layanan = 'Internasional' THEN 1 ELSE 0 END`)), 'total_internasional'],
                ],
                where: literal(`YEAR(created_at) = ${filterYear}`),
                group: [fn('MONTH', col('created_at'))],
                order: [[fn('MONTH', col('created_at')), 'ASC']],
                raw: true,
            }) as any[];

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyTrendsFormatted = monthlyTrends.map(trend => ({
                bulan: monthNames[parseInt(trend.bulan) - 1],
                total_pengiriman: parseInt(trend.total_pengiriman) || 0,
                total_sewa_truck: parseInt(trend.total_sewa_truck) || 0,
                total_kirim_motor: parseInt(trend.total_kirim_motor) || 0,
                total_internasional: parseInt(trend.total_internasional) || 0,
            }));

            return {
                status: 'success',
                data: {
                    header_stats: {
                        total_pengiriman: parseInt(headerStats?.total_pengiriman) || 0,
                        dalam_pengiriman: parseInt(headerStats?.dalam_pengiriman) || 0,
                        pengiriman_berhasil: parseInt(headerStats?.pengiriman_berhasil) || 0,
                        pengiriman_gagal: parseInt(headerStats?.pengiriman_gagal) || 0,
                    },
                    service_breakdown: serviceBreakdownWithPercentage,
                    monthly_trends: monthlyTrendsFormatted,
                    filter_tahun: filterYear.toString()
                }
            };

        } catch (error) {
            this.logger.error('Error getting master dashboard stats:', error.stack || error.message);
            throw new InternalServerErrorException('Gagal mengambil data master dashboard');
        }
    }

    async getReorderData(orderId: number, userId: number) {
        // Ambil data order beserta pieces
        const order = await this.orderModel.findOne({
            where: {
                id: orderId,
                order_by: userId // Pastikan user hanya bisa reorder order miliknya
            },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: ['qty', 'berat', 'panjang', 'lebar', 'tinggi'],
                },
            ],
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan atau tidak memiliki akses');
        }

        // Transform data untuk response reorder
        const reorderData = {
            nama_pengirim: order.getDataValue('nama_pengirim'),
            alamat_pengirim: order.getDataValue('alamat_pengirim'),
            provinsi_pengirim: order.getDataValue('provinsi_pengirim'),
            kota_pengirim: order.getDataValue('kota_pengirim'),
            kecamatan_pengirim: order.getDataValue('kecamatan_pengirim'),
            kelurahan_pengirim: order.getDataValue('kelurahan_pengirim'),
            kodepos_pengirim: order.getDataValue('kodepos_pengirim'),
            no_telepon_pengirim: order.getDataValue('no_telepon_pengirim'),
            email_pengirim: order.getDataValue('email_pengirim'),

            nama_penerima: order.getDataValue('nama_penerima'),
            alamat_penerima: order.getDataValue('alamat_penerima'),
            provinsi_penerima: order.getDataValue('provinsi_penerima'),
            kota_penerima: order.getDataValue('kota_penerima'),
            kecamatan_penerima: order.getDataValue('kecamatan_penerima'),
            kelurahan_penerima: order.getDataValue('kelurahan_penerima'),
            kodepos_penerima: order.getDataValue('kodepos_penerima'),
            no_telepon_penerima: order.getDataValue('no_telepon_penerima'),
            email_penerima: order.getDataValue('email_penerima'),

            layanan: order.getDataValue('layanan'),
            asuransi: order.getDataValue('asuransi') === 1,
            harga_barang: order.getDataValue('harga_barang'),
            nama_barang: order.getDataValue('nama_barang'),

            // pakek order.shipments
            pieces: order.getDataValue('shipments')?.map(shipment => ({
                qty: shipment.getDataValue('qty'),
                berat: shipment.getDataValue('berat'),
                panjang: shipment.getDataValue('panjang'),
                lebar: shipment.getDataValue('lebar'),
                tinggi: shipment.getDataValue('tinggi'),
            })) || [],
        };

        return {
            message: 'Data reorder berhasil diambil',
            data: reorderData,
        };
    }

    async getTruckRentalReorderData(orderId: number, userId: number) {
        // Ambil data order sewa truk
        const order = await this.orderModel.findOne({
            where: {
                id: orderId,
                layanan: 'Sewa truck' // Pastikan ini adalah order sewa truk
            },
        });

        if (!order) {
            throw new NotFoundException('Order sewa truk tidak ditemukan atau tidak memiliki akses');
        }

        // Transform data untuk response reorder sewa truk
        const reorderData = {
            // Data Pengirim
            nama_pengirim: order.getDataValue('nama_pengirim'),
            alamat_pengirim: order.getDataValue('alamat_pengirim'),
            provinsi_pengirim: order.getDataValue('provinsi_pengirim'),
            kota_pengirim: order.getDataValue('kota_pengirim'),
            kecamatan_pengirim: order.getDataValue('kecamatan_pengirim'),
            kelurahan_pengirim: order.getDataValue('kelurahan_pengirim'),
            kodepos_pengirim: order.getDataValue('kodepos_pengirim'),
            no_telepon_pengirim: order.getDataValue('no_telepon_pengirim'),

            // Data Penerima
            nama_penerima: order.getDataValue('nama_penerima'),
            alamat_penerima: order.getDataValue('alamat_penerima'),
            provinsi_penerima: order.getDataValue('provinsi_penerima'),
            kota_penerima: order.getDataValue('kota_penerima'),
            kecamatan_penerima: order.getDataValue('kecamatan_penerima'),
            kelurahan_penerima: order.getDataValue('kelurahan_penerima'),
            kodepos_penerima: order.getDataValue('kodepos_penerima'),
            no_telepon_penerima: order.getDataValue('no_telepon_penerima'),

            // Data Pesanan Spesifik Sewa Truk
            layanan: order.getDataValue('layanan'),
            origin_latlng: order.getDataValue('latlngAsal'),
            destination_latlng: order.getDataValue('latlngTujuan'),
            isUseToll: order.getDataValue('isUseToll') === 1,
            toll_payment_method: order.getDataValue('metode_bayar_truck'),
            truck_type: order.getDataValue('truck_type'),
            pickup_time: order.getDataValue('pickup_time') ? new Date(order.getDataValue('pickup_time')).toISOString() : null,
            keterangan_barang: order.getDataValue('nama_barang'),
            asuransi: order.getDataValue('asuransi') === 1,
        };

        return {
            message: 'Data reorder sewa truk berhasil diambil',
            data: reorderData,
        };
    }

    async getOrderHistoryByOrderId(orderId: number) {
        // Ambil data order
        const order = await this.orderModel.findByPk(orderId, { raw: true });
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Ambil histories
        const histories = await this.orderHistoryModel.findAll({
            where: { order_id: orderId },
            order: [['created_at', 'ASC'], ['id', 'DESC']],
            raw: true,
        });

        const payload = {
            order: {
                no_tracking: order.no_tracking,
                pengirim: {
                    nama: order.nama_pengirim,
                    alamat: order.alamat_pengirim,
                    provinsi: order.provinsi_pengirim,
                    kota: order.kota_pengirim,
                    kecamatan: order.kecamatan_pengirim,
                    kelurahan: order.kelurahan_pengirim,
                    kodepos: order.kodepos_pengirim,
                    telepon: order.no_telepon_pengirim,
                    email: order.email_pengirim
                },
                penerima: {
                    nama: order.nama_penerima,
                    alamat: order.alamat_penerima,
                    provinsi: order.provinsi_penerima,
                    kota: order.kota_penerima,
                    kecamatan: order.kecamatan_penerima,
                    kelurahan: order.kelurahan_penerima,
                    kodepos: order.kodepos_penerima,
                    telepon: order.no_telepon_penerima,
                    email: order.email_penerima
                }
            },
            histories: histories.map(h => ({
                id: h.id,
                status: h.status,
                remark: h.remark,
                created_at: h.created_at,
            }))
        };

        return {
            message: 'Data riwayat order berhasil diambil',
            data: payload,
        };
    }

    async exportToExcel(userId: number) {
        const orders = await this.orderModel.findAll({
            where: { order_by: userId },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'nama_penerima',
                'layanan',
                'payment_status',
                'status',
                'id_kontrak',
                'created_at',
                [fn('SUM', col('shipments.qty')), 'total_koli'],
            ],
            group: ['Order.id'],
            order: [['created_at', 'DESC']],
            raw: true,
        });

        const worksheetName = 'Pengiriman';

        const data = orders.map(order => ({
            No: order.id,
            Tracking: order.no_tracking,
            Pengirim: order.nama_pengirim,
            Penerima: order.nama_penerima,
            layanan: order.layanan,
            Pembayaran: order.payment_status || 'belum lunas',
            status: order.status,
            kontrak: order.id_kontrak === '1' ? 'iya' : 'tidak',
            date: order.created_at,
            total_koli: (order as any).total_koli,
        }));

        const currentDate = new Date();
        const fileName = `Data-${currentDate.toString().replace(/[:\s]/g, '')}.xlsx`;

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
        XLSX.writeFile(workbook, `public/excel/${fileName}`);

        return {
            message: 'Data pengiriman berhasil diekspor ke Excel',
            data: {
                file_name: fileName,
                url: `/excel/${fileName}`
            },
        };
    }

    async exportToPdf(userId: number) {
        const orders = await this.orderModel.findAll({
            where: { order_by: userId },
            include: [
                {
                    model: this.orderShipmentModel,
                    as: 'shipments',
                    attributes: [],
                },
            ],
            attributes: [
                'id',
                'no_tracking',
                'nama_pengirim',
                'nama_penerima',
                'layanan',
                'payment_status',
                'status',
                'id_kontrak',
                'created_at',
                [fn('SUM', col('shipments.qty')), 'total_koli'],
            ],
            group: ['Order.id'],
            order: [['created_at', 'DESC']],
            raw: true,
        });

        const currentDate = new Date();
        const tanggal = currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const jam = currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
        const fileName = `Laporan-Order-${tanggal.replace(/\s/g, '-')}-${jam.replace(/:/g, '')}.pdf`;
        const filePath = `public/pdf/${fileName}`;

        // Generate PDF (landscape)
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        const fs = require('fs');
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Judul formal
        doc.fontSize(16).text(`Laporan Order - ${tanggal} pukul ${jam} WIB`, { align: 'center' });
        doc.moveDown(1.5);

        // Table columns (lebar diatur agar tidak padat, Kontrak diperlebar, Tracking & Date cukup lebar)
        const columns = [
            { label: 'No', width: 35 },
            { label: 'Tracking', width: 130 },
            { label: 'Pengirim', width: 90 },
            { label: 'Penerima', width: 90 },
            { label: 'Layanan', width: 70 },
            { label: 'Pembayaran', width: 90 },
            { label: 'Status', width: 110 },
            { label: 'Kontrak', width: 70 },
            { label: 'Date', width: 130 },
        ];

        // Center table horizontally
        const tableWidth = columns.reduce((a, c) => a + c.width, 0);
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        let startX = doc.page.margins.left + Math.max(0, Math.floor((pageWidth - tableWidth) / 2));
        let startY = doc.y;

        // Header background (hijau #1A723B)
        doc.save();
        doc.rect(startX, startY, tableWidth, 22).fill('#1A723B');
        doc.restore();

        // Header text
        let x = startX;
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        columns.forEach(col => {
            doc.text(col.label, x + 2, startY + 6, { width: col.width - 4, align: 'left' });
            x += col.width;
        });
        doc.fillColor('black').font('Helvetica').fontSize(10);

        // Table rows
        let y = startY + 22;
        orders.forEach((order: any, idx: number) => {
            // Alternating row background
            if (idx % 2 === 0) {
                doc.save();
                doc.rect(startX, y, tableWidth, 22).fill('#f3f3f3');
                doc.restore();
            }
            x = startX;
            const row = [
                String(idx + 1),
                order.no_tracking || '-',
                order.nama_pengirim || '-',
                order.nama_penerima || '-',
                order.layanan || '-',
                order.payment_status || 'Unpaid',
                order.status || '-',
                order.id_kontrak === '1' ? 'Iya' : 'Tidak',
                order.created_at ? new Date(order.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
            ];
            row.forEach((cell, i) => {
                doc.fillColor('black').font('Helvetica').fontSize(10);
                doc.text(cell, x + 2, y + 6, { width: columns[i].width - 4, align: 'left' });
                x += columns[i].width;
            });
            y += 22;
            // Page break jika melebihi halaman
            if (y > doc.page.height - 50) {
                doc.addPage();
                y = 30;
                // Redraw header di halaman baru
                doc.save();
                doc.rect(startX, y, tableWidth, 22).fill('#1A723B');
                doc.restore();
                x = startX;
                doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
                columns.forEach(col => {
                    doc.text(col.label, x + 2, y + 6, { width: col.width - 4, align: 'left' });
                    x += col.width;
                });
                doc.fillColor('black').font('Helvetica').fontSize(10);
                y += 22;
            }
        });

        doc.end();

        // Tunggu file selesai ditulis
        await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', (err: any) => reject(err));
        });

        return {
            message: 'Data pengiriman berhasil diekspor ke PDF',
            data: {
                file_name: fileName,
                url: `/pdf/${fileName}`
            },
        };
    }

    async cancelOrder(noResi: string, body: any) {
        const { reason, cancelled_by_user_id } = body;

        this.logger.log(`Starting cancel order process for no_resi: ${noResi}, user_id: ${cancelled_by_user_id}`);

        try {
            // 1. Validasi user
            const user = await this.userModel.findByPk(cancelled_by_user_id);
            if (!user) {
                this.logger.error(`User not found: ${cancelled_by_user_id}`);
                throw new Error('User tidak ditemukan');
            }

            // 2. Cari order berdasarkan no_tracking (no_resi)
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi }
            });
            if (!order) {
                this.logger.error(`Order not found: ${noResi}`);
                throw new Error('Order tidak ditemukan');
            }

            const orderId = order.getDataValue('id');
            this.logger.log(`Found order: ${orderId} with status: ${order.getDataValue('status')}`);

            // 3. Validasi status order (tidak bisa dibatalkan jika sudah dalam proses atau selesai)
            const currentStatus = order.getDataValue('status');
            if (currentStatus === 'Ready for Pickup' || currentStatus === 'Picked Up' || currentStatus === 'In Transit' || currentStatus === 'Out for Delivery' || currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
                this.logger.warn(`Order ${orderId} cannot be cancelled - current status: ${currentStatus}`);

                let errorMessage = '';
                switch (currentStatus) {
                    case 'Ready for Pickup':
                        errorMessage = 'Order tidak bisa dibatalkan karena sudah siap untuk diambil';
                        break;
                    case 'Picked Up':
                        errorMessage = 'Order tidak bisa dibatalkan karena sudah diambil';
                        break;
                    case 'In Transit':
                        errorMessage = 'Order tidak bisa dibatalkan karena sedang dalam perjalanan';
                        break;
                    case 'Out for Delivery':
                        errorMessage = 'Order tidak bisa dibatalkan karena sedang dalam pengiriman';
                        break;
                    case 'Delivered':
                        errorMessage = 'Order tidak bisa dibatalkan karena sudah dikirim';
                        break;
                    case 'Cancelled':
                        errorMessage = 'Order tidak bisa dibatalkan karena sudah dibatalkan sebelumnya';
                        break;
                    default:
                        errorMessage = 'Order tidak bisa dibatalkan karena status tidak memungkinkan';
                }

                throw new Error(errorMessage);
            }

            // 4. Validasi payment status (tidak bisa dibatalkan jika sudah dibayar)
            const paymentStatus = order.getDataValue('payment_status');
            if (paymentStatus === 'paid') {
                this.logger.warn(`Order ${orderId} cannot be cancelled - payment status: ${paymentStatus}`);
                throw new Error('Order tidak bisa dibatalkan karena sudah dibayar');
            }

            const updateHistory: string[] = [];

            // 5. Update order status menjadi 'Cancelled'
            await order.update({
                status: ORDER_STATUS.CANCELLED,
                is_gagal_pickup: 1,
                updated_at: new Date()
            });

            updateHistory.push('Status order diubah menjadi Cancelled');
            updateHistory.push('Flag is_gagal_pickup diatur menjadi 1');

            // 6. Buat entri baru di request_cancel
            await this.requestCancelModel.create({
                order_id: orderId,
                user_id: cancelled_by_user_id,
                reason: reason,
                status: 0, // 0: Pending
                created_at: new Date()
            } as any);

            updateHistory.push('Request cancel berhasil dibuat');

            // 7. Update status order_pieces menjadi 0 (tidak di-pickup)
            const pieces = await this.orderPieceModel.findAll({
                where: { order_id: orderId }
            });

            if (pieces.length > 0) {
                await this.orderPieceModel.update({
                    pickup_status: 0
                }, {
                    where: { order_id: orderId }
                });

                updateHistory.push(`${pieces.length} pieces diupdate menjadi tidak di-pickup`);
            }

            // 8. Tambah entri riwayat di order_histories
            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: order.id,
                status: ORDER_STATUS.CANCELLED,
                date: date,
                time: time,
                remark: 'Pesanan dibatalkan',
                provinsi: '',
                kota: '',
                created_by: cancelled_by_user_id,
            });

            updateHistory.push('History order berhasil ditambahkan');

            this.logger.log(`Order ${orderId} successfully cancelled`);

            return {
                message: 'Order berhasil dibatalkan',
                success: true,
                data: {
                    order_id: orderId,
                    no_resi: noResi,
                    status: 'Cancelled',
                    reason: reason,
                    cancelled_by: user.getDataValue('name'),
                    cancelled_at: new Date().toISOString(),
                    updates: updateHistory
                }
            };

        } catch (error) {
            this.logger.error(`Error in cancelOrder: ${error.message}`, error.stack);
            throw new Error(`Error cancelling order: ${error.message}`);
        }
    }

    private validateOrderData(createOrderDto: CreateOrderDto): void {
        // Validasi asuransi
        if (createOrderDto.asuransi && (!createOrderDto.harga_barang || createOrderDto.harga_barang <= 0)) {
            throw new BadRequestException('Harga barang wajib diisi jika asuransi aktif');
        }

        // Validasi pieces tidak kosong
        if (!createOrderDto.pieces || createOrderDto.pieces.length === 0) {
            throw new BadRequestException('Detail paket/koli wajib diisi');
        }

        // Validasi setiap piece
        createOrderDto.pieces.forEach((piece, index) => {
            if (piece.berat <= 0) {
                throw new BadRequestException(`Berat pada koli ${index + 1} harus lebih dari 0`);
            }
            if (piece.panjang <= 0 || piece.lebar <= 0 || piece.tinggi <= 0) {
                throw new BadRequestException(`Dimensi pada koli ${index + 1} harus lebih dari 0`);
            }
        });
    }

    /**
     * Validasi qty maksimal per piece dan total
     */
    private validateQtyLimits(pieces: CreateOrderPieceDto[]): void {
        const maxQtyPerPiece = 999;
        const maxTotalQty = 9999; // Total qty dari semua pieces

        let totalQty = 0;

        for (const piece of pieces) {
            // Validasi qty per piece
            if (piece.qty > maxQtyPerPiece) {
                throw new BadRequestException(`Qty per piece maksimal ${maxQtyPerPiece}. Piece dengan berat ${piece.berat}kg memiliki qty ${piece.qty}`);
            }

            // Hitung total qty
            totalQty += piece.qty;

            // Validasi total qty
            if (totalQty > maxTotalQty) {
                throw new BadRequestException(`Total qty dari semua pieces maksimal ${maxTotalQty}. Saat ini total: ${totalQty}`);
            }
        }

        // Validasi total qty minimal
        if (totalQty === 0) {
            throw new BadRequestException('Total qty harus lebih dari 0');
        }
    }

    /**
     * Validasi qty maksimal per piece dan total untuk estimate price
     */
    private validateQtyLimitsForEstimate(items: any[]): void {
        const maxQtyPerPiece = 999;
        const maxTotalQty = 9999; // Total qty dari semua items

        let totalQty = 0;

        for (const item of items) {
            // Validasi qty per piece
            if (item.qty > maxQtyPerPiece) {
                throw new BadRequestException(`Qty per piece maksimal ${maxQtyPerPiece}. Item dengan berat ${item.berat}kg memiliki qty ${item.qty}`);
            }

            // Hitung total qty
            totalQty += item.qty;

            // Validasi total qty
            if (totalQty > maxTotalQty) {
                throw new BadRequestException(`Total qty dari semua items maksimal ${maxTotalQty}. Saat ini total: ${totalQty}`);
            }
        }

        // Validasi total qty minimal
        if (totalQty === 0) {
            throw new BadRequestException('Total qty harus lebih dari 0');
        }
    }

    private calculateShipmentData(pieces: CreateOrderPieceDto[]) {
        let totalWeight = 0;
        let totalQty = 0;
        let totalVolume = 0;

        pieces.forEach((piece) => {
            const qty = Number(piece.qty) || 0;
            const berat = Number(piece.berat) || 0;
            const panjang = Number(piece.panjang) || 0;
            const lebar = Number(piece.lebar) || 0;
            const tinggi = Number(piece.tinggi) || 0;

            totalQty += qty;
            totalWeight += berat * qty;
            const volume = (panjang * lebar * tinggi * qty) / 1000000;
            totalVolume += volume;
        });

        const volumeWeight = totalVolume * 250;

        return {
            totalKoli: totalQty,
            totalBerat: totalWeight,
            totalVolume,
            beratVolume: volumeWeight,
        };
    }

    private calculateVolume(panjang: number, lebar: number, tinggi: number): number {
        return (panjang * lebar * tinggi) / 1000000; // Convert to meter kubik
    }

    private calculateBeratVolume(panjang: number, lebar: number, tinggi: number): number {
        const volume = this.calculateVolume(panjang, lebar, tinggi);
        return volume * 250;
    }

    /**
     * Bulk reweight untuk multiple pieces dengan auto-create invoice
     */
    async reweightBulk(reweightBulkDto: ReweightBulkDto): Promise<ReweightBulkResponseDto> {
        const { actions, reweight_by_user_id, images } = reweightBulkDto;

        // Validasi jumlah images (max 5)
        if (images && images.length > 5) {
            throw new BadRequestException('Maksimal 5 gambar yang bisa diupload');
        }

        // Validasi actions tidak kosong
        if (!actions || actions.length === 0) {
            throw new BadRequestException('Actions tidak boleh kosong');
        }

        // Validasi action types
        const validActions = ['update', 'delete', 'add'];
        for (const action of actions) {
            if (!validActions.includes(action.action)) {
                throw new BadRequestException(`Action tidak valid: ${action.action}`);
            }

            // Validasi data dimensi hanya untuk update (add boleh kosong / 0)
            if (action.action === 'update') {
                if (
                    action.berat === undefined ||
                    action.panjang === undefined ||
                    action.lebar === undefined ||
                    action.tinggi === undefined
                ) {
                    throw new BadRequestException(`Data dimensi wajib untuk action ${action.action}`);
                }
            }

            // Validasi piece_id untuk update dan delete
            if (action.action === 'update' || action.action === 'delete') {
                if (!action.piece_id) {
                    throw new BadRequestException(`Piece ID wajib untuk action ${action.action}`);
                }
            }
        }

        // Ambil order ID dari actions
        let orderId: number;

        // Cek apakah ada action yang memerlukan order_id
        const actionsNeedingOrderId = actions.filter(a => a.action === 'add' || a.action === 'update' || a.action === 'delete');

        if (actionsNeedingOrderId.length === 0) {
            throw new BadRequestException('Tidak ada action yang valid');
        }

        // Untuk action 'add', order_id wajib diisi
        const addActions = actions.filter(a => a.action === 'add');
        for (const addAction of addActions) {
            if (!addAction.order_id) {
                throw new BadRequestException(`Order ID wajib untuk action 'add'`);
            }
        }

        // Untuk action 'update' dan 'delete', order_id bisa dari piece yang ada
        const updateAndDeleteActions = actions.filter(a => a.action === 'update' || a.action === 'delete');
        let orderIdFromExistingPieces: number | null = null;

        if (updateAndDeleteActions.length > 0) {
            const updateAndDeletePieceIds = updateAndDeleteActions
                .map(a => a.piece_id!)
                .filter(id => id !== undefined);

            if (updateAndDeletePieceIds.length > 0) {
                const existingPieces = await this.orderPieceModel.findAll({
                    where: { id: updateAndDeletePieceIds },
                    include: [
                        {
                            model: this.orderModel,
                            as: 'order',
                            attributes: ['id', 'no_tracking', 'provinsi_pengirim', 'kota_pengirim'],
                        },
                    ],
                });

                if (existingPieces.length !== updateAndDeletePieceIds.length) {
                    throw new BadRequestException('Beberapa pieces tidak ditemukan');
                }

                // Validasi semua pieces dari order yang sama
                const orderIds = [...new Set(existingPieces.map(p => p.getDataValue('order_id')))];
                if (orderIds.length > 1) {
                    throw new BadRequestException('Semua pieces harus dari order yang sama');
                }
                orderIdFromExistingPieces = orderIds[0];
            }
        }

        // Tentukan orderId berdasarkan prioritas
        if (addActions.length > 0) {
            // Jika ada add action, gunakan order_id dari add action
            const orderIdsFromAdd = [...new Set(addActions.map(a => a.order_id!))];
            if (orderIdsFromAdd.length > 1) {
                throw new BadRequestException('Semua add actions harus dari order yang sama');
            }
            orderId = orderIdsFromAdd[0];

            // Validasi dengan order_id dari existing pieces jika ada
            if (orderIdFromExistingPieces && orderId !== orderIdFromExistingPieces) {
                throw new BadRequestException('Order ID dari add action harus sama dengan order ID dari existing pieces');
            }
        } else {
            // Jika tidak ada add action, gunakan order_id dari existing pieces
            if (!orderIdFromExistingPieces) {
                throw new BadRequestException('Tidak dapat menentukan Order ID');
            }
            orderId = orderIdFromExistingPieces;
        }

        // Pastikan orderId sudah di-assign
        if (!orderId) {
            throw new BadRequestException('Tidak dapat menentukan Order ID');
        }

        // Tanpa transaction untuk menghindari lock timeout
        try {
            const now = new Date();
            const actionsDetails: {
                action: 'update' | 'delete' | 'add';
                piece_id: number;
                status: 'success' | 'failed';
                message: string;
                old_data?: {
                    berat?: number;
                    panjang?: number;
                    lebar?: number;
                    tinggi?: number;
                };
                new_data?: {
                    berat?: number;
                    panjang?: number;
                    lebar?: number;
                    tinggi?: number;
                };
            }[] = [];
            let imagesUploaded: {
                file_name: string;
                file_path: string;
                file_id: number;
            }[] = [];

            // 1. Upload images jika ada
            if (images && images.length > 0) {
                for (const image of images) {
                    try {
                        const fileLog = await this.saveProofImage(image, orderId, reweight_by_user_id, undefined, `bulk_reweight_proof_order_id_${orderId}`);
                        imagesUploaded.push({
                            file_name: fileLog.file_name,
                            file_path: fileLog.file_path,
                            file_id: fileLog.id
                        });
                    } catch (imageError) {
                        console.warn(`Gagal upload image: ${imageError.message}`);
                        // Lanjutkan proses meskipun image gagal upload
                    }
                }
            }

            // 2. Proses semua actions tanpa transaction
            let piecesUpdated = 0;
            let piecesDeleted = 0;
            let piecesAdded = 0;

            for (const actionData of actions) {
                try {
                    if (actionData.action === 'update') {
                        // Update existing piece
                        const existingPiece = await this.orderPieceModel.findByPk(actionData.piece_id!);
                        if (!existingPiece) {
                            actionsDetails.push({
                                action: 'update',
                                piece_id: actionData.piece_id!,
                                status: 'failed',
                                message: 'Piece tidak ditemukan',
                                old_data: undefined,
                                new_data: undefined
                            });
                            continue;
                        }

                        // Simpan data lama untuk history
                        const oldData = {
                            berat: existingPiece.getDataValue('berat'),
                            panjang: existingPiece.getDataValue('panjang'),
                            lebar: existingPiece.getDataValue('lebar'),
                            tinggi: existingPiece.getDataValue('tinggi'),
                        };

                        // Check apakah dimensi berubah
                        const oldBerat = existingPiece.getDataValue('berat');
                        const oldPanjang = existingPiece.getDataValue('panjang');
                        const oldLebar = existingPiece.getDataValue('lebar');
                        const oldTinggi = existingPiece.getDataValue('tinggi');
                        const newBerat = actionData.berat!;
                        const newPanjang = actionData.panjang!;
                        const newLebar = actionData.lebar!;
                        const newTinggi = actionData.tinggi!;

                        const dimensiChanged = (oldBerat !== newBerat || oldPanjang !== newPanjang ||
                            oldLebar !== newLebar || oldTinggi !== newTinggi);

                        if (dimensiChanged) {
                            // 1. Cari shipment yang cocok dengan dimensi baru atau buat baru TERLEBIH DAHULU
                            const newShipmentId = await this.findOrCreateShipmentForDimensions(orderId, newBerat, newPanjang, newLebar, newTinggi);

                            // 2. Update shipment_id di orderPiece SEBELUM hapus shipment lama
                            await this.orderPieceModel.update(
                                { order_shipment_id: newShipmentId },
                                { where: { id: actionData.piece_id! } }
                            );

                            // 3. Baru kurangi qty dari shipment lama (setelah piece sudah pindah)
                            await this.reduceShipmentQty(orderId, actionData.piece_id!);
                        }

                        // Update piece dengan data baru
                        await this.orderPieceModel.update(
                            {
                                berat: newBerat,
                                panjang: newPanjang,
                                lebar: newLebar,
                                tinggi: newTinggi,
                                reweight_status: 1,
                                reweight_by: reweight_by_user_id,
                                updatedAt: now,
                            },
                            {
                                where: { id: actionData.piece_id! },
                            }
                        );

                        actionsDetails.push({
                            action: 'update',
                            piece_id: actionData.piece_id!,
                            status: 'success',
                            message: 'Piece berhasil diupdate',
                            old_data: oldData,
                            new_data: {
                                berat: actionData.berat!,
                                panjang: actionData.panjang!,
                                lebar: actionData.lebar!,
                                tinggi: actionData.tinggi!,
                            }
                        });
                        piecesUpdated++;

                    } else if (actionData.action === 'delete') {
                        // Delete existing piece
                        const existingPiece = await this.orderPieceModel.findByPk(actionData.piece_id!);
                        if (!existingPiece) {
                            actionsDetails.push({
                                action: 'delete',
                                piece_id: actionData.piece_id!,
                                status: 'failed',
                                message: 'Piece tidak ditemukan',
                                old_data: undefined,
                                new_data: undefined
                            });
                            continue;
                        }

                        // Simpan data lama untuk history
                        const oldData = {
                            berat: existingPiece.getDataValue('berat'),
                            panjang: existingPiece.getDataValue('panjang'),
                            lebar: existingPiece.getDataValue('lebar'),
                            tinggi: existingPiece.getDataValue('tinggi'),
                        };

                        // Kurangi qty di shipment sebelum hapus piece
                        await this.reduceShipmentQty(orderId, actionData.piece_id!);

                        // Delete piece
                        await this.orderPieceModel.destroy({
                            where: { id: actionData.piece_id! },
                        });

                        actionsDetails.push({
                            action: 'delete',
                            piece_id: actionData.piece_id!,
                            status: 'success',
                            message: 'Piece berhasil dihapus',
                            old_data: oldData,
                            new_data: undefined
                        });
                        piecesDeleted++;

                    } else if (actionData.action === 'add') {
                        // Add new piece dengan auto-generate piece_id

                        const addBerat = actionData.berat !== undefined ? Number(actionData.berat) : 0;
                        const addPanjang = actionData.panjang !== undefined ? Number(actionData.panjang) : 0;
                        const addLebar = actionData.lebar !== undefined ? Number(actionData.lebar) : 0;
                        const addTinggi = actionData.tinggi !== undefined ? Number(actionData.tinggi) : 0;

                        // 1. Generate piece_id dengan format P{order_id}-{counter}
                        const pieceCounter = await this.getNextPieceCounter(orderId);
                        const generatedPieceId = `P${orderId}-${pieceCounter}`;

                        // 2. Cari atau buat shipment yang cocok
                        // Cari shipment yang cocok dengan dimensi (dual search)
                        const shipmentId = await this.findOrCreateShipmentForDimensions(orderId, addBerat, addPanjang, addLebar, addTinggi);

                        // 3. Create piece dengan semua field yang diperlukan
                        const newPiece = await this.orderPieceModel.create({
                            order_id: orderId,
                            order_shipment_id: shipmentId,
                            piece_id: generatedPieceId,
                            berat: addBerat,
                            panjang: addPanjang,
                            lebar: addLebar,
                            tinggi: addTinggi,
                            reweight_status: 1,
                            reweight_by: reweight_by_user_id,
                            createdAt: now,
                            updatedAt: now,
                        } as any);

                        actionsDetails.push({
                            action: 'add',
                            piece_id: newPiece.id,
                            status: 'success',
                            message: `Piece berhasil ditambahkan dengan piece_id: ${generatedPieceId}`,
                            old_data: undefined,
                            new_data: {
                                berat: addBerat,
                                panjang: addPanjang,
                                lebar: addLebar,
                                tinggi: addTinggi,
                            }
                        });
                        piecesAdded++;
                    }
                } catch (error) {
                    actionsDetails.push({
                        action: actionData.action,
                        piece_id: actionData.piece_id || 0,
                        status: 'failed',
                        message: `Error: ${error.message}`,
                        old_data: undefined,
                        new_data: undefined
                    });
                }
            }

            return {
                message: `Bulk reweight berhasil diproses`,
                success: true,
                data: {
                    actions_summary: {
                        pieces_updated: piecesUpdated,
                        pieces_deleted: piecesDeleted,
                        pieces_added: piecesAdded,
                    },
                    order_id: orderId,
                    order_reweight_completed: true,
                    images_uploaded: imagesUploaded.length > 0 ? imagesUploaded : undefined,
                    actions_details: actionsDetails,
                },
            };

        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async reweightPiece(pieceId: string, reweightDto: ReweightPieceDto): Promise<ReweightPieceResponseDto> {
        const {
            berat,
            panjang,
            lebar,
            tinggi,
            reweight_by_user_id,
        } = reweightDto;

        // Validasi piece exists
        const piece = await this.orderPieceModel.findOne({
            where: { piece_id: pieceId },
            include: [
                {
                    model: this.orderModel,
                    as: 'order',
                    attributes: ['id', 'no_tracking', 'provinsi_pengirim', 'kota_pengirim'],
                },
            ],
        });

        if (!piece) {
            throw new NotFoundException('Piece tidak ditemukan');
        }

        // Validasi pickup status - piece harus sudah di-pickup
        // if (piece.getDataValue('pickup_status') !== 1) {
        //     throw new BadRequestException('Piece belum di-pickup. Reweight hanya bisa dilakukan setelah pickup');
        // }

        // Validasi piece belum di-reweight
        if (piece.getDataValue('reweight_status') === 1) {
            throw new BadRequestException('Piece sudah di-reweight sebelumnya');
        }

        // Simpan data lama untuk history
        const oldBerat = piece.getDataValue('berat');
        const oldPanjang = piece.getDataValue('panjang');
        const oldLebar = piece.getDataValue('lebar');
        const oldTinggi = piece.getDataValue('tinggi');

        // Mulai transaction
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const now = new Date();

            // 1. Update order_pieces
            await this.orderPieceModel.update(
                {
                    berat,
                    panjang,
                    lebar,
                    tinggi,
                    reweight_status: 1,
                    reweight_by: reweight_by_user_id,
                    updatedAt: now,
                },
                {
                    where: { piece_id: pieceId },
                    transaction,
                }
            );

            // 2. Check if all pieces in the order have been reweighted
            // Kita perlu menghitung ulang setelah piece ini diupdate
            const orderId = piece.getDataValue('order_id');

            // Hitung jumlah pieces yang belum di-reweight
            const unreweightedCount = await this.orderPieceModel.count({
                where: {
                    order_id: orderId,
                    reweight_status: { [Op.ne]: 1 } // Tidak sama dengan 1
                },
                transaction,
            });

            const totalPieces = await this.orderPieceModel.count({
                where: { order_id: orderId },
                transaction,
            });

            const allReweighted = unreweightedCount === 0 && totalPieces > 0;

            // 3. Update order reweight status if all pieces are reweighted
            if (allReweighted) {
                await this.orderModel.update(
                    {
                        reweight_status: 1,
                        isUnreweight: 0,
                        remark_reweight: 'Semua pieces telah di-reweight',
                        invoiceStatus: INVOICE_STATUS.BELUM_DITAGIH, // Update invoiceStatus menjadi "belum ditagih"
                    },
                    {
                        where: { id: orderId },
                        transaction,
                    }
                );

                // Update order status based on pieces
                await this.updateOrderStatusFromPieces(orderId, transaction);
            }


            await transaction.commit();

            return {
                message: 'Piece berhasil di-reweight',
                success: true,
                data: {
                    piece_id: pieceId,
                    order_id: orderId,
                    berat_lama: oldBerat,
                    berat_baru: berat,
                    dimensi_lama: `${oldPanjang}x${oldLebar}x${oldTinggi}`,
                    dimensi_baru: `${panjang}x${lebar}x${tinggi}`,
                    reweight_status: 1,
                    order_reweight_completed: allReweighted,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw new InternalServerErrorException(error.message);
        }
    }

    /**
     * Ambil detail piece berdasarkan piece_id
     */
    async getPieceDetail(pieceId: string): Promise<{ message: string; success: boolean; data: any }> {
        const piece = await this.orderPieceModel.findOne({
            where: { piece_id: pieceId },
            include: [
                {
                    model: this.orderModel,
                    as: 'order',
                    attributes: ['id', 'no_tracking'],
                },
            ],
        });

        if (!piece) {
            throw new NotFoundException(`Piece ID ${pieceId} tidak ditemukan`);
        }

        const order: any = (piece as any).order || {};
        return {
            message: 'Detail piece ditemukan',
            success: true,
            data: {
                piece_id: piece.getDataValue('piece_id'),
                order_id: order.id,
                no_tracking: order.no_tracking,
                berat: piece.getDataValue('berat'),
                panjang: piece.getDataValue('panjang'),
                lebar: piece.getDataValue('lebar'),
                tinggi: piece.getDataValue('tinggi'),
                reweight_status: piece.getDataValue('reweight_status'),
                pickup_status: piece.getDataValue('pickup_status'),
            },
        };
    }
    /**
     * Validasi piece_id apakah ada di sistem
     */
    async validatePieceId(pieceId: string): Promise<{ message: string; success: boolean; data: { valid: boolean; piece_id: string; order_id?: number; no_tracking?: string } }> {
        const piece = await this.orderPieceModel.findOne({
            where: { piece_id: pieceId },
            include: [
                {
                    model: this.orderModel,
                    as: 'order',
                    attributes: ['id', 'no_tracking'],
                },
            ],
        });

        if (!piece) {
            throw new NotFoundException(`Piece ID ${pieceId} tidak ditemukan`);
        }

        const reweightStatus = (piece as any).getDataValue
            ? (piece as any).getDataValue('reweight_status')
            : (piece as any).reweight_status;
        if (reweightStatus === 1) {
            throw new BadRequestException(`Piece ID ${pieceId} sudah di-reweight`);
        }

        const order: any = (piece as any).order || {};
        return {
            message: 'Piece valid',
            success: true,
            data: {
                valid: true,
                piece_id: pieceId,
                order_id: order.id,
                no_tracking: order.no_tracking,
            },
        };
    }

    async getOrderDetail(noResi: string): Promise<OrderDetailResponseDto> {
        try {
            // 1. Get order with all related data
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi },
                include: [
                    {
                        model: this.orderPieceModel,
                        as: 'pieces',
                        attributes: [
                            'id',
                            'piece_id',
                            'berat',
                            'panjang',
                            'lebar',
                            'tinggi',
                            'reweight_status',
                            'pickup_status'
                        ],
                        required: false
                    }
                ],
                attributes: [
                    'id',
                    'no_tracking',
                    'nama_barang',
                    'harga_barang',
                    'status',
                    'bypass_reweight',
                    'reweight_status',
                    'layanan',
                    'created_at',
                    'updated_at',
                    // Shipper data
                    'nama_pengirim',
                    'alamat_pengirim',
                    'provinsi_pengirim',
                    'kota_pengirim',
                    'kecamatan_pengirim',
                    'kelurahan_pengirim',
                    'kodepos_pengirim',
                    'no_telepon_pengirim',
                    'email_pengirim',
                    // Consignee data
                    'nama_penerima',
                    'alamat_penerima',
                    'provinsi_penerima',
                    'kota_penerima',
                    'kecamatan_penerima',
                    'kelurahan_penerima',
                    'kodepos_penerima',
                    'no_telepon_penerima',
                    'email_penerima',
                    // Additional data
                    'total_harga'
                ]
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // 2. Calculate summary metrics from pieces
            const pieces = order.getDataValue('pieces') || [];
            let jumlahKoli = 0;
            let beratAktual = 0;
            let beratVolume = 0;
            let kubikasi = 0;

            pieces.forEach((piece: any) => {
                jumlahKoli += 1; // Each piece = 1 koli

                const berat = parseFloat(piece.getDataValue('berat')) || 0;
                const panjang = parseFloat(piece.getDataValue('panjang')) || 0;
                const lebar = parseFloat(piece.getDataValue('lebar')) || 0;
                const tinggi = parseFloat(piece.getDataValue('tinggi')) || 0;

                beratAktual += berat;

                // Calculate volume weight (panjang * lebar * tinggi) / 6000
                const volumeWeight = (panjang * lebar * tinggi) / 6000;
                beratVolume += volumeWeight;

                // Calculate cubic meter (panjang * lebar * tinggi) / 1000000
                const cubicMeter = (panjang * lebar * tinggi) / 1000000;
                kubikasi += cubicMeter;
            });

            // 3. Build response
            const response: OrderDetailResponseDto = {
                message: 'Detail order berhasil diambil',
                success: true,
                data: {
                    order_info: {
                        tracking_no: order.getDataValue('no_tracking'),
                        nama_barang: order.getDataValue('nama_barang'),
                        harga_barang: parseFloat(order.getDataValue('harga_barang')) || 0,
                        status: order.getDataValue('status') || ORDER_STATUS.DRAFT,
                        bypass_reweight: order.getDataValue('bypass_reweight') || 'false',
                        reweight_status: order.getDataValue('reweight_status') || 0,
                        layanan: order.getDataValue('layanan') || 'Regular',
                        created_at: order.getDataValue('created_at'),
                        updated_at: order.getDataValue('updated_at')
                    },
                    shipper: {
                        name: order.getDataValue('nama_pengirim'),
                        address: order.getDataValue('alamat_pengirim'),
                        phone: order.getDataValue('no_telepon_pengirim'),
                        email: order.getDataValue('email_pengirim'),
                        province: order.getDataValue('provinsi_pengirim'),
                        city: order.getDataValue('kota_pengirim'),
                        district: order.getDataValue('kecamatan_pengirim'),
                        postal_code: order.getDataValue('kodepos_pengirim')
                    },
                    consignee: {
                        name: order.getDataValue('nama_penerima'),
                        address: order.getDataValue('alamat_penerima'),
                        phone: order.getDataValue('no_telepon_penerima'),
                        email: order.getDataValue('email_penerima'),
                        province: order.getDataValue('provinsi_penerima'),
                        city: order.getDataValue('kota_penerima'),
                        district: order.getDataValue('kecamatan_penerima'),
                        postal_code: order.getDataValue('kodepos_penerima')
                    },
                    summary_metrics: {
                        jumlah_koli: jumlahKoli,
                        berat_aktual_kg: Math.round(beratAktual * 100) / 100, // Round to 2 decimals
                        berat_volume_kg: Math.round(beratVolume * 100) / 100,
                        kubikasi_m3: Math.round(kubikasi * 1000) / 1000, // Round to 3 decimals
                        total_harga: parseFloat(order.getDataValue('total_harga')) || 0
                    },
                    pieces_detail: pieces.map((piece: any, index: number) => ({
                        id: piece.getDataValue('id'),
                        piece_id: piece.getDataValue('piece_id'),
                        qty: 1, // Each piece = 1 qty
                        berat: parseFloat(piece.getDataValue('berat')) || 0,
                        panjang: parseFloat(piece.getDataValue('panjang')) || 0,
                        lebar: parseFloat(piece.getDataValue('lebar')) || 0,
                        tinggi: parseFloat(piece.getDataValue('tinggi')) || 0,
                        reweight_status: piece.getDataValue('reweight_status') || 0,
                        pickup_status: piece.getDataValue('pickup_status') || 0
                    }))
                }
            };

            return response;

        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Error getting order detail: ${error.message}`);
        }
    }

    async estimatePrice(estimateDto: EstimatePriceDto) {
        const { origin, destination, item_details, service_options } = estimateDto;

        // Validasi qty maksimal per piece dan total
        this.validateQtyLimitsForEstimate(item_details.items);

        // Validasi layanan jika diisi
        const validServices = ['Ekonomi', 'Reguler', 'Kirim Motor', 'Paket', 'Express', 'Sewa Truk'];
        if (service_options.layanan && !validServices.includes(service_options.layanan)) {
            throw new BadRequestException('Layanan tidak valid');
        }

        // Validasi motor_type untuk layanan Kirim Motor
        if (service_options.layanan === 'Kirim Motor' && !service_options.motor_type) {
            throw new BadRequestException('Motor type wajib diisi untuk layanan Kirim Motor');
        }

        // Validasi truck_type untuk layanan Sewa Truk
        if (service_options.layanan === 'Sewa Truk' && !service_options.truck_type) {
            throw new BadRequestException('Truck type wajib diisi untuk layanan Sewa Truk');
        }

        // Hitung total dari semua items
        let totalWeight = 0;
        let totalVolume = 0;
        let totalBeratVolume = 0;
        const itemBreakdown: any[] = [];

        item_details.items.forEach((item, index) => {
            const qty = Number(item.qty) || 0;
            const berat = Number(item.berat) || 0;
            const panjang = Number(item.panjang) || 0;
            const lebar = Number(item.lebar) || 0;
            const tinggi = Number(item.tinggi) || 0;

            // Hitung per item
            const itemWeight = berat * qty;
            let itemVolume = 0;
            let itemBeratVolume = 0;

            if (panjang && lebar && tinggi) {
                itemVolume = this.calculateVolume(panjang, lebar, tinggi) * qty;
                itemBeratVolume = this.calculateBeratVolume(panjang, lebar, tinggi) * qty;
            }

            // Akumulasi total
            totalWeight += itemWeight;
            totalVolume += itemVolume;
            totalBeratVolume += itemBeratVolume;

            // Simpan breakdown per item
            itemBreakdown.push({
                item_index: index + 1,
                qty,
                berat_per_unit: berat,
                total_berat: itemWeight,
                volume: itemVolume,
                berat_volume: itemBeratVolume,
                dimensi: panjang && lebar && tinggi ? `${panjang}x${lebar}x${tinggi} cm` : 'Tidak tersedia',
            });
        });

        // Chargeable weight = max(total berat aktual, total berat volume)
        const chargeableWeight = Math.max(totalWeight, totalBeratVolume);

        // Fungsi untuk menghitung harga berdasarkan layanan
        const calculateServicePrice = (layanan: string) => {
            let basePrice = 0;
            let estimatedDays = 0;
            let serviceDescription = '';
            let isValid = true;
            let errorMessage = '';

            switch (layanan) {
                case 'Ekonomi':
                    basePrice = chargeableWeight * 3000; // Rp3.000/kg
                    estimatedDays = 4;
                    serviceDescription = 'Layanan ekonomi dengan estimasi 3-4+ hari';
                    break;

                case 'Reguler':
                    basePrice = chargeableWeight * 6000; // Rp6.000/kg
                    estimatedDays = 3;
                    serviceDescription = 'Layanan reguler dengan estimasi 2-4 hari';
                    break;

                case 'Paket':
                    if (totalWeight <= 25) {
                        basePrice = 15000; // Rp15.000
                        estimatedDays = 2;
                        serviceDescription = 'Layanan paket dengan batas maksimal 25kg';
                    } else {
                        isValid = false;
                        errorMessage = 'Berat melebihi batas maksimal 25kg untuk layanan Paket';
                    }
                    break;

                case 'Express':
                    // Estimasi jarak sederhana (bisa dikembangkan dengan API maps)
                    const estimatedDistance = 10; // km
                    basePrice = 10000 + (estimatedDistance * 3000); // Base + (jarak × Rp3.000/km)
                    estimatedDays = 1;
                    serviceDescription = 'Layanan express same day delivery';
                    break;

                case 'Kirim Motor':
                    if (service_options.motor_type) {
                        if (service_options.motor_type === '125cc') {
                            basePrice = 120000; // Rp120.000
                        } else {
                            basePrice = 150000; // Rp150.000
                        }
                        estimatedDays = 5;
                        serviceDescription = `Layanan kirim motor ${service_options.motor_type}`;
                    } else {
                        isValid = false;
                        errorMessage = 'Motor type wajib diisi untuk layanan Kirim Motor';
                    }
                    break;

                case 'Sewa Truk':
                    if (service_options.truck_type) {
                        if (service_options.truck_type === 'Pick Up') {
                            basePrice = 300000; // Rp300.000
                        } else {
                            basePrice = 800000; // Rp800.000
                        }
                        // Tambahan biaya per km
                        const truckDistance = 20; // km
                        basePrice += truckDistance * 2000; // Rp2.000/km
                        estimatedDays = 2;
                        serviceDescription = `Layanan sewa truk ${service_options.truck_type}`;
                    } else {
                        isValid = false;
                        errorMessage = 'Truck type wajib diisi untuk layanan Sewa Truk';
                    }
                    break;

                default:
                    isValid = false;
                    errorMessage = 'Layanan tidak dikenali';
                    break;
            }

            return {
                layanan,
                basePrice,
                estimatedDays,
                serviceDescription,
                isValid,
                errorMessage
            };
        };

        // Jika layanan tidak diisi, hitung untuk semua layanan yang relevan
        if (!service_options.layanan) {
            const servicesToCalculate = ['Ekonomi', 'Reguler', 'Paket', 'Express'];
            const allServices = servicesToCalculate.map(service => calculateServicePrice(service));

            // Hitung biaya tambahan dan diskon untuk setiap layanan
            const servicesWithPricing = allServices.map(service => {
                if (!service.isValid) {
                    return {
                        ...service,
                        pricing: null,
                        estimatedDeliveryDate: null
                    };
                }

                // Hitung biaya tambahan
                let additionalCosts = 0;
                const additionalServices: any[] = [];

                if (service_options.asuransi) {
                    const asuransiCost = service.basePrice * 0.02; // 2% dari harga dasar
                    additionalCosts += asuransiCost;
                    additionalServices.push({
                        service: 'Asuransi',
                        cost: asuransiCost,
                        description: 'Asuransi pengiriman 2% dari harga dasar'
                    });
                }

                if (service_options.packing) {
                    const packingCost = 5000; // Rp5.000
                    additionalCosts += packingCost;
                    additionalServices.push({
                        service: 'Packing',
                        cost: packingCost,
                        description: 'Packing tambahan'
                    });
                }

                // Hitung diskon voucher (jika ada)
                let discountAmount = 0;
                let voucherInfo: any = null;

                if (service_options.voucher_code) {
                    if (service_options.voucher_code === 'DISKONAKHIRBULAN') {
                        discountAmount = service.basePrice * 0.1; // 10% diskon
                        voucherInfo = {
                            code: service_options.voucher_code,
                            discount_percentage: 10,
                            discount_amount: discountAmount,
                            description: 'Diskon akhir bulan 10%'
                        };
                    }
                }

                // Hitung total harga
                const subtotal = service.basePrice + additionalCosts;
                const totalPrice = subtotal - discountAmount;

                // Estimasi waktu transit
                const estimatedDeliveryDate = new Date();
                estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + service.estimatedDays);

                return {
                    ...service,
                    pricing: {
                        base_price: service.basePrice,
                        additional_services: additionalServices,
                        subtotal: subtotal,
                        voucher: voucherInfo,
                        discount_amount: discountAmount,
                        total_price: totalPrice,
                    },
                    estimatedDeliveryDate: estimatedDeliveryDate.toISOString().split('T')[0]
                };
            });

            return {
                message: 'Estimasi harga untuk semua layanan berhasil dihitung',
                success: true,
                data: {
                    origin: {
                        provinsi: origin.provinsi,
                        kota: origin.kota,
                        kecamatan: origin.kecamatan,
                        kelurahan: origin.kelurahan,
                        kodepos: origin.kodepos,
                    },
                    destination: {
                        provinsi: destination.provinsi,
                        kota: destination.kota,
                        kecamatan: destination.kecamatan,
                        kelurahan: destination.kelurahan,
                        kodepos: destination.kodepos,
                    },
                    item_details: {
                        total_berat_aktual: totalWeight,
                        total_berat_volume: totalBeratVolume,
                        chargeable_weight: chargeableWeight,
                        total_volume: totalVolume,
                        total_qty: item_details.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
                        items_breakdown: itemBreakdown,
                    },
                    service_options: {
                        asuransi: service_options.asuransi || false,
                        packing: service_options.packing || false,
                        voucher_code: service_options.voucher_code || null,
                    },
                    services: servicesWithPricing
                }
            };
        }

        // Jika layanan diisi, hitung untuk layanan spesifik
        const serviceResult = calculateServicePrice(service_options.layanan);

        if (!serviceResult.isValid) {
            throw new BadRequestException(serviceResult.errorMessage);
        }

        const { basePrice, estimatedDays, serviceDescription } = serviceResult;

        // Hitung biaya tambahan
        let additionalCosts = 0;
        const additionalServices: any[] = [];

        if (service_options.asuransi) {
            const asuransiCost = basePrice * 0.02; // 2% dari harga dasar
            additionalCosts += asuransiCost;
            additionalServices.push({
                service: 'Asuransi',
                cost: asuransiCost,
                description: 'Asuransi pengiriman 2% dari harga dasar'
            });
        }

        if (service_options.packing) {
            const packingCost = 5000; // Rp5.000
            additionalCosts += packingCost;
            additionalServices.push({
                service: 'Packing',
                cost: packingCost,
                description: 'Packing tambahan'
            });
        }

        // Hitung diskon voucher (jika ada)
        let discountAmount = 0;
        let voucherInfo: any = null;

        if (service_options.voucher_code) {
            // Simulasi validasi voucher (bisa dikembangkan dengan tabel voucher)
            if (service_options.voucher_code === 'DISKONAKHIRBULAN') {
                discountAmount = basePrice * 0.1; // 10% diskon
                voucherInfo = {
                    code: service_options.voucher_code,
                    discount_percentage: 10,
                    discount_amount: discountAmount,
                    description: 'Diskon akhir bulan 10%'
                };
            }
        }

        // Hitung total harga
        const subtotal = basePrice + additionalCosts;
        const totalPrice = subtotal - discountAmount;

        // Estimasi waktu transit
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays);

        return {
            message: 'Estimasi harga berhasil dihitung',
            success: true,
            data: {
                origin: {
                    provinsi: origin.provinsi,
                    kota: origin.kota,
                    kecamatan: origin.kecamatan,
                    kelurahan: origin.kelurahan,
                    kodepos: origin.kodepos,
                },
                destination: {
                    provinsi: destination.provinsi,
                    kota: destination.kota,
                    kecamatan: destination.kecamatan,
                    kelurahan: destination.kelurahan,
                    kodepos: destination.kodepos,
                },
                item_details: {
                    total_berat_aktual: totalWeight,
                    total_berat_volume: totalBeratVolume,
                    chargeable_weight: chargeableWeight,
                    total_volume: totalVolume,
                    total_qty: item_details.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
                    items_breakdown: itemBreakdown,
                },
                service_details: {
                    layanan: service_options.layanan,
                    description: serviceDescription,
                    estimated_days: estimatedDays,
                    estimated_delivery_date: estimatedDeliveryDate.toISOString().split('T')[0],
                },
                pricing: {
                    base_price: basePrice,
                    additional_services: additionalServices,
                    subtotal: subtotal,
                    voucher: voucherInfo,
                    discount_amount: discountAmount,
                    total_price: totalPrice,
                },
                breakdown: {
                    base_service: basePrice,
                    additional_costs: additionalCosts,
                    discount: discountAmount,
                    total: totalPrice,
                },
            },
        };
    }

    async updateOrder(noResi: string, updateOrderDto: UpdateOrderDto): Promise<UpdateOrderResponseDto> {
        // Find order by no_resi
        const order = await this.orderModel.findOne({
            where: { no_tracking: noResi }
        });

        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }

        // Validate user permissions (basic check - can be enhanced)
        if (!updateOrderDto.updated_by_user_id) {
            throw new BadRequestException('User ID diperlukan untuk audit trail');
        }

        // Check if order can be updated based on current status
        this.validateOrderUpdatePermission(order);

        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            const updatedFields: string[] = [];

            // Update order details
            const orderUpdateData: any = {
                updated_at: new Date(),
            };

            // Check and update order info fields
            if (updateOrderDto.nama_barang !== undefined) {
                orderUpdateData.nama_barang = updateOrderDto.nama_barang;
                updatedFields.push('nama_barang');
            }
            if (updateOrderDto.harga_barang !== undefined) {
                orderUpdateData.harga_barang = updateOrderDto.harga_barang;
                updatedFields.push('harga_barang');
            }
            if (updateOrderDto.status !== undefined) {
                orderUpdateData.status = updateOrderDto.status;
                updatedFields.push('status');
            }
            if (updateOrderDto.layanan !== undefined) {
                orderUpdateData.layanan = updateOrderDto.layanan;
                updatedFields.push('layanan');
            }

            // Check and update shipper fields
            if (updateOrderDto.nama_pengirim !== undefined) {
                orderUpdateData.nama_pengirim = updateOrderDto.nama_pengirim;
                updatedFields.push('nama_pengirim');
            }
            if (updateOrderDto.alamat_pengirim !== undefined) {
                orderUpdateData.alamat_pengirim = updateOrderDto.alamat_pengirim;
                updatedFields.push('alamat_pengirim');
            }
            if (updateOrderDto.no_telepon_pengirim !== undefined) {
                orderUpdateData.no_telepon_pengirim = updateOrderDto.no_telepon_pengirim;
                updatedFields.push('no_telepon_pengirim');
            }
            if (updateOrderDto.email_pengirim !== undefined) {
                orderUpdateData.email_pengirim = updateOrderDto.email_pengirim;
                updatedFields.push('email_pengirim');
            }
            if (updateOrderDto.provinsi_pengirim !== undefined) {
                orderUpdateData.provinsi_pengirim = updateOrderDto.provinsi_pengirim;
                updatedFields.push('provinsi_pengirim');
            }
            if (updateOrderDto.kota_pengirim !== undefined) {
                orderUpdateData.kota_pengirim = updateOrderDto.kota_pengirim;
                updatedFields.push('kota_pengirim');
            }
            if (updateOrderDto.kecamatan_pengirim !== undefined) {
                orderUpdateData.kecamatan_pengirim = updateOrderDto.kecamatan_pengirim;
                updatedFields.push('kecamatan_pengirim');
            }
            if (updateOrderDto.kelurahan_pengirim !== undefined) {
                orderUpdateData.kelurahan_pengirim = updateOrderDto.kelurahan_pengirim;
                updatedFields.push('kelurahan_pengirim');
            }
            if (updateOrderDto.kodepos_pengirim !== undefined) {
                orderUpdateData.kodepos_pengirim = updateOrderDto.kodepos_pengirim;
                updatedFields.push('kodepos_pengirim');
            }

            // Check and update consignee fields
            if (updateOrderDto.nama_penerima !== undefined) {
                orderUpdateData.nama_penerima = updateOrderDto.nama_penerima;
                updatedFields.push('nama_penerima');
            }
            if (updateOrderDto.alamat_penerima !== undefined) {
                orderUpdateData.alamat_penerima = updateOrderDto.alamat_penerima;
                updatedFields.push('alamat_penerima');
            }
            if (updateOrderDto.no_telepon_penerima !== undefined) {
                orderUpdateData.no_telepon_penerima = updateOrderDto.no_telepon_penerima;
                updatedFields.push('no_telepon_penerima');
            }
            if (updateOrderDto.email_penerima !== undefined) {
                orderUpdateData.email_penerima = updateOrderDto.email_penerima;
                updatedFields.push('email_penerima');
            }
            if (updateOrderDto.provinsi_penerima !== undefined) {
                orderUpdateData.provinsi_penerima = updateOrderDto.provinsi_penerima;
                updatedFields.push('provinsi_penerima');
            }
            if (updateOrderDto.kota_penerima !== undefined) {
                orderUpdateData.kota_penerima = updateOrderDto.kota_penerima;
                updatedFields.push('kota_penerima');
            }
            if (updateOrderDto.kecamatan_penerima !== undefined) {
                orderUpdateData.kecamatan_penerima = updateOrderDto.kecamatan_penerima;
                updatedFields.push('kecamatan_penerima');
            }
            if (updateOrderDto.kelurahan_penerima !== undefined) {
                orderUpdateData.kelurahan_penerima = updateOrderDto.kelurahan_penerima;
                updatedFields.push('kelurahan_penerima');
            }
            if (updateOrderDto.kodepos_penerima !== undefined) {
                orderUpdateData.kodepos_penerima = updateOrderDto.kodepos_penerima;
                updatedFields.push('kodepos_penerima');
            }

            // Check and update additional fields from UI
            if (updateOrderDto.titik_kordinat_asal !== undefined) {
                orderUpdateData.latlngAsal = updateOrderDto.titik_kordinat_asal;
                updatedFields.push('latlngAsal');
            }

            if (updateOrderDto.tanggal_muat !== undefined) {
                orderUpdateData.pickup_time = updateOrderDto.tanggal_muat;
                updatedFields.push('pickup_time');
            }

            if (updateOrderDto.total_jam !== undefined) {
                orderUpdateData.total_jam = updateOrderDto.total_jam;
                updatedFields.push('total_jam');
            }

            if (updateOrderDto.total_koli !== undefined) {
                orderUpdateData.countUpdateKoli = updateOrderDto.total_koli;
                updatedFields.push('total_koli');
            }

            if (updateOrderDto.total_berat !== undefined) {
                orderUpdateData.total_berat = updateOrderDto.total_berat.toString();
                updatedFields.push('total_berat');
            }

            if (updateOrderDto.asuransi !== undefined) {
                orderUpdateData.asuransi = updateOrderDto.asuransi;
                updatedFields.push('asuransi');
            }

            if (updateOrderDto.packing !== undefined) {
                orderUpdateData.packing = updateOrderDto.packing;
                updatedFields.push('packing');
            }

            if (updateOrderDto.surat_jalan_balik !== undefined) {
                orderUpdateData.surat_jalan_balik = updateOrderDto.surat_jalan_balik;
                updatedFields.push('surat_jalan_balik');
            }

            if (updateOrderDto.titik_kordinat_tujuan !== undefined) {
                orderUpdateData.latlngTujuan = updateOrderDto.titik_kordinat_tujuan;
                updatedFields.push('latlngTujuan');
            }

            if (updateOrderDto.jenis_truck !== undefined) {
                orderUpdateData.truck_type = updateOrderDto.jenis_truck;
                updatedFields.push('truck_type');
            }

            if (updateOrderDto.jenis_pembayaran !== undefined) {
                orderUpdateData.metode_bayar_truck = updateOrderDto.jenis_pembayaran;
                updatedFields.push('metode_bayar_truck');
            }

            if (updateOrderDto.transporter !== undefined) {
                orderUpdateData.transporter_id = updateOrderDto.transporter;
                updatedFields.push('transporter_id');
            }

            // Update order if there are changes
            if (Object.keys(orderUpdateData).length > 1) { // More than just updated_at
                await this.orderModel.update(orderUpdateData, {
                    where: { id: order.id },
                    transaction
                });
            }

            // Audit trail removed - no longer creating order_histories entry

            await transaction.commit();

            return {
                message: 'Order berhasil diperbarui',
                success: true,
                data: {
                    no_resi: noResi,
                    updated_fields: updatedFields,
                },
            };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateOrderFields(noResi: string, payload: { data: Record<string, any>, updated_by_user_id: number }) {
        const order = await this.orderModel.findOne({ where: { no_tracking: noResi }, raw: true });
        if (!order) {
            throw new NotFoundException('Order tidak ditemukan');
        }
        if (!payload.updated_by_user_id) {
            throw new BadRequestException('updated_by_user_id diperlukan');
        }

        const allowedFields = Object.keys(this.orderModel.getAttributes());
        const updates: Record<string, any> = {};
        const changes: Record<string, { old: any; new: any }> = {};

        for (const [key, incomingValue] of Object.entries(payload.data || {})) {
            const isAllowed = allowedFields.includes(key) && key !== 'id' && key !== 'no_tracking' && key !== 'order_by' && key !== 'created_at';
            if (!isAllowed) continue;

            const currentValue = (order as any)[key];
            const hasChanged = incomingValue !== currentValue;
            if (!hasChanged) continue;

            updates[key] = incomingValue;
            changes[key] = { old: currentValue, new: incomingValue };
        }

        if (Object.keys(updates).length === 0) {
            throw new BadRequestException('Tidak ada perubahan nilai yang dikirim');
        }

        updates.updated_at = new Date();
        await this.orderModel.update(updates, { where: { id: (order as any).id } });

        return {
            message: 'Order berhasil diupdate',
            success: true,
            data: {
                no_tracking: (order as any).no_tracking,
                changes,
            },
        };
    }

    private validateOrderUpdatePermission(order: Order): void {
        // Check if order can be updated based on current status
        const restrictedStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED];

        if (restrictedStatuses.includes(order.status as any)) {
            throw new BadRequestException(`Order dengan status '${order.status}' tidak dapat diperbarui`);
        }

        // Additional business logic can be added here
        // For example, check if order is already picked up
        if ((order.getDataValue('status_pickup') as any) === 1) {
            // Maybe restrict certain field updates
        }
    }

    private async recalculateOrderTotals(orderId: number, transaction: Transaction): Promise<void> {
        const pieces = await this.orderPieceModel.findAll({
            where: { order_id: orderId },
            transaction
        });

        let totalBerat = 0;
        let totalKoli = pieces.length;

        for (const piece of pieces) {
            totalBerat += piece.berat || 0;
        }

        await this.orderModel.update({
            total_berat: totalBerat,
            total_koli: totalKoli,
            updated_at: new Date(),
        }, {
            where: { id: orderId },
            transaction
        });
    }

    private async createUpdateHistory(orderId: number, userId: number, updatedFields: string[], transaction: Transaction): Promise<void> {
        const remark = `Order details updated: ${updatedFields.join(', ')}`;

        const { date, time } = getOrderHistoryDateTime();
        await this.orderHistoryModel.create({
            order_id: orderId,
            status: 'Order Details Updated',
            remark: remark,
            date: date,
            time: time,
            created_by: userId,
        }, { transaction });
    }

    /**
     * Update order status based on pieces status
     * This method should be called whenever piece statuses change
     */
    private async updateOrderStatusFromPieces(orderId: number, transaction: Transaction): Promise<void> {
        const pieces = await this.orderPieceModel.findAll({
            where: { order_id: orderId },
            transaction
        });

        const newStatus = getOrderStatusFromPieces(pieces);

        await this.orderModel.update({
            status: newStatus,
            updated_at: new Date()
        }, {
            where: { id: orderId },
            transaction
        });
    }

    /**
     * Update order_shipments dengan data terbaru dari pieces
     */
    private async updateOrderShipmentsFromPieces(orderId: number, transaction: Transaction): Promise<void> {
        try {
            // Ambil semua pieces yang sudah di-reweight untuk order ini
            const pieces = await this.orderPieceModel.findAll({
                where: {
                    order_id: orderId,
                    reweight_status: 1
                },
                attributes: ['berat', 'panjang', 'lebar', 'tinggi'],
                transaction
            });

            if (pieces.length === 0) return;

            // Hitung total weight dan volume
            let totalWeight = 0;
            let totalVolume = 0;

            pieces.forEach((piece) => {
                const berat = Number(piece.getDataValue('berat')) || 0;
                const panjang = Number(piece.getDataValue('panjang')) || 0;
                const lebar = Number(piece.getDataValue('lebar')) || 0;
                const tinggi = Number(piece.getDataValue('tinggi')) || 0;

                totalWeight += berat;
                if (panjang && lebar && tinggi) {
                    totalVolume += this.calculateVolume(panjang, lebar, tinggi);
                }
            });

            // Update order_shipments dengan data terbaru
            await this.orderShipmentModel.update(
                {
                    berat: totalWeight,
                    panjang: pieces[0]?.getDataValue('panjang') || 0,
                    lebar: pieces[0]?.getDataValue('lebar') || 0,
                    tinggi: pieces[0]?.getDataValue('tinggi') || 0,
                    berat_reweight: totalWeight,
                    panjang_reweight: pieces[0]?.getDataValue('panjang') || 0,
                    lebar_reweight: pieces[0]?.getDataValue('lebar') || 0,
                    tinggi_reweight: pieces[0]?.getDataValue('tinggi') || 0,
                    qty_reweight: pieces.length,
                },
                {
                    where: { order_id: orderId },
                    transaction,
                }
            );

        } catch (error) {
            console.error('Error updating order shipments from pieces:', error);
            throw error;
        }
    }

    /**
     * Helper: Generate next piece counter untuk order tertentu
     */
    private async getNextPieceCounter(orderId: number): Promise<number> {
        try {
            const result = await this.orderPieceModel.findOne({
                attributes: [
                    [fn('MAX', col('piece_id')), 'maxPieceId']
                ],
                where: {
                    order_id: orderId,
                    piece_id: {
                        [Op.like]: `P${orderId}-%`
                    }
                },
                raw: true
            }) as any;

            if (result && result.maxPieceId) {
                const lastCounter = parseInt(result.maxPieceId.split('-')[1]) || 0;
                return lastCounter + 1;
            } else {
                return 1;
            }
        } catch (error) {
            console.error('Error getting next piece counter:', error);
            return 1;
        }
    }

    /**
     * Helper: Kurangi qty dari shipment, jika qty jadi 0 hapus shipment
     */
    private async reduceShipmentQty(orderId: number, pieceId: number): Promise<void> {
        // Ambil piece untuk cek reweight_status dan dimensi
        const piece = await this.orderPieceModel.findByPk(pieceId);
        if (!piece) return;

        const reweightStatus = piece.getDataValue('reweight_status');
        const berat = piece.getDataValue('berat');
        const panjang = piece.getDataValue('panjang');
        const lebar = piece.getDataValue('lebar');
        const tinggi = piece.getDataValue('tinggi');

        // Tentukan field yang digunakan berdasarkan reweight_status
        const whereClause: any = { order_id: orderId };

        // 1. Cari shipment berdasarkan field reweight terlebih dahulu
        let shipment = await this.orderShipmentModel.findOne({
            where: {
                order_id: orderId,
                berat_reweight: berat,
                panjang_reweight: panjang,
                lebar_reweight: lebar,
                tinggi_reweight: tinggi,
            }
        });

        // 2. Jika tidak ketemu, cari berdasarkan field dimensi biasa
        if (!shipment) {
            shipment = await this.orderShipmentModel.findOne({
                where: {
                    order_id: orderId,
                    berat: berat,
                    panjang: panjang,
                    lebar: lebar,
                    tinggi: tinggi,
                }
            });
        }

        if (shipment) {
            const shipmentId = shipment.getDataValue('id');
            const currentQty = shipment.getDataValue('qty') || 0;

            // 🔍 CALCULATE REAL-TIME: Hitung qty_reweight dari orderPiece yang sebenarnya
            const realQtyReweight = await this.orderPieceModel.count({
                where: {
                    order_shipment_id: shipmentId,
                    reweight_status: 1
                }
            });

            // 🛡️ DEFENSIVE: Cek data inkonsisten
            if (realQtyReweight > currentQty) {
                this.logger.warn(`Data inkonsisten ditemukan pada shipment ${shipmentId}: qty=${currentQty}, real_qty_reweight=${realQtyReweight}. Memperbaiki data...`);

                // Perbaiki data dengan set qty_reweight = qty (maksimal yang mungkin)
                await this.orderShipmentModel.update(
                    { qty_reweight: currentQty },
                    { where: { id: shipmentId } }
                );

                // Update variable untuk logika selanjutnya
                const correctedQtyReweight = currentQty;

                if (currentQty <= 1) {
                    // Hapus shipment
                    await this.orderShipmentModel.destroy({
                        where: { id: shipmentId }
                    });
                } else {
                    // Update dengan data yang sudah diperbaiki
                    const newQty = currentQty - 1;
                    let newQtyReweight = correctedQtyReweight;
                    if (correctedQtyReweight > 0) {
                        newQtyReweight = correctedQtyReweight - 1;
                    }

                    await this.orderShipmentModel.update(
                        {
                            qty_reweight: newQtyReweight,
                            qty: newQtyReweight
                        },
                        { where: { id: shipmentId } }
                    );
                }
            } else {
                // Data normal, lanjutkan logika biasa
                if (currentQty <= 1) {
                    // Jika qty asli tinggal 1 atau kurang, hapus shipment
                    await this.orderShipmentModel.destroy({
                        where: { id: shipmentId }
                    });
                } else {
                    // Kurangi qty asli
                    const newQty = currentQty - 1;

                    // 🔍 CALCULATE REAL-TIME: Hitung qty_reweight baru setelah delete
                    const newRealQtyReweight = Math.max(0, realQtyReweight - 1);

                    await this.orderShipmentModel.update(
                        {
                            qty_reweight: newRealQtyReweight,
                            qty: newRealQtyReweight
                        },
                        { where: { id: shipmentId } }
                    );
                }
            }
        }
    }

    /**
     * Helper: Cari shipment yang cocok dengan dimensi atau buat baru
     */
    private async findOrCreateShipmentForDimensions(orderId: number, berat: number, panjang: number, lebar: number, tinggi: number, useReweightFields: boolean = true): Promise<number> {
        // 1. Cari shipment berdasarkan field reweight terlebih dahulu
        let existingShipment = await this.orderShipmentModel.findOne({
            where: {
                order_id: orderId,
                berat_reweight: berat,
                panjang_reweight: panjang,
                lebar_reweight: lebar,
                tinggi_reweight: tinggi,
            }
        });

        // 2. Jika tidak ketemu, cari berdasarkan field dimensi biasa
        if (!existingShipment) {
            existingShipment = await this.orderShipmentModel.findOne({
                where: {
                    order_id: orderId,
                    berat: berat,
                    panjang: panjang,
                    lebar: lebar,
                    tinggi: tinggi,
                }
            });
        }

        if (existingShipment) {
            const shipmentId = existingShipment.getDataValue('id');

            // 3. Cek apakah field reweight kosong, jika ya update
            const beratReweight = existingShipment.getDataValue('berat_reweight');
            const panjangReweight = existingShipment.getDataValue('panjang_reweight');
            const lebarReweight = existingShipment.getDataValue('lebar_reweight');
            const tinggiReweight = existingShipment.getDataValue('tinggi_reweight');

            // Jika ada field reweight yang kosong atau null, update dengan dimensi baru
            if (!beratReweight || !panjangReweight || !lebarReweight || !tinggiReweight) {
                await this.orderShipmentModel.update(
                    {
                        berat_reweight: berat,
                        panjang_reweight: panjang,
                        lebar_reweight: lebar,
                        tinggi_reweight: tinggi,
                    },
                    { where: { id: shipmentId } }
                );
            }

            // 4. 🔍 CALCULATE REAL-TIME: Hitung qty_reweight dari orderPiece yang sebenarnya
            const realQtyReweight = await this.orderPieceModel.count({
                where: {
                    order_shipment_id: shipmentId,
                    reweight_status: 1
                }
            });

            await this.orderShipmentModel.update(
                {
                    qty_reweight: realQtyReweight + 1,  // Real-time calculation + 1 untuk piece baru
                    qty: realQtyReweight + 1
                },
                { where: { id: shipmentId } }
            );

            return shipmentId;
        } else {
            // 5. Buat shipment baru dengan semua field terisi
            const newShipment = await this.orderShipmentModel.create({
                order_id: orderId,
                qty: 1,
                berat: berat,
                panjang: panjang,
                lebar: lebar,
                tinggi: tinggi,
                berat_reweight: berat,
                panjang_reweight: panjang,
                lebar_reweight: lebar,
                tinggi_reweight: tinggi,
                qty_reweight: 1,
            } as any);

            return newShipment.id;
        }
    }

    async deleteOrder(noResi: string, body: any) {
        const { user_id } = body;

        this.logger.log(`Starting delete order process for no_resi: ${noResi}, user_id: ${user_id}`);

        try {
            // 1. Validasi user dan otorisasi
            const user = await this.userModel.findByPk(user_id);
            if (!user) {
                this.logger.error(`User not found: ${user_id}`);
                throw new Error('User tidak ditemukan');
            }

            // // 2. Validasi level user (hanya admin yang boleh menghapus)
            // const userLevel = user.getDataValue('level');
            // if (userLevel !== 1) { // Assuming level 1 is admin
            //     this.logger.error(`User ${user_id} with level ${userLevel} is not authorized to delete orders`);
            //     throw new Error('Anda tidak memiliki izin untuk menghapus order. Hanya admin yang dapat melakukan operasi ini.');
            // }

            // 3. Cari order berdasarkan no_resi
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi }
            });
            if (!order) {
                this.logger.error(`Order not found: ${noResi}`);
                throw new Error('Order tidak ditemukan');
            }

            const orderId = order.getDataValue('id');
            const currentStatus = order.getDataValue('status');

            this.logger.log(`Found order: ${orderId} with status: ${currentStatus}`);

            // 4. Validasi status order (hanya Draft atau Cancelled yang boleh dihapus)
            if (currentStatus !== 'Draft' && currentStatus !== 'Cancelled' && currentStatus !== 'draft' && currentStatus !== 'cancelled') {
                this.logger.warn(`Order ${orderId} cannot be deleted - current status: ${currentStatus}`);
                throw new Error(`Order tidak bisa dihapus karena status saat ini adalah '${currentStatus}'. Hanya order dengan status 'Draft' atau 'Cancelled' yang dapat dihapus.`);
            }

            const deletedTables: string[] = [];
            const deletedRecordsCount: any = {
                order_pieces: 0,
                order_shipments: 0,
                order_invoices: 0,
                request_cancel: 0,
                order_delivery_notes: 0,
                order_histories: 0
            };

            // 6.1. Hapus order_pieces
            const deletedPieces = await this.orderPieceModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.order_pieces = deletedPieces;
            if (deletedPieces > 0) {
                deletedTables.push('order_pieces');
                this.logger.log(`Deleted ${deletedPieces} order_pieces for order ${orderId}`);
            }

            // 6.2. Hapus order_shipments
            const deletedShipments = await this.orderShipmentModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.order_shipments = deletedShipments;
            if (deletedShipments > 0) {
                deletedTables.push('order_shipments');
                this.logger.log(`Deleted ${deletedShipments} order_shipments for order ${orderId}`);
            }

            // 6.3. Hapus order_invoices dan order_invoice_details
            if (this.orderModel.sequelize?.models.OrderInvoice) {
                const orderInvoices = await this.orderModel.sequelize.models.OrderInvoice.findAll({
                    where: { order_id: orderId }
                });

                if (orderInvoices && orderInvoices.length > 0) {
                    for (const invoice of orderInvoices) {
                        // Hapus order_invoice_details terlebih dahulu
                        if (this.orderModel.sequelize?.models.OrderInvoiceDetail) {
                            const deletedInvoiceDetails = await this.orderModel.sequelize.models.OrderInvoiceDetail.destroy({
                                where: { invoice_id: invoice.getDataValue('id') }
                            });

                            if (deletedInvoiceDetails && deletedInvoiceDetails > 0) {
                                this.logger.log(`Deleted ${deletedInvoiceDetails} order_invoice_details for invoice ${invoice.getDataValue('id')}`);
                            }
                        }
                    }

                    // Hapus order_invoices
                    const deletedInvoices = await this.orderModel.sequelize.models.OrderInvoice.destroy({
                        where: { order_id: orderId }
                    });
                    deletedRecordsCount.order_invoices = deletedInvoices || 0;
                    if (deletedInvoices && deletedInvoices > 0) {
                        deletedTables.push('order_invoices');
                        this.logger.log(`Deleted ${deletedInvoices} order_invoices for order ${orderId}`);
                    }
                }
            }

            // 6.4. Hapus request_cancel
            const deletedRequestCancel = await this.requestCancelModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.request_cancel = deletedRequestCancel;
            if (deletedRequestCancel > 0) {
                deletedTables.push('request_cancel');
                this.logger.log(`Deleted ${deletedRequestCancel} request_cancel for order ${orderId}`);
            }

            // 6.5. Hapus order_delivery_notes
            if (this.orderModel.sequelize?.models.OrderDeliveryNote) {
                const deletedDeliveryNotes = await this.orderModel.sequelize.models.OrderDeliveryNote.destroy({
                    where: {
                        no_tracking: {
                            [Op.like]: `%${noResi}%`
                        }
                    }
                });
                deletedRecordsCount.order_delivery_notes = deletedDeliveryNotes || 0;
                if (deletedDeliveryNotes && deletedDeliveryNotes > 0) {
                    deletedTables.push('order_delivery_notes');
                    this.logger.log(`Deleted ${deletedDeliveryNotes} order_delivery_notes for order ${orderId}`);
                }
            }

            // 6.6. Hapus order_histories (setelah mencatat riwayat penghapusan)
            const deletedHistories = await this.orderHistoryModel.destroy({
                where: { order_id: orderId }
            });
            deletedRecordsCount.order_histories = deletedHistories;
            if (deletedHistories > 0) {
                deletedTables.push('order_histories');
                this.logger.log(`Deleted ${deletedHistories} order_histories for order ${orderId}`);
            }

            // 7. Terakhir, hapus order
            await order.destroy();
            deletedTables.push('orders');
            this.logger.log(`Deleted order ${orderId}`);

            this.logger.log(`Order ${orderId} successfully deleted by user ${user_id}`);

            return {
                message: 'Order berhasil dihapus',
                success: true,
                data: {
                    order_id: orderId,
                    no_resi: noResi,
                    deleted_by: user.getDataValue('name'),
                    deleted_at: new Date().toISOString(),
                    deleted_tables: deletedTables,
                    deleted_records_count: deletedRecordsCount
                }
            };

        } catch (error) {
            this.logger.error(`Error in deleteOrder: ${error.message}`, error.stack);
            throw new Error(`Error deleting order: ${error.message}`);
        }
    }

    /**
     * Mendapatkan daftar order untuk dashboard OPS berdasarkan area pengguna
     */
    async getOpsOrders(
        query: OpsOrdersQueryDto,
        userId: number
    ): Promise<OpsOrdersResponseDto> {
        try {
            // 1. Ambil data user untuk mendapatkan hub_id atau service_center_id
            const user = await this.userModel.findByPk(userId, {
                attributes: ['id', 'hub_id', 'service_center_id', 'name']
            });

            if (!user) {
                throw new NotFoundException('User tidak ditemukan');
            }

            const userHubId = user.getDataValue('hub_id');
            const userServiceCenterId = user.getDataValue('service_center_id');

            const showAllHubs = query.all_hubs === true;

            if (!showAllHubs && !userHubId && !userServiceCenterId) {
                throw new BadRequestException('User tidak memiliki akses ke area operasional');
            }

            let areaFilter = {};
            const requestedHubId = query.hub_id;

            if (!showAllHubs) {
                if (query.next_hub) {
                    areaFilter = { next_hub: query.next_hub };
                } else if (requestedHubId) {
                    areaFilter = {
                        [Op.or]: [
                            { hub_source_id: requestedHubId },
                            { hub_dest_id: requestedHubId },
                            { current_hub: requestedHubId },
                            { next_hub: requestedHubId }
                        ]
                    };
                } else if (userHubId) {
                    areaFilter = {
                        [Op.or]: [
                            { hub_source_id: userHubId },      // Order Pickup (First Mile)
                            { hub_dest_id: userHubId },        // Order Delivery (Last Mile)
                            { current_hub: userHubId },          // Transit (Mid Mile)
                            { next_hub: userHubId }
                        ]
                    };
                } else if (userServiceCenterId) {
                    areaFilter = {
                        [Op.or]: [
                            { hub_source_id: userServiceCenterId },
                            { hub_dest_id: userServiceCenterId },
                            { current_hub: userServiceCenterId },
                            { next_hub: userServiceCenterId }
                        ]
                    };
                }
            }

            // 3. Buat filter berdasarkan status OPS
            let statusFilter = {};
            if (query.status) {
                switch (query.status) {
                    case 'order jemput':
                        statusFilter = {
                            [Op.and]: [
                                { [Op.or]: [{ status_pickup: null }, { status_pickup: 'siap pickup' }, { status_pickup: 'Picked Up' }, { status_pickup: 'Completed' }, { status_pickup: 'Failed' }] },
                                { is_gagal_pickup: 0 },
                                { issetManifest_inbound: 0 }
                            ]
                        };
                        break;
                    case 'reweight':
                        statusFilter = {
                            [Op.and]: [
                                { reweight_status: 0 },
                                { issetManifest_inbound: 1 },
                                { [Op.or]: [{ status_pickup: 'Picked Up' }, { status_pickup: null }, { status_pickup: 'Completed' }] }
                            ]
                        };
                        break;
                    case 'menunggu pengiriman':
                        statusFilter = {
                            [Op.and]: [
                                { reweight_status: 1 },
                                { status: { [Op.notIn]: ['In Transit', 'Delivered', 'Out for Delivery'] } }
                            ]
                        };
                        break;
                    case 'inbound':
                        statusFilter = {
                            [Op.and]: [
                                { status: 'In Transit' },
                                {
                                    [Op.or]: [
                                        { vendor_tracking_number: null },
                                        { vendor_tracking_number: '' }
                                    ]
                                }
                            ]
                        };
                        break;
                    case 'outbound':
                        statusFilter = {
                            [Op.and]: [
                                { status: 'In Transit' },
                                { issetManifest_outbound: 1 }
                            ]
                        };
                        break;
                    case 'vendor':
                        statusFilter = {
                            [Op.and]: [
                                { status: 'In Transit' },
                                { vendor_id: { [Op.not]: null } },
                                { current_hub: { [Op.not]: null } },
                                // vendor_tracking_number tidak boleh kosong/null
                                { vendor_tracking_number: { [Op.not]: null } },
                                { vendor_tracking_number: { [Op.ne]: '' } }
                            ]
                        };
                        break;
                    case 'order kirim':
                        statusFilter = {
                            [Op.and]: [
                                { status: 'Out for Delivery' }
                            ]
                        };
                        break;
                    case 'completed':
                        statusFilter = {
                            status: 'Delivered'
                        };
                        break;
                }
            }

            if (!showAllHubs) {
                if (['order kirim', 'menunggu pengiriman', 'completed', 'outbound', 'vendor'].includes(query.status as string)) {
                    if (requestedHubId) {
                        areaFilter = { current_hub: requestedHubId };
                    } else if (userHubId) {
                        areaFilter = { current_hub: userHubId };
                    } else if (userServiceCenterId) {
                        areaFilter = { current_hub: userServiceCenterId };
                    }
                }

                // Jika status adalah 'inbound', batasi area filter hanya pada next_hub
                if (query.status === 'inbound') {
                    if (requestedHubId) {
                        areaFilter = { next_hub: requestedHubId };
                    } else if (userHubId) {
                        areaFilter = { next_hub: userHubId };
                    } else if (userServiceCenterId) {
                        areaFilter = { next_hub: userServiceCenterId };
                    }
                }

                if (query.status === 'order jemput') {
                    if (requestedHubId) {
                        areaFilter = { hub_source_id: requestedHubId };
                    } else if (userHubId) {
                        areaFilter = { hub_source_id: userHubId };
                    } else if (userServiceCenterId) {
                        areaFilter = { hub_source_id: userServiceCenterId };
                    }
                }

                if (query.status === 'reweight') {
                    if (requestedHubId) {
                        areaFilter = { hub_source_id: requestedHubId };
                    } else if (userHubId) {
                        areaFilter = { hub_source_id: userHubId };
                    } else if (userServiceCenterId) {
                        areaFilter = { hub_source_id: userServiceCenterId };
                    }
                }
            }

            // 4. Buat search filter
            let searchFilter = {};
            if (query.search) {
                searchFilter = {
                    [Op.or]: [
                        { no_tracking: { [Op.like]: `%${query.search}%` } },
                        { nama_pengirim: { [Op.like]: `%${query.search}%` } },
                        { no_telepon_pengirim: { [Op.like]: `%${query.search}%` } },
                        { alamat_pengirim: { [Op.like]: `%${query.search}%` } }
                    ]
                };
            }

            // 5. Buat filter layanan
            let layananFilter = {};
            // 5.1. Buat filter berdasarkan tipe (prioritas lebih tinggi dari layanan)
            let tipeFilter = {};
            if (query.tipe) {
                switch (query.tipe) {
                    case 'barang':
                        // Exclude "Sewa truck" dan "International"
                        tipeFilter = {
                            layanan: { [Op.notIn]: ['Sewa truck', 'International'] }
                        };
                        break;
                    case 'sewa_truk':
                        // Hanya tampilkan "Sewa truck"
                        tipeFilter = {
                            layanan: 'Sewa truck'
                        };
                        break;
                    case 'international':
                        // Hanya tampilkan "International"
                        tipeFilter = {
                            layanan: 'International'
                        };
                        break;
                }
            } else if (query.layanan) {
                // Hanya gunakan filter layanan jika tipe tidak diisi
                layananFilter = {
                    layanan: { [Op.like]: `%${query.layanan}%` }
                };
            }

            // 6. Buat filter next_hub (dipindahkan ke penentuan areaFilter bila tidak ada hub_id)
            let nextHubFilter = {};

            // 7. Filter eksplisit hub asal/tujuan jika dikirim di query
            const explicitHubFilter: any = {};
            if (query.hub_source_id) {
                explicitHubFilter.hub_source_id = query.hub_source_id;
            }
            if (query.hub_dest_id) {
                explicitHubFilter.hub_dest_id = query.hub_dest_id;
            }

            // 8. Gabungkan semua filter
            const whereClause = {
                [Op.and]: [
                    areaFilter,
                    statusFilter,
                    searchFilter,
                    layananFilter,
                    tipeFilter,
                    nextHubFilter,
                    explicitHubFilter
                ]
            };

            // 8.1. Hitung summary statistics
            const summary = await this.calculateSummaryStatistics(areaFilter);

            // 9. Hitung total items untuk pagination
            const totalItems = await this.orderModel.count({
                where: whereClause
            });

            const limit = query.limit || 20;
            const page = query.page || 1;
            const totalPages = Math.ceil(totalItems / limit);
            const offset = (page - 1) * limit;

            // 9. Ambil data orders dengan pagination
            const orders = await this.orderModel.findAll({
                where: whereClause,
                attributes: [
                    'id',
                    'no_tracking',
                    'nama_pengirim',
                    'no_telepon_pengirim',
                    'alamat_pengirim',
                    'alamat_penerima',
                    'pickup_time',
                    'layanan',
                    'created_at',
                    'deliver_by',
                    'status',
                    'current_hub',
                    'hub_source_id',
                    'status_pickup',
                    'reweight_status',
                    'is_gagal_pickup',
                    'next_hub',
                    'vendor_id',
                    'vendor_tracking_number',
                    'issetManifest_inbound',
                    'issetManifest_outbound',
                    'status_pickup',
                    'status_deliver',
                    'invoiceStatus',
                    'hub_dest_id'
                ],
                include: [
                    {
                        model: this.orderPieceModel,
                        as: 'pieces',
                        attributes: ['berat', 'panjang', 'lebar', 'tinggi'],
                        required: false
                    },
                    {
                        model: this.hubModel,
                        as: 'hubSource',
                        attributes: ['id', 'nama'],
                        required: false
                    },
                    {
                        model: this.hubModel,
                        as: 'hubDestination',
                        attributes: ['id', 'nama'],
                        required: false
                    },
                    {
                        model: this.hubModel,
                        as: 'hubNext',
                        attributes: ['id', 'nama'],
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: limit,
                offset: offset,
            });

            const orderIds = orders.map(order => order.getDataValue('id') as number);

            const pickupStatusMap = new Map<number, number>();
            const deliveryStatusMap = new Map<number, number>();

            if (orderIds.length > 0) {
                const pickupStatusRecords = await this.orderPickupDriverModel.findAll({
                    where: { order_id: { [Op.in]: orderIds } },
                    attributes: ['order_id', 'status'],
                    order: [['updated_at', 'DESC']],
                    raw: true,
                }) as Array<{ order_id: number; status: number }>;

                for (const record of pickupStatusRecords) {
                    if (!pickupStatusMap.has(record.order_id)) {
                        pickupStatusMap.set(record.order_id, record.status);
                    }
                }

                const deliveryStatusRecords = await this.orderDeliverDriverModel.findAll({
                    where: { order_id: { [Op.in]: orderIds } },
                    attributes: ['order_id', 'status'],
                    order: [['updated_at', 'DESC']],
                    raw: true,
                }) as Array<{ order_id: number; status: number }>;

                for (const record of deliveryStatusRecords) {
                    if (!deliveryStatusMap.has(record.order_id)) {
                        deliveryStatusMap.set(record.order_id, record.status);
                    }
                }
            }

            // 10. Transform data ke format response yang diinginkan
            const transformedOrders: OrderOpsDto[] = await Promise.all(
                orders.map(async (order, index) => {
                    // Hitung berat dan koli dari order pieces
                    const orderPieces = order.getDataValue('pieces') || [];
                    const totalBerat = orderPieces.reduce((sum, piece) => {
                        return sum + (Number(piece.getDataValue('berat')) || 0);
                    }, 0);
                    const totalKoli = orderPieces.length;

                    // Format pickup time
                    const pickupTime = order.getDataValue('pickup_time');
                    let tanggalPickup = '';
                    let jam = '';

                    if (pickupTime) {
                        const pickupDate = new Date(pickupTime);
                        tanggalPickup = pickupDate.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                        jam = pickupDate.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }

                    // Tentukan status OPS
                    let statusOps = 'unknown';
                    const statusPickup = order.getDataValue('status_pickup');
                    const reweightStatus = order.getDataValue('reweight_status');
                    const status = order.getDataValue('status');
                    const isGagalPickup = order.getDataValue('is_gagal_pickup');

                    if ((!statusPickup || statusPickup === 'siap pickup') && isGagalPickup === 0) {
                        statusOps = 'order jemput';
                    } else if (reweightStatus === 0 && statusPickup === 'Picked Up') {
                        statusOps = 'reweight';
                    } else if (reweightStatus === 1 && status !== 'In Transit' && status !== 'Delivered' && status !== 'Out for Delivery') {
                        statusOps = 'menunggu pengiriman';
                    } else if (status === 'In Transit') {
                        // Prioritaskan status vendor jika vendor_id ada
                        const vendorIdVal = order.getDataValue('vendor_id');
                        if (vendorIdVal) {
                            statusOps = 'vendor';
                        } else {
                            // Bedakan inbound vs outbound
                            const issetOutbound = order.getDataValue('issetManifest_outbound');
                            if (issetOutbound === 1) {
                                statusOps = 'outbound';
                            } else {
                                statusOps = 'inbound';
                            }
                        }
                    } else if (status === 'Out for Delivery') {
                        statusOps = 'order kirim';
                    } else if (status === 'Delivered') {
                        statusOps = 'completed';
                    }

                    // Cari delivery note untuk order ini
                    const orderId = order.getDataValue('id');
                    const orderNoTracking = order.getDataValue('no_tracking');
                    const deliveryNote = await this.orderDeliveryNoteModel.findOne({
                        where: {
                            no_tracking: {
                                [Op.like]: `%${orderNoTracking}%`
                            }
                        },
                        attributes: ['no_delivery_note'],
                        raw: true
                    });

                    // Ambil nama hub tujuan
                    const hubDestination = order.getDataValue('hubDestination');
                    const hubTujuanNama = hubDestination ? hubDestination.getDataValue('nama') : undefined;

                    // Ambil nama hub asal
                    const hubSource = order.getDataValue('hubSource');
                    const hubAsalNama = hubSource ? hubSource.getDataValue('nama') : undefined;

                    // Ambil nama hub selanjutnya
                    const hubNext = order.getDataValue('hubNext');
                    const hubSelanjutnyaNama = hubNext ? hubNext.getDataValue('nama') : undefined;

                    return {
                        no: offset + index + 1,
                        order_id: orderId,
                        no_resi: order.getDataValue('no_tracking'),
                        customer: {
                            nama: order.getDataValue('nama_pengirim'),
                            telepon: order.getDataValue('no_telepon_pengirim')
                        },
                        alamat_pickup: order.getDataValue('alamat_pengirim'),
                        alamat_pengirim: order.getDataValue('alamat_pengirim'),
                        alamat_penerima: order.getDataValue('alamat_penerima'),
                        berat: `${totalBerat.toFixed(1)} kg`,
                        koli: totalKoli,
                        tanggal_pickup: tanggalPickup,
                        jam: jam,
                        status: statusOps,
                        deliver_by: order.getDataValue('deliver_by'),
                        status_pengiriman: order.getDataValue('status'),
                        layanan: order.getDataValue('layanan'),
                        created_at: order.getDataValue('created_at'),
                        no_delivery_note: deliveryNote?.no_delivery_note || undefined,
                        hub_selanjutnya: hubSelanjutnyaNama || undefined,
                        hub_asal: hubAsalNama || undefined,
                        hub_tujuan: hubTujuanNama || undefined,
                        issetManifest_inbound: order.getDataValue('issetManifest_inbound'),
                        vendor_id: order.getDataValue('vendor_id'),
                        vendor_tracking_number: order.getDataValue('vendor_tracking_number'),
                        pickup_driver_status: pickupStatusMap.get(orderId) ?? null,
                        delivery_driver_status: deliveryStatusMap.get(orderId) ?? null,
                        status_deliver: order.getDataValue('status_deliver'),
                        invoice_status: order.getDataValue('invoiceStatus'),
                        status_pickup: order.getDataValue('status_pickup')
                    };
                })
            );

            // 11. Buat response pagination
            const pagination: PaginationDto = {
                current_page: page,
                limit: limit,
                total_items: totalItems,
                total_pages: totalPages
            };

            return {
                message: 'Daftar order berhasil diambil',
                data: {
                    summary,
                    pagination,
                    orders: transformedOrders
                }
            };

        } catch (error) {
            this.logger.error(`Error in getOpsOrders: ${error.message}`, error.stack);
            throw error;
        }
    }

    async assignVendorTracking(
        noTracking: string,
        dto: AssignVendorTrackingDto,
    ): Promise<AssignVendorTrackingResponseDto> {
        try {
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking },
                attributes: ['id', 'no_tracking', 'vendor_id', 'vendor_tracking_number']
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // Opsional: pastikan sudah ada vendor yang ditugaskan
            const vendorId = order.getDataValue('vendor_id');
            if (!vendorId) {
                throw new BadRequestException('Order belum ditugaskan ke vendor');
            }

            await this.orderModel.update({
                vendor_tracking_number: dto.vendor_tracking_number,
                updated_at: new Date()
            }, {
                where: { id: order.getDataValue('id') }
            });

            return {
                message: 'Nomor resi vendor berhasil di-assign ke order',
                data: {
                    no_tracking: order.getDataValue('no_tracking'),
                    vendor_tracking_number: dto.vendor_tracking_number
                }
            };
        } catch (error) {
            this.logger.error(`Error assignVendorTracking: ${error.message}`);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Gagal meng-assign nomor resi vendor');
        }
    }

    /**
     * Mendapatkan daftar kurir yang tersedia untuk pickup berdasarkan order
     */
    async getAvailableDriversForPickup(
        query: AvailableDriversQueryDto
    ): Promise<AvailableDriversResponseDto> {
        try {
            // 1. Ambil data order untuk mendapatkan lokasi dan service center
            const order = await this.orderModel.findByPk(query.order_id, {
                attributes: [
                    'id',
                    'latlngAsal',
                    'svc_source_id',
                    'hub_source_id',
                    'status_pickup',
                    'is_gagal_pickup'
                ]
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // Validasi status order
            const statusPickup = order.getDataValue('status_pickup');
            const isGagalPickup = order.getDataValue('is_gagal_pickup');

            if ((statusPickup && statusPickup !== 'siap pickup') || isGagalPickup === 1) {
                throw new BadRequestException('Order tidak dalam status yang dapat ditugaskan untuk pickup');
            }

            // 2. Parse lokasi order
            let orderLocation: DriverLocationDto = { lat: 0, lng: 0 };
            const latlngAsal = order.getDataValue('latlngAsal');
            if (latlngAsal) {
                try {
                    // Handle format string langsung "lat,lng"
                    if (typeof latlngAsal === 'string' && latlngAsal.includes(',')) {
                        const [lat, lng] = latlngAsal.split(',').map(coord => parseFloat(coord.trim()));
                        if (!isNaN(lat) && !isNaN(lng)) {
                            orderLocation = { lat, lng };
                        }
                    } else {
                        // Handle format JSON
                        const latlngData = JSON.parse(latlngAsal);

                        // Handle format array of objects dengan field latlng
                        if (Array.isArray(latlngData) && latlngData.length > 0) {
                            // Ambil koordinat pertama (lokasi asal)
                            const firstLocation = latlngData[0];
                            if (firstLocation.latlng) {
                                const [lat, lng] = firstLocation.latlng.split(',').map(coord => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    orderLocation = { lat, lng };
                                }
                            }
                        } else if (latlngData.lat && latlngData.lng) {
                            // Handle format object langsung {lat: x, lng: y}
                            orderLocation = { lat: latlngData.lat, lng: latlngData.lng };
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Invalid latlng format for order ${query.order_id}: ${latlngAsal}`);
                }
            }

            const svcSourceId = order.getDataValue('svc_source_id');
            const hubSourceId = order.getDataValue('hub_source_id');

            // 3. Cari kurir yang memenuhi kriteria
            const driverWhereClause: any = {
                level: { [Op.eq]: 8 },
                aktif: 1,
                status_app: 1,
                freeze_saldo: 0,
                freeze_gps: 0
            };

            // Filter berdasarkan service center atau hub
            if (query.hub_id) {
                driverWhereClause.hub_id = query.hub_id;
            } else if (svcSourceId) {
                driverWhereClause.service_center_id = svcSourceId;
            } else if (hubSourceId) {
                driverWhereClause.hub_id = hubSourceId;
            }

            const drivers = await this.userModel.findAll({
                where: driverWhereClause,
                attributes: [
                    'id',
                    'name',
                    'phone',
                    'latlng',
                    'service_center_id',
                    'hub_id'
                ]
            });

            // 4. Filter dan hitung beban kerja kurir
            const availableDrivers: AvailableDriverDto[] = [];

            for (const driver of drivers) {
                const driverId = driver.getDataValue('id');

                // Hitung tugas yang sedang berjalan (pickup tasks saja untuk saat ini)
                const currentPickupTasks = await this.orderModel.count({
                    where: {
                        assign_driver: driverId,
                        status_pickup: { [Op.in]: ['Assigned', 'Picked Up'] }
                    }
                });

                // Untuk delivery tasks, gunakan tabel order_pickup_drivers jika ada
                let currentDeliveryTasks = 0;
                if (this.orderModel.sequelize?.models.OrderPickupDriver) {
                    const OrderPickupDriver = this.orderModel.sequelize.models.OrderPickupDriver;
                    currentDeliveryTasks = await OrderPickupDriver.count({
                        where: {
                            driver_id: driverId,
                            status: { [Op.in]: [1, 2] } // 1: in progress, 2: completed
                        }
                    });
                }

                const totalCurrentTasks = currentPickupTasks + currentDeliveryTasks;

                // Kurir dianggap tersedia jika tugas < 3
                if (totalCurrentTasks < 3) {
                    // Parse lokasi kurir
                    let driverLocation: DriverLocationDto = { lat: 0, lng: 0 };
                    const driverLatlng = driver.getDataValue('latlng');
                    if (driverLatlng) {
                        try {
                            // Handle format string langsung "lat,lng"
                            if (typeof driverLatlng === 'string' && driverLatlng.includes(',')) {
                                const [lat, lng] = driverLatlng.split(',').map(coord => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    driverLocation = { lat, lng };
                                }
                            } else {
                                // Handle format JSON
                                const latlngData = JSON.parse(driverLatlng);

                                // Handle format array of objects dengan field latlng
                                if (Array.isArray(latlngData) && latlngData.length > 0) {
                                    // Ambil koordinat terakhir (lokasi saat ini)
                                    const lastLocation = latlngData[latlngData.length - 1];
                                    if (lastLocation.latlng) {
                                        const [lat, lng] = lastLocation.latlng.split(',').map(coord => parseFloat(coord.trim()));
                                        if (!isNaN(lat) && !isNaN(lng)) {
                                            driverLocation = { lat, lng };
                                        }
                                    }
                                } else if (latlngData.lat && latlngData.lng) {
                                    // Handle format object langsung {lat: x, lng: y}
                                    driverLocation = { lat: latlngData.lat, lng: latlngData.lng };
                                }
                            }
                        } catch (error) {
                            this.logger.warn(`Invalid latlng format for driver ${driverId}: ${driverLatlng}`);
                        }
                    }

                    // Hitung jarak dari order (simplified calculation)
                    let distance = 0;
                    if (orderLocation.lat && orderLocation.lng && driverLocation.lat && driverLocation.lng) {
                        distance = this.calculateDistance(
                            orderLocation.lat, orderLocation.lng,
                            driverLocation.lat, driverLocation.lng
                        );
                    }

                    availableDrivers.push({
                        id: driverId,
                        name: driver.getDataValue('name'),
                        phone: driver.getDataValue('phone'),
                        current_location: driverLocation,
                        service_center_id: driver.getDataValue('service_center_id'),
                        hub_id: driver.getDataValue('hub_id'),
                        current_tasks: totalCurrentTasks,
                        distance_from_order: distance,
                        is_available: true
                    });
                }
            }

            // 5. Sort berdasarkan jarak terdekat dan beban kerja
            availableDrivers.sort((a, b) => {
                if (a.current_tasks !== b.current_tasks) {
                    return a.current_tasks - b.current_tasks; // Prioritas beban kerja rendah
                }
                return a.distance_from_order - b.distance_from_order; // Kemudian jarak terdekat
            });

            return {
                message: `Ditemukan ${availableDrivers.length} kurir yang tersedia`,
                success: true,
                data: {
                    order_id: query.order_id,
                    order_location: orderLocation,
                    available_drivers: availableDrivers,
                    total_available: availableDrivers.length
                }
            };

        } catch (error) {
            this.logger.error(`Error in getAvailableDriversForPickup: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Menugaskan kurir untuk pickup order
     */
    async assignDriverToOrder(
        assignDriverDto: AssignDriverDto
    ): Promise<AssignDriverResponseDto> {
        if (!this.orderModel.sequelize) {
            throw new InternalServerErrorException('Database connection tidak tersedia');
        }
        const transaction = await this.orderModel.sequelize.transaction();

        try {
            // 1. Validasi order
            const order = await this.orderModel.findByPk(assignDriverDto.order_id, {
                transaction
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // 2. Validasi driver
            const driver = await this.userModel.findByPk(assignDriverDto.driver_id, {
                transaction
            });

            if (!driver) {
                throw new NotFoundException('Driver tidak ditemukan');
            }

            const driverLevel = driver.getDataValue('level');
            if (driverLevel !== 8) {
                throw new BadRequestException('User yang dipilih bukan driver/kurir');
            }

            // 3. Validasi user yang melakukan penugasan
            const assignedByUser = await this.userModel.findByPk(assignDriverDto.assigned_by_user_id, {
                transaction
            });

            if (!assignedByUser) {
                throw new NotFoundException('User yang melakukan penugasan tidak ditemukan');
            }

            // 4. Validasi status order berdasarkan task_type
            if (assignDriverDto.task_type === 'pickup') {
                const statusPickup = order.getDataValue('status_pickup');
                const isGagalPickup = order.getDataValue('is_gagal_pickup');

                if ((statusPickup && statusPickup !== 'siap pickup') || isGagalPickup === 1) {
                    throw new BadRequestException('Order tidak dalam status yang dapat ditugaskan untuk pickup');
                }
            } else if (assignDriverDto.task_type === 'delivery') {
                const orderStatus = order.getDataValue('status');
                const hubDestId = order.getDataValue('hub_dest_id');

                // Validasi order sudah sampai di hub tujuan dan siap untuk delivery
                if (orderStatus !== ORDER_STATUS.IN_TRANSIT && orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY) {
                    throw new BadRequestException('Order belum siap untuk delivery. Status saat ini: ' + orderStatus);
                }
            }

            // 5. Update order berdasarkan task_type
            if (assignDriverDto.task_type === 'pickup') {
                await this.orderModel.update(
                    {
                        assign_driver: assignDriverDto.driver_id,
                        pickup_by: driver.getDataValue('name'),
                        status_pickup: 'Assigned',
                        updatedAt: new Date()
                    },
                    {
                        where: { id: assignDriverDto.order_id },
                        transaction
                    }
                );
            } else if (assignDriverDto.task_type === 'delivery') {
                await this.orderModel.update(
                    {
                        deliver_by: assignDriverDto.driver_id,
                        status: ORDER_STATUS.OUT_FOR_DELIVERY,
                        updatedAt: new Date()
                    },
                    {
                        where: { id: assignDriverDto.order_id },
                        transaction
                    }
                );
            }

            // 6. Buat record di tabel yang sesuai berdasarkan task_type
            if (assignDriverDto.task_type === 'pickup') {
                // Buat record di order_pickup_drivers
                const OrderPickupDriver = this.orderModel.sequelize?.models.OrderPickupDriver;
                if (OrderPickupDriver) {
                    await OrderPickupDriver.create({
                        order_id: assignDriverDto.order_id,
                        driver_id: assignDriverDto.driver_id,
                        assign_date: new Date(),
                        name: driver.getDataValue('name'),
                        status: 0, // pending
                        created_by: assignDriverDto.assigned_by_user_id,
                        photo: '', // default empty string untuk field wajib
                        notes: '', // default empty string untuk field wajib
                        signature: '' // default empty string untuk field wajib
                    }, { transaction });
                }
            } else if (assignDriverDto.task_type === 'delivery') {
                // Buat record di order_deliver_drivers
                const OrderDeliverDriver = this.orderModel.sequelize?.models.OrderDeliverDriver;
                if (OrderDeliverDriver) {
                    await OrderDeliverDriver.create({
                        order_id: assignDriverDto.order_id,
                        driver_id: assignDriverDto.driver_id,
                        assign_date: new Date(),
                        name: driver.getDataValue('name'),
                        status: 0, // pending
                        photo: '', // default empty string untuk field wajib
                        notes: '', // default empty string untuk field wajib
                        signature: '' // default empty string untuk field wajib
                    }, { transaction });
                }
            }

            // 7. Catat di order histories
            const historyStatus = assignDriverDto.task_type === 'pickup'
                ? 'Driver Assigned for Pickup'
                : 'Driver Assigned for Delivery';

            // Buat notification badge untuk order baru
            const menuName = assignDriverDto.task_type === 'pickup' ? 'Reweight' : 'Order Ditugaskan';
            await this.createNotificationBadge(assignDriverDto.order_id, menuName, 'order');

            const historyRemark = `Order ditugaskan kepada ${driver.getDataValue('name')} untuk tugas ${assignDriverDto.task_type}`;

            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: assignDriverDto.order_id,
                status: historyStatus,
                remark: historyRemark,
                date: date,
                time: time,
                created_by: assignDriverDto.assigned_by_user_id,
                created_at: new Date(),
                provinsi: '', // default empty string untuk field wajib
                kota: ''     // default empty string untuk field wajib
            }, { transaction });

            // 8. Commit transaction
            await transaction.commit();

            return {
                message: `Kurir berhasil ditugaskan untuk ${assignDriverDto.task_type}`,
                success: true,
                data: {
                    order_id: assignDriverDto.order_id,
                    driver_id: assignDriverDto.driver_id,
                    driver_name: driver.getDataValue('name'),
                    task_type: assignDriverDto.task_type,
                    assigned_at: new Date().toISOString(),
                    assigned_by: assignedByUser.getDataValue('name')
                }
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error in assignDriverToOrder: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Helper function untuk menghitung jarak antara 2 koordinat (Haversine formula)
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius bumi dalam km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Jarak dalam km
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Helper function untuk convert degree ke radian
     */
    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Submit reweight final untuk order
     */
    async submitReweight(
        orderId: number,
        submitReweightDto: SubmitReweightDto
    ): Promise<SubmitReweightResponseDto> {
        if (!this.orderModel.sequelize) {
            throw new InternalServerErrorException('Database connection tidak tersedia');
        }
        const transaction = await this.orderModel.sequelize.transaction();

        try {

            // 1. Validasi user yang melakukan submit
            const submittedByUser = await this.userModel.findByPk(submitReweightDto.submitted_by_user_id, {
                transaction
            });

            if (!submittedByUser) {
                throw new NotFoundException('User yang melakukan submit tidak ditemukan');
            }

            // 2. Validasi order
            const order = await this.orderModel.findByPk(orderId, {
                transaction
            });

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            // Ambil data hub asal
            const hubAsal = await this.hubModel.findByPk(order.getDataValue('hub_source_id'), {
                attributes: ['id', 'nama'],
                raw: true,
                transaction
            });

            // 3. Validasi semua pieces sudah di-reweight
            const orderPieces = await this.orderPieceModel.findAll({
                where: { order_id: orderId },
                transaction
            });

            if (orderPieces.length === 0) {
                throw new BadRequestException('Order tidak memiliki pieces');
            }

            const unreweightedPieces = orderPieces.filter(piece =>
                piece.getDataValue('reweight_status') !== 1
            );

            if (unreweightedPieces.length > 0) {
                throw new BadRequestException(`Masih ada ${unreweightedPieces.length} pieces yang belum di-reweight`);
            }

            // 4. Hitung total berat dan volume dari pieces yang sudah di-reweight
            let totalBerat = 0;
            let totalVolume = 0;
            let totalBeratVolume = 0;

            orderPieces.forEach((piece) => {
                const berat = Number(piece.getDataValue('berat')) || 0;
                const panjang = Number(piece.getDataValue('panjang')) || 0;
                const lebar = Number(piece.getDataValue('lebar')) || 0;
                const tinggi = Number(piece.getDataValue('tinggi')) || 0;

                totalBerat += berat;

                if (panjang && lebar && tinggi) {
                    const volume = this.calculateVolume(panjang, lebar, tinggi);
                    totalVolume += volume;
                    totalBeratVolume += this.calculateBeratVolume(panjang, lebar, tinggi);
                }
            });

            const chargeableWeight = Math.max(totalBerat, totalBeratVolume);

            // 5. Update order dengan data reweight final
            await this.orderModel.update(
                {
                    reweight_status: 1, // Completed/Final
                    total_berat: chargeableWeight,
                    updatedAt: new Date()
                },
                {
                    where: { id: orderId },
                    transaction
                }
            );

            // 6. Update order shipments dengan data terbaru
            await this.updateOrderShipmentsFromPieces(orderId, transaction);

            // 7. Auto-create invoice
            let invoiceData: { invoice_no: string; invoice_id: number; total_amount: number; } | null = null;
            try {
                invoiceData = await this.autoCreateInvoice(orderId, transaction);
            } catch (error) {
                this.logger.error(`Gagal auto-create invoice untuk order ${orderId}: ${error.message}`);
                // Invoice gagal dibuat, tapi reweight tetap berhasil
            }

            // Buat notification badge untuk order baru
            await this.createNotificationBadge(orderId, 'Dalam pengiriman', 'order');

            // Tandai notification "Reweight" sebagai sudah dibaca
            await this.markOrderReweight(orderId);

            // 9. Catat di order histories
            const hubAsalName = hubAsal?.nama || 'Unknown Hub';
            const remark = submitReweightDto.remark ||
                `Reweight finalized. Total berat: ${chargeableWeight.toFixed(2)} kg, Total volume: ${totalVolume.toFixed(2)} m³`;

            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: orderId,
                status: 'Reweight Finalized',
                remark: `pesanan diproses di${hubAsalName}`,
                date: date,
                time: time,
                created_by: submitReweightDto.submitted_by_user_id,
                created_at: new Date(),
                provinsi: order.getDataValue('provinsi_pengirim') || '',
                kota: order.getDataValue('kota_pengirim') || ''
            }, { transaction });

            // 10. Commit transaction
            await transaction.commit();

            return {
                message: 'Reweight berhasil di-submit dan order siap untuk delivery',
                success: true,
                data: {
                    order_id: orderId,
                    reweight_status: 1,
                    total_berat: chargeableWeight,
                    total_volume: totalVolume,
                    invoice_created: !!invoiceData,
                    invoice_data: invoiceData || undefined,
                    submitted_at: new Date().toISOString(),
                    submitted_by: submittedByUser.getDataValue('name')
                }
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error in submitReweight: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Mengajukan permintaan koreksi untuk reweight yang sudah final
     */
    async editReweightRequest(
        orderId: number,
        editReweightRequestDto: EditReweightRequestDto,
        userId: number
    ): Promise<EditReweightRequestResponseDto> {
        try {
            // 1. Validasi order
            const order = await this.orderModel.findByPk(orderId);

            if (!order) {
                throw new NotFoundException('Order tidak ditemukan');
            }

            const reweightStatus = order.getDataValue('reweight_status');
            if (reweightStatus !== 1) {
                throw new BadRequestException('Order tidak dalam status reweight final. Hanya order dengan reweight final yang dapat dikoreksi');
            }

            // 2. Validasi semua piece dalam request ada di order dan sudah di-reweight final
            const piecesInOrder: Record<number, any> = {};
            const allPieces = await this.orderPieceModel.findAll({ where: { order_id: orderId } });
            for (const p of allPieces) {
                piecesInOrder[p.getDataValue('id')] = p;
            }

            if (!editReweightRequestDto.pieces || editReweightRequestDto.pieces.length === 0) {
                throw new BadRequestException('Minimal satu piece harus diajukan');
            }

            for (const item of editReweightRequestDto.pieces) {
                const targetPiece = piecesInOrder[item.piece_id];
                if (!targetPiece) {
                    throw new NotFoundException(`Piece ${item.piece_id} tidak ditemukan di order ini`);
                }
                if (targetPiece.getDataValue('reweight_status') !== 1) {
                    throw new BadRequestException(`Piece ${item.piece_id} belum di-reweight final`);
                }
            }

            // 3. Validasi user yang mengajukan permintaan
            const requestingUser = await this.userModel.findByPk(userId);
            if (!requestingUser) {
                throw new NotFoundException('User yang mengajukan permintaan tidak ditemukan');
            }

            // 4. Validasi hak akses (admin hub atau staf ops)
            const userLevel = requestingUser.getDataValue('level');
            const userHubId = requestingUser.getDataValue('hub_id');
            const userServiceCenterId = requestingUser.getDataValue('service_center_id');

            if (![1, 2, 3, 4, 5, 6, 7, 8].includes(userLevel)) { // Level admin, supervisor, ops, driver
                throw new BadRequestException('User tidak memiliki hak akses untuk mengajukan koreksi reweight');
            }

            // 5. Validasi data baru tidak sama dengan data lama (hanya untuk piece yang benar-benar berubah)
            const piecesToUpdate: Array<{ piece_id: number; current_data: any; new_data: any; }> = [];

            for (const item of editReweightRequestDto.pieces) {
                const curr = piecesInOrder[item.piece_id];
                const currentBerat = curr.getDataValue('berat');
                const currentPanjang = curr.getDataValue('panjang');
                const currentLebar = curr.getDataValue('lebar');
                const currentTinggi = curr.getDataValue('tinggi');

                // Hanya proses piece yang benar-benar berubah
                if (
                    currentBerat !== item.berat ||
                    currentPanjang !== item.panjang ||
                    currentLebar !== item.lebar ||
                    currentTinggi !== item.tinggi
                ) {
                    piecesToUpdate.push({
                        piece_id: item.piece_id,
                        current_data: {
                            berat: currentBerat,
                            panjang: currentPanjang,
                            lebar: currentLebar,
                            tinggi: currentTinggi,
                        },
                        new_data: {
                            berat: item.berat,
                            panjang: item.panjang,
                            lebar: item.lebar,
                            tinggi: item.tinggi,
                        }
                    });
                }
            }

            // Jika tidak ada piece yang berubah, berikan pesan info
            if (piecesToUpdate.length === 0) {
                return {
                    message: 'Tidak ada perubahan data yang diajukan. Semua piece memiliki data yang sama.',
                    success: true,
                    data: {
                        order_id: orderId,
                        requested_by: requestingUser.getDataValue('name'),
                        requested_at: new Date().toISOString(),
                        note: editReweightRequestDto.note || '',
                        status: 'No Changes Required',
                        estimated_approval_time: null,
                        requests: [],
                    }
                };
            }

            // 6. Buat record di reweight_correction_requests untuk setiap item koreksi yang berubah
            const requests: Array<{ request_id: number; piece_id: number; current_data: any; new_data: any; }> = [];

            for (const item of piecesToUpdate) {
                // Buat record di tabel reweight_correction_requests
                const correctionRequest = await this.reweightCorrectionRequestModel.create({
                    order_id: orderId,
                    piece_id: item.piece_id,
                    current_berat: item.current_data.berat,
                    current_panjang: item.current_data.panjang,
                    current_lebar: item.current_data.lebar,
                    current_tinggi: item.current_data.tinggi,
                    new_berat: item.new_data.berat,
                    new_panjang: item.new_data.panjang,
                    new_lebar: item.new_data.lebar,
                    new_tinggi: item.new_data.tinggi,
                    note: editReweightRequestDto.note || '',
                    alasan_koreksi: editReweightRequestDto.alasan_koreksi || '',
                    status: 0, // Pending
                    requested_by: userId
                } as any);

                requests.push({
                    request_id: correctionRequest.getDataValue('id'),
                    piece_id: item.piece_id,
                    current_data: item.current_data,
                    new_data: item.new_data,
                });
            }

            // 7. Catat di order histories
            const pieceIds = editReweightRequestDto.pieces.map(p => p.piece_id).join(', ');
            const historyRemark = `Koreksi reweight diajukan untuk pieces [${pieceIds}]. Note: ${editReweightRequestDto.note || ''}`;

            // 8. Hitung estimasi waktu approval (24-48 jam)
            const estimatedApprovalTime = new Date();
            estimatedApprovalTime.setHours(estimatedApprovalTime.getHours() + 36); // 36 jam dari sekarang

            return {
                message: 'Permintaan koreksi reweight berhasil diajukan dan sedang menunggu persetujuan admin IT',
                success: true,
                data: {
                    order_id: orderId,
                    requested_by: requestingUser.getDataValue('name'),
                    requested_at: new Date().toISOString(),
                    note: editReweightRequestDto.note || '',
                    status: 'Pending Approval',
                    estimated_approval_time: estimatedApprovalTime.toISOString(),
                    requests,
                }
            };

        } catch (error) {
            this.logger.error(`Error in editReweightRequest: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Menghitung summary statistics untuk dashboard OPS
     */
    private async calculateSummaryStatistics(areaFilter: any): Promise<SummaryStatisticsDto> {
        try {
            // 1. Total pengiriman (semua order dalam area)
            const totalPengiriman = await this.orderModel.count({
                where: areaFilter
            });

            // 2. Nota kirim (dari delivery notes)
            // Buat filter area khusus untuk delivery notes (hanya menggunakan hub_id)
            let deliveryNoteAreaFilter = {};
            if (areaFilter[Op.or]) {
                // Ambil hub_id dari areaFilter dan buat filter untuk delivery notes
                const hubIds: number[] = [];
                for (const condition of areaFilter[Op.or] as any[]) {
                    if (condition.hub_source_id) hubIds.push(condition.hub_source_id);
                    if (condition.hub_dest_id) hubIds.push(condition.hub_dest_id);
                    if (condition.current_hub) hubIds.push(condition.current_hub);
                }
                if (hubIds.length > 0) {
                    deliveryNoteAreaFilter = {
                        hub_id: { [Op.in]: hubIds }
                    };
                }
            }

            const notaKirim = await this.orderDeliveryNoteModel.count({
                where: deliveryNoteAreaFilter
            });

            // 3. Pengiriman berhasil (status Delivered)
            const pengirimanBerhasil = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        { status: 'Delivered' }
                    ]
                }
            });

            // 4. Pengiriman gagal (is_gagal_pickup = 1 atau status tertentu yang gagal)
            const pengirimanGagal = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        {
                            [Op.or]: [
                                { is_gagal_pickup: 1 },
                                { status: 'Failed' },
                                { status: 'Cancelled' }
                            ]
                        }
                    ]
                }
            });

            // 5. Order masuk (status baru atau pending)
            const orderMasuk = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        {
                            [Op.or]: [
                                { status: 'Draft' },
                            ]
                        }
                    ]
                }
            });

            // 6. Reweight (reweight_status = 0)
            const reweight = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        { reweight_status: 0 }
                    ]
                }
            });

            // 7. Menunggu driver (status_pickup = 'siap pickup' atau null)
            const menungguDriver = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        {
                            [Op.or]: [
                                { status_pickup: null },
                                { status_pickup: 'siap pickup' }
                            ]
                        },
                        { is_gagal_pickup: 0 }
                    ]
                }
            });

            // 8. Proses penjemputan (status_pickup = 'Assigned' atau 'Picked Up')
            const prosesPenjemputan = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        {
                            status_pickup: { [Op.in]: ['Assigned', 'Picked Up'] }
                        }
                    ]
                }
            });

            // 9. Proses pengiriman (status 'In Transit' atau 'Out for Delivery')
            const prosesPengiriman = await this.orderModel.count({
                where: {
                    [Op.and]: [
                        areaFilter,
                        {
                            status: { [Op.in]: ['In Transit', 'Out for Delivery'] }
                        }
                    ]
                }
            });

            return {
                total_pengiriman: totalPengiriman,
                nota_kirim: notaKirim,
                pengiriman_berhasil: pengirimanBerhasil,
                pengiriman_gagal: pengirimanGagal,
                order_masuk: orderMasuk,
                reweight: reweight,
                menunggu_driver: menungguDriver,
                proses_penjemputan: prosesPenjemputan,
                proses_pengiriman: prosesPengiriman
            };

        } catch (error) {
            this.logger.error(`Error calculating summary statistics: ${error.message}`, error.stack);
            // Return default values jika ada error
            return {
                total_pengiriman: 0,
                nota_kirim: 0,
                pengiriman_berhasil: 0,
                pengiriman_gagal: 0,
                order_masuk: 0,
                reweight: 0,
                menunggu_driver: 0,
                proses_penjemputan: 0,
                proses_pengiriman: 0
            };
        }
    }

    /**
     * Mendapatkan bukti foto reweight dari order ID tertentu
     */
    async getReweightProof(orderId: number): Promise<{ message: string; success: boolean; data: any }> {
        try {
            // Validasi order exists
            const order = await this.orderModel.findByPk(orderId);
            if (!order) {
                throw new NotFoundException(`Order dengan ID ${orderId} tidak ditemukan`);
            }

            // Cari file log dengan used_for = bulk_reweight_proof_order_id_${orderId}
            const usedFor = `bulk_reweight_proof_order_id_${orderId}`;

            const fileLogs = await this.fileLogModel.findAll({
                where: {
                    used_for: usedFor
                },
                order: [['created_at', 'DESC']],
                raw: true
            });

            // Format response
            const formattedFiles = fileLogs.map(file => ({
                id: file.id,
                file_name: file.file_name,
                file_path: file.file_path,
                file_type: file.file_type,
                file_size: file.file_size,
                user_id: file.user_id,
                used_for: file.used_for,
                created_at: file.created_at
            }));

            return {
                message: 'Bukti foto reweight berhasil diambil',
                success: true,
                data: {
                    order_id: orderId,
                    total_files: fileLogs.length,
                    files: formattedFiles
                }
            };

        } catch (error) {
            this.logger.error(`Error getting reweight proof for order ${orderId}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException('Terjadi kesalahan saat mengambil bukti foto reweight');
        }
    }

    /**
     * Calculate invoice amounts
     */
    private calculateInvoiceAmounts(shipmentData: any, createOrderDto: CreateOrderDto): {
        subtotal: number;
        packing: number;
        asuransi: number;
        ppn: number;
        total: number;
        chargeableWeight: number;
    } {
        // Hitung chargeable weight (berat terberat antara berat aktual dan berat volume)
        const chargeableWeight = Math.max(shipmentData.totalBerat, shipmentData.beratVolume);

        // Pastikan chargeableWeight minimal 1 kg untuk menghindari division by zero
        const safeChargeableWeight = Math.max(chargeableWeight, 1);

        const subtotal = safeChargeableWeight * 1000; // Asumsi harga per kg
        const packing = createOrderDto.packing || 0;
        const asuransi = createOrderDto.asuransi || 0;
        const ppn = Math.round(subtotal * 0.11); // 11% PPN
        const total = subtotal + packing + asuransi + ppn;

        return {
            subtotal,
            packing,
            asuransi,
            ppn,
            total,
            chargeableWeight: safeChargeableWeight
        };
    }

    /**
     * Calculate invoice amounts for truck rental
     */
    private calculateTruckRentalInvoiceAmounts(totalHarga: number, asuransi: number): {
        subtotal: number;
        asuransi: number;
        ppn: number;
        total: number;
    } {
        const subtotal = totalHarga;
        const asuransiAmount = asuransi || 0;
        const ppn = Math.round(subtotal * 0.11); // 11% PPN
        const total = subtotal + asuransiAmount + ppn;

        return {
            subtotal,
            asuransi: asuransiAmount,
            ppn,
            total
        };
    }

    /**
     * Mengkonfirmasi bahwa seluruh proses order telah selesai
     */
    async completeOrder(noTracking: string, completedByUserId: number): Promise<{ message: string; success: boolean; data: any }> {
        try {
            // 1. Validasi order exists
            const order = await this.orderModel.findOne({
                where: { no_tracking: noTracking }
            });

            if (!order) {
                throw new NotFoundException(`Order dengan nomor tracking ${noTracking} tidak ditemukan`);
            }

            // 3. Validasi status pembayaran
            const paymentStatus = order.getDataValue('payment_status');
            const invoiceStatus = order.getDataValue('invoiceStatus');
            const isUnpaid = order.getDataValue('isUnpaid');

            // Cek apakah pembayaran sudah lunas
            const isPaymentComplete =
                paymentStatus === 'paid' ||
                (invoiceStatus === INVOICE_STATUS.LUNAS && isUnpaid === 0);

            if (!isPaymentComplete) {
                throw new BadRequestException('Pesanan tidak dapat diselesaikan karena belum lunas');
            }

            // 4. Validasi user yang melakukan complete
            const user = await this.userModel.findByPk(completedByUserId);
            if (!user) {
                throw new NotFoundException(`User dengan ID ${completedByUserId} tidak ditemukan`);
            }

            // 5. Update status order menjadi 'Completed'
            await this.orderModel.update(
                {
                    status: ORDER_STATUS.DELIVERED,
                    updated_at: new Date()
                },
                {
                    where: { no_tracking: noTracking }
                }
            );

            // 6. Buat order history
            const { date, time } = getOrderHistoryDateTime();

            await this.orderHistoryModel.create({
                order_id: order.getDataValue('id'),
                status: ORDER_STATUS.DELIVERED,
                remark: 'Pesanan diterima',
                date: date,
                time: time,
                provinsi: '',
                kota: '',
                created_by: completedByUserId,
                created_at: new Date()
            });

            // 7. Ambil data order yang sudah diupdate
            const updatedOrder = await this.orderModel.findOne({
                where: { no_tracking: noTracking }
            });

            if (!updatedOrder) {
                throw new InternalServerErrorException('Gagal mengambil data order yang sudah diupdate');
            }

            // 8. Cari delivery note untuk order ini
            const deliveryNote = await this.orderDeliveryNoteModel.findOne({
                where: {
                    no_tracking: {
                        [Op.like]: `%${noTracking}%`
                    }
                },
                attributes: ['no_delivery_note'],
                raw: true
            });

            return {
                message: 'Pesanan berhasil diselesaikan',
                success: true,
                data: {
                    no_tracking: noTracking,
                    status: updatedOrder.getDataValue('status'),
                    completed_at: updatedOrder.getDataValue('updated_at'),
                    completed_by: completedByUserId,
                    no_delivery_note: deliveryNote?.no_delivery_note || undefined
                }
            };

        } catch (error) {
            this.logger.error(`Error completing order ${noTracking}: ${error.message}`, error.stack);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Terjadi kesalahan saat menyelesaikan pesanan');
        }
    }

    /**
     * Forward order to vendor for transit to final destination
     */
    async forwardToVendor(noResi: string, dto: ForwardToVendorDto): Promise<ForwardToVendorResponseDto> {
        try {
            // a) Validasi Order & Otorisasi & Vendor
            const assignedByUser = await this.userModel.findByPk(dto.assigned_by_user_id, {
                attributes: ['id', 'name', 'level']
            });
            if (!assignedByUser) {
                throw new NotFoundException('User penugas tidak ditemukan');
            }

            // NOTE: Sesuaikan rule akses jika diperlukan
            // contoh: if (![1,2,7].includes(assignedByUser.getDataValue('level'))) throw new BadRequestException('Tidak berhak menugaskan ke vendor');

            // Validasi order
            const order = await this.orderModel.findOne({
                where: { no_tracking: noResi },
                attributes: ['id', 'no_tracking', 'status']
            });

            if (!order) {
                throw new NotFoundException(`Order dengan nomor resi ${noResi} tidak ditemukan`);
            }

            const currentStatus = order.getDataValue('status');
            if (currentStatus === ORDER_STATUS.DELIVERED || currentStatus === ORDER_STATUS.CANCELLED) {
                throw new BadRequestException('Order tidak dapat ditugaskan karena sudah selesai/dibatalkan');
            }

            // Validasi vendor
            const vendor = await this.vendorModel.findByPk(dto.vendor_id, {
                attributes: ['id', 'nama_vendor', 'status_vendor']
            });
            if (!vendor) {
                throw new NotFoundException('Vendor tidak ditemukan');
            }
            if (vendor.getDataValue('status_vendor') !== 'Aktif') {
                throw new BadRequestException('Vendor tidak aktif');
            }

            await this.orderModel.update({
                vendor_id: vendor.getDataValue('id'),
                status: ORDER_STATUS.IN_TRANSIT,
                updated_at: new Date(),
            }, {
                where: { no_tracking: noResi }
            });

            return {
                status: 'success' as const,
                message: `Order ${noResi} berhasil ditugaskan kepada ${vendor.getDataValue('nama_vendor')}.`,
                data: {
                    no_tracking: noResi,
                    vendor_id: vendor.getDataValue('id'),
                    vendor_name: vendor.getDataValue('nama_vendor'),
                }
            };

        } catch (error) {
            this.logger.error(`Error forwarding order ${noResi} to vendor: ${error.message}`, error.stack);

            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Terjadi kesalahan saat meneruskan order ke vendor');
        }
    }

    /**
     * Schedule automatic "pesanan diproses" entry after 5 minutes
     */
    private scheduleAutoProcessOrder(orderId: number, userId: number) {
        setTimeout(async () => {
            try {
                // Get database connection to ensure it's still active
                const sequelize = this.orderHistoryModel.sequelize;

                if (!sequelize) {
                    throw new Error('Database connection not available');
                }

                // Test connection before proceeding
                await sequelize.authenticate();

                // Check if there are any new entries after "Pesanan berhasil dibuat"
                const latestHistory = await this.orderHistoryModel.findOne({
                    where: { order_id: orderId },
                    order: [['created_at', 'DESC']]
                });

                if (latestHistory) {
                    const latestRemark = latestHistory.getDataValue('remark');

                    // If the latest entry is still "Pesanan berhasil dibuat", create "pesanan diproses"
                    if (latestRemark === 'Pesanan berhasil dibuat') {
                        const { date, time } = getOrderHistoryDateTime();
                        await this.orderHistoryModel.create({
                            order_id: orderId,
                            status: ORDER_STATUS.READY_FOR_PICKUP,
                            date: date,
                            time: time,
                            remark: 'pesanan diproses',
                            provinsi: '', // Will be updated from order data if needed
                            kota: '', // Will be updated from order data if needed
                            created_by: userId,
                        });

                        this.logger.log(`Auto-created "pesanan diproses" entry for order ${orderId}`);
                    } else {
                        this.logger.log(`Skipped auto-process for order ${orderId} - already processed (latest: ${latestRemark})`);
                    }
                } else {
                    this.logger.warn(`No history found for order ${orderId} during auto-process`);
                }
            } catch (error) {
                this.logger.error(`Error in auto-process order ${orderId}: ${error.message}`);

                // Log additional error details for debugging
                if (error.code === 'ECONNRESET') {
                    this.logger.error(`Database connection reset for order ${orderId} - this is expected after 5 minutes`);
                }

                // Try to reconnect and retry once
                try {
                    const sequelize = this.orderHistoryModel.sequelize;
                    if (sequelize) {
                        await sequelize.authenticate();
                        this.logger.log(`Database reconnected successfully for order ${orderId}`);
                    } else {
                        this.logger.error(`Database connection not available for reconnection - order ${orderId}`);
                    }
                } catch (reconnectError) {
                    this.logger.error(`Failed to reconnect database for order ${orderId}: ${reconnectError.message}`);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
    }

    /**
     * Helper method untuk menandai notification "Reweight" sebagai sudah dibaca
     */
    private async markOrderReweight(orderId: number): Promise<void> {
        try {
            await this.notificationBadgesService.markOrderReweight(orderId);
        } catch (error) {
            this.logger.error(`Error marking Reweight as read for order ${orderId}: ${error.message}`);
        }
    }

    /**
     * Helper method untuk membuat notification badge
     */
    private async createNotificationBadge(
        orderId: number,
        menuName: string,
        itemType: string = 'order'
    ): Promise<void> {
        try {
            // Dapatkan user yang relevan untuk notifikasi (ops team, admin, dll)
            const opsUsers = await this.userModel.findAll({
                where: {
                    [Op.or]: [
                        { level: 3 }, // Admin
                        { level: 6 }, // finance
                        { level: 7 }, // Ops
                        { level: 9 }, // traffic
                    ]
                },
                attributes: ['id'],
                raw: true,
            });

            const userIds = opsUsers.map(user => user.id);

            if (userIds.length > 0) {
                // Ambil hub_id dari order berdasarkan jenis notification
                const order = await this.orderModel.findByPk(orderId, {
                    attributes: ['hub_source_id', 'hub_dest_id', 'current_hub', 'next_hub'],
                    raw: true
                });

                let hubId = 0;
                if (menuName === 'Order Masuk') {
                    hubId = order?.hub_source_id || 0;
                } else if (menuName === 'Dalam pengiriman') {
                    hubId = order?.hub_source_id || 0;
                } else if (menuName === 'Order kirim') {
                    hubId = Number(order?.next_hub) || order?.hub_dest_id || 0;
                } else if (menuName === 'hub kosong') {
                    // Untuk hub kosong, gunakan hub yang tidak kosong atau default 0
                    hubId = order?.hub_source_id || order?.hub_dest_id || 0;
                } else {
                    hubId = order?.hub_source_id || order?.hub_dest_id || 0;
                }

                await this.notificationBadgesService.createNotificationBadgeForHub(
                    menuName,
                    orderId,
                    itemType,
                    hubId
                );
            }
        } catch (error) {
            this.logger.error(`Error creating ${menuName} notification for order ${orderId}: ${error.message}`);
        }
    }

    /**
     * Membuat pesanan sewa truk baru
     */
    async createTruckRentalOrder(createTruckRentalDto: CreateTruckRentalOrderDto, userId: number): Promise<CreateTruckRentalOrderResponseDto> {
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            // Generate no_tracking
            const noTracking = TrackingHelper.generateNoTracking();

            // Hitung estimasi harga menggunakan rates service
            const priceEstimate = await this.ratesService.calculateTruckRentalRate(
                createTruckRentalDto.origin_latlng,
                createTruckRentalDto.destination_latlng,
                undefined,
                createTruckRentalDto.truck_type,
                createTruckRentalDto.need_jasa_bongkar,
                createTruckRentalDto.num_helpers
            );

            // Tentukan jarak berdasarkan isUseToll
            const selectedRoute = createTruckRentalDto.isUseToll ?
                priceEstimate.data.estimasi_harga.tol :
                priceEstimate.data.estimasi_harga.non_tol;

            // Parse harga dari format rupiah ke number
            const hargaDasar = this.parseRupiahToNumber(selectedRoute.harga_dasar);
            const totalHarga = this.parseRupiahToNumber(selectedRoute.total);
            const asuransiValue = createTruckRentalDto.asuransi ? 1 : 0;
            const totalHargaFinal = totalHarga;

            // Tentukan hub source/dest berdasarkan alamat
            const hubSourceId = await this.findHubIdForAddress(
                createTruckRentalDto.provinsi_pengirim,
                createTruckRentalDto.kota_pengirim,
                createTruckRentalDto.alamat_pengirim,
            );
            const hubDestId = await this.findHubIdForAddress(
                createTruckRentalDto.provinsi_penerima,
                createTruckRentalDto.kota_penerima,
                createTruckRentalDto.alamat_penerima,
            );

            // Handle default value untuk kodepos_pengirim dan kodepos_penerima jika kosong
            const kodeposPengirim = createTruckRentalDto.kodepos_pengirim && createTruckRentalDto.kodepos_pengirim.trim() !== ''
                ? createTruckRentalDto.kodepos_pengirim.trim()
                : '-';
            const kodeposPenerima = createTruckRentalDto.kodepos_penerima && createTruckRentalDto.kodepos_penerima.trim() !== ''
                ? createTruckRentalDto.kodepos_penerima.trim()
                : '-';

            // Buat pesanan baru
            const newOrder = await this.orderModel.create({
                no_tracking: noTracking,
                user_id: userId,
                layanan: createTruckRentalDto.layanan,
                nama_pengirim: createTruckRentalDto.nama_pengirim,
                alamat_pengirim: createTruckRentalDto.alamat_pengirim,
                provinsi_pengirim: createTruckRentalDto.provinsi_pengirim,
                kota_pengirim: createTruckRentalDto.kota_pengirim,
                kecamatan_pengirim: createTruckRentalDto.kecamatan_pengirim,
                kelurahan_pengirim: createTruckRentalDto.kelurahan_pengirim,
                kodepos_pengirim: kodeposPengirim,
                no_telepon_pengirim: createTruckRentalDto.no_telepon_pengirim,
                nama_penerima: createTruckRentalDto.nama_penerima,
                alamat_penerima: createTruckRentalDto.alamat_penerima,
                provinsi_penerima: createTruckRentalDto.provinsi_penerima,
                kota_penerima: createTruckRentalDto.kota_penerima,
                kecamatan_penerima: createTruckRentalDto.kecamatan_penerima,
                kelurahan_penerima: createTruckRentalDto.kelurahan_penerima,
                kodepos_penerima: kodeposPenerima,
                no_telepon_penerima: createTruckRentalDto.no_telepon_penerima,
                nama_barang: createTruckRentalDto.keterangan_barang || "Muatan sewa truck",
                harga_barang: 0, // Default untuk sewa truk
                asuransi: asuransiValue,
                total_harga: totalHargaFinal,
                order_by: userId, // Gunakan user_id sebagai order_by
                latlngAsal: createTruckRentalDto.origin_latlng,
                latlngTujuan: createTruckRentalDto.destination_latlng,
                isUseToll: createTruckRentalDto.isUseToll,
                metode_bayar_truck: createTruckRentalDto.toll_payment_method,
                truck_type: createTruckRentalDto.truck_type,
                pickup_time: new Date(createTruckRentalDto.pickup_time),
                hub_source_id: hubSourceId,
                hub_dest_id: hubDestId,
                current_hub: hubSourceId,
                next_hub: hubDestId,
                status: ORDER_STATUS.DRAFT,
                invoiceStatus: INVOICE_STATUS.BELUM_PROSES,
                isUnpaid: 1,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction });

            // Buat shipment data (untuk konsistensi dengan sistem existing)
            await this.orderShipmentModel.create({
                order_id: newOrder.id,
                qty: 1, // Truk dianggap 1 qty
                berat: 0, // Tidak ada berat untuk sewa truk
                panjang: 0, // Tidak ada dimensi untuk sewa truk
                lebar: 0, // Tidak ada dimensi untuk sewa truk
                tinggi: 0, // Tidak ada dimensi untuk sewa truk
                total_koli: 1, // Truk dianggap 1 koli
                total_berat: 0, // Tidak ada berat untuk sewa truk
                total_volume: 0, // Tidak ada volume untuk sewa truk
                total_berat_volume: 0,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction });

            // Buat order history
            const { date, time } = getOrderHistoryDateTime();
            await this.orderHistoryModel.create({
                order_id: newOrder.id,
                status: ORDER_STATUS.DRAFT,
                date: date,
                time: time,
                remark: 'Pesanan berhasil dibuat',
                provinsi: createTruckRentalDto.provinsi_pengirim,
                kota: createTruckRentalDto.kota_pengirim,
                created_by: userId,
            }, { transaction });

            // Buat order list
            await this.orderListModel.create({
                no_tracking: noTracking,
                nama_pengirim: createTruckRentalDto.nama_pengirim,
                alamat_pengirim: createTruckRentalDto.alamat_pengirim,
                provinsi_pengirim: createTruckRentalDto.provinsi_pengirim,
                kota_pengirim: createTruckRentalDto.kota_pengirim,
                kecamatan_pengirim: createTruckRentalDto.kecamatan_pengirim,
                kelurahan_pengirim: createTruckRentalDto.kelurahan_pengirim,
                kodepos_pengirim: kodeposPengirim,
                no_telepon_pengirim: createTruckRentalDto.no_telepon_pengirim,
                nama_penerima: createTruckRentalDto.nama_penerima,
                alamat_penerima: createTruckRentalDto.alamat_penerima,
                provinsi_penerima: createTruckRentalDto.provinsi_penerima,
                kota_penerima: createTruckRentalDto.kota_penerima,
                kecamatan_penerima: createTruckRentalDto.kecamatan_penerima,
                kelurahan_penerima: createTruckRentalDto.kelurahan_penerima,
                kodepos_penerima: kodeposPenerima,
                no_telepon_penerima: createTruckRentalDto.no_telepon_penerima,
                nama_barang: createTruckRentalDto.keterangan_barang || "Muatan sewa truck",
                status: ORDER_STATUS.DRAFT,
                total_harga: totalHargaFinal
            } as any, { transaction });

            // 6. Buat invoice untuk sewa truk
            const invoiceAmounts = this.calculateTruckRentalInvoiceAmounts(totalHargaFinal, createTruckRentalDto.asuransi || 0);
            const invoiceDate = new Date();

            const invoice = await this.orderInvoiceModel.create({
                order_id: newOrder.id,
                invoice_no: noTracking,
                invoice_date: invoiceDate,
                payment_terms: 'Net 30',
                vat: 0,
                discount: 0,
                packing: 0, // Tidak ada packing untuk sewa truk
                asuransi: invoiceAmounts.asuransi,
                ppn: invoiceAmounts.ppn,
                pph: 0,
                kode_unik: 0,
                konfirmasi_bayar: 0,
                notes: `Invoice untuk sewa truk ${noTracking}`,
                beneficiary_name: createTruckRentalDto.nama_pengirim,
                acc_no: '',
                bank_name: '',
                bank_address: '',
                swift_code: '',
                paid_attachment: '',
                payment_info: 0,
                fm: 0,
                lm: 0,
                bill_to_name: createTruckRentalDto.nama_pengirim,
                bill_to_phone: createTruckRentalDto.no_telepon_pengirim,
                bill_to_address: createTruckRentalDto.alamat_pengirim,
                create_date: invoiceDate,
                created_at: invoiceDate,
                updated_at: invoiceDate,
                isGrossUp: 0,
                isUnreweight: 0,
                noFaktur: '',
            }, { transaction });

            // 7. Buat invoice details untuk sewa truk
            const invoiceDetails: any[] = [];

            // Tambahkan item sewa truk
            invoiceDetails.push({
                invoice_id: invoice.id,
                description: `Sewa Truk ${createTruckRentalDto.truck_type}`,
                qty: 1,
                uom: 'TRIP',
                unit_price: totalHargaFinal,
                remark: `Jarak: ${selectedRoute.jarak_km} km, Route: ${createTruckRentalDto.isUseToll ? 'Tol' : 'Non-Tol'}, Tipe: ${createTruckRentalDto.truck_type}`,
                created_at: invoiceDate,
                updated_at: invoiceDate,
            });

            // Tambahkan asuransi sebagai item terpisah jika ada
            if (invoiceAmounts.asuransi > 0) {
                invoiceDetails.push({
                    invoice_id: invoice.id,
                    description: 'Asuransi',
                    qty: 1,
                    uom: 'PCS',
                    unit_price: invoiceAmounts.asuransi,
                    remark: 'Biaya asuransi sewa truk',
                    created_at: invoiceDate,
                    updated_at: invoiceDate,
                });
            }

            // Simpan invoice details
            if (invoiceDetails.length > 0) {
                await this.orderInvoiceDetailModel.bulkCreate(invoiceDetails, { transaction });
            }

            await transaction.commit();

            // Schedule automatic "pesanan diproses" entry after 5 minutes
            this.scheduleAutoProcessOrder(newOrder.id, userId);

            // Buat notification badge untuk order baru
            await this.createNotificationBadge(newOrder.id, 'Order Masuk', 'order');

            // Buat notification badge untuk hub kosong jika ada hub_id yang 0
            if (hubSourceId === 0 || hubDestId === 0) {
                await this.createNotificationBadge(newOrder.id, 'hub kosong', 'order');
            }

            // Format response
            const response: CreateTruckRentalOrderResponseDto = {
                message: 'Pesanan sewa truk berhasil dibuat',
                data: {
                    no_tracking: noTracking,
                    layanan: createTruckRentalDto.layanan,
                    origin_latlng: createTruckRentalDto.origin_latlng,
                    destination_latlng: createTruckRentalDto.destination_latlng,
                    jarak_km: selectedRoute.jarak_km,
                    isUseToll: createTruckRentalDto.isUseToll,
                    toll_payment_method: createTruckRentalDto.toll_payment_method,
                    truck_type: createTruckRentalDto.truck_type,
                    pickup_time: createTruckRentalDto.pickup_time,
                    harga_dasar: selectedRoute.harga_dasar,
                    total_harga: this.formatRupiah(totalHargaFinal),
                    estimasi_waktu: this.calculateEstimatedTime(selectedRoute.jarak_km),
                    keterangan_barang: createTruckRentalDto.keterangan_barang,
                    status: ORDER_STATUS.READY_FOR_PICKUP,
                    created_at: newOrder.created_at ? newOrder.created_at.toISOString() : new Date().toISOString()
                }
            };

            this.logger.log(`Truck rental order created successfully: ${noTracking}`);
            return response;

        } catch (error) {
            // Cek apakah transaction masih aktif sebelum rollback
            try {
                if (transaction) {
                    await transaction.rollback();
                }
            } catch (rollbackError) {
                this.logger.warn(`Transaction rollback failed: ${rollbackError.message}`);
            }
            this.logger.error(`Error creating truck rental order: ${error.message}`);
            throw new InternalServerErrorException(`Gagal membuat pesanan sewa truk: ${error.message}`);
        }
    }

    /**
     * Parse format rupiah ke number
     */
    private parseRupiahToNumber(rupiahString: string): number {
        // Remove "Rp" and replace dots with empty string, then parse to number
        return parseInt(rupiahString.replace('Rp', '').replace(/\./g, ''));
    }

    /**
     * Hitung estimasi waktu berdasarkan jarak
     */
    private calculateEstimatedTime(distanceKm: number): string {
        // Estimasi kecepatan rata-rata 60 km/jam
        const hours = Math.ceil(distanceKm / 60);

        if (hours < 24) {
            return `${hours} jam`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days} hari ${remainingHours} jam` : `${days} hari`;
        }
    }

    private formatRupiah(value: number): string {
        return 'Rp ' + value.toLocaleString('id-ID');
    }

    /**
     * Buat order internasional baru
     */
    async createInternationalOrder(createInternationalDto: any, userId?: number): Promise<any> {
        const transaction = await this.orderModel.sequelize!.transaction();

        try {
            // a. Validasi Awal dan Bersyarat
            this.validateInternationalOrder(createInternationalDto);

            // b. Perhitungan dan Konversi
            const chargeableWeightData = this.calculateChargeableWeight(createInternationalDto.pieces);
            const pricingData = await this.calculateInternationalPricing(
                chargeableWeightData.totalChargeableWeight,
                createInternationalDto.negara_penerima,
                createInternationalDto.layanan,
                createInternationalDto.total_item_value_usd,
                createInternationalDto.asuransi
            );

            // Generate tracking number
            const noTracking = await this.generateInternationalTrackingNumber();

            // c. Penyimpanan Data Kritis
            const orderData = {
                no_tracking: noTracking,
                nama_pengirim: createInternationalDto.nama_pengirim,
                alamat_pengirim: createInternationalDto.alamat_pengirim,
                kota_pengirim: createInternationalDto.kota_pengirim,
                kodepos_pengirim: createInternationalDto.kodepos_pengirim,
                no_telepon_pengirim: createInternationalDto.no_telepon_pengirim,
                email_pengirim: createInternationalDto.email_pengirim,
                jenis_pengirim: createInternationalDto.jenis_pengirim,
                negara_pengirim: createInternationalDto.negara_pengirim,
                peb_number: createInternationalDto.peb_number,

                nama_penerima: createInternationalDto.nama_penerima,
                alamat_penerima: createInternationalDto.alamat_penerima,
                kota_penerima: createInternationalDto.kota_penerima,
                kodepos_penerima: createInternationalDto.kodepos_penerima,
                no_telepon_penerima: createInternationalDto.no_telepon_penerima,
                email_penerima: createInternationalDto.email_penerima,
                jenis_penerima: createInternationalDto.jenis_penerima,
                negara_penerima: createInternationalDto.negara_penerima,
                incoterms: createInternationalDto.incoterms,
                penagih_email: createInternationalDto.penagih_email,
                penagih_kodepos: createInternationalDto.penagih_kodepos,
                penagih_kota: createInternationalDto.penagih_kota,
                penagih_nama_pt: createInternationalDto.penagih_nama_pt,
                penagih_negara: createInternationalDto.penagih_negara,
                penagih_phone: createInternationalDto.penagih_phone,

                nama_barang: createInternationalDto.nama_barang,
                layanan: 'International', // Gunakan layanan internasional
                asuransi: createInternationalDto.asuransi,
                packing: createInternationalDto.packing,
                harga_barang: createInternationalDto.harga_barang,
                mata_uang: createInternationalDto.mata_uang,
                hs_code: createInternationalDto.hs_code,
                country_of_origin: createInternationalDto.country_of_origin,
                no_referensi: createInternationalDto.no_referensi,
                total_item_value_usd: createInternationalDto.total_item_value_usd,
                customs_notes: createInternationalDto.customs_notes,
                commercial_invoice: createInternationalDto.commercial_invoice,
                packing_list: createInternationalDto.packing_list,
                certificate_of_origin: createInternationalDto.certificate_of_origin,
                notes: createInternationalDto.notes,

                // Data perhitungan
                total_harga: pricingData.totalPrice,
                chargeable_weight_total: chargeableWeightData.totalChargeableWeight,
                total_kubikasi: chargeableWeightData.totalVolume,

                // Status dan metadata
                status: 'Draft',
                tipe_pengiriman: createInternationalDto.tipe_pengiriman,
                order_type: 'International',
                order_by: userId,
                created_at: new Date(),
                updated_at: new Date()
            };

            const newOrder = await this.orderModel.create(orderData, { transaction });

            // Buat OrderShipment terlebih dahulu
            const orderShipment = await this.orderShipmentModel.create({
                order_id: newOrder.id,
                nama_barang: createInternationalDto.nama_barang,
                qty: createInternationalDto.pieces.reduce((sum: number, piece: any) => sum + piece.qty, 0),
                berat: createInternationalDto.pieces.reduce((sum: number, piece: any) => sum + (piece.berat * piece.qty), 0),
                panjang: createInternationalDto.pieces.reduce((sum: number, piece: any) => sum + piece.panjang, 0),
                lebar: createInternationalDto.pieces.reduce((sum: number, piece: any) => sum + piece.lebar, 0),
                tinggi: createInternationalDto.pieces.reduce((sum: number, piece: any) => sum + piece.tinggi, 0),
                harga: createInternationalDto.total_item_value_usd,
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction });

            // Simpan pieces
            for (const piece of createInternationalDto.pieces) {
                const pieceData = {
                    order_id: newOrder.id,
                    order_shipment_id: orderShipment.id, // Gunakan ID shipment yang baru dibuat
                    piece_id: `PIECE-${newOrder.id}-${Date.now()}`, // Generate unique piece ID
                    qty: piece.qty,
                    berat: piece.berat,
                    panjang: piece.panjang,
                    lebar: piece.lebar,
                    tinggi: piece.tinggi,
                    volume: (piece.panjang * piece.lebar * piece.tinggi) / 1000000, // Convert to m³
                    chargeable_weight: Math.max(piece.berat, (piece.panjang * piece.lebar * piece.tinggi) / 6000), // Volume weight factor 6000
                    created_at: new Date(),
                    updated_at: new Date()
                };

                await this.orderPieceModel.create(pieceData, { transaction });
            }

            // d. Finalisasi dan Histori
            await this.orderHistoryModel.create({
                order_id: newOrder.id,
                status: 'Order Internasional Dibuat',
                notes: 'Order internasional berhasil dibuat dan siap untuk proses first mile',
                remark: 'Order internasional berhasil dibuat',
                created_at: new Date(),
                updated_at: new Date()
            }, { transaction });

            await transaction.commit();

            // Response
            return {
                status: 'success',
                message: 'Order Internasional berhasil dibuat dan siap untuk penjemputan.',
                order: {
                    no_tracking: noTracking,
                    total_amount: pricingData.totalPrice,
                    currency: createInternationalDto.mata_uang,
                    chargeable_weight_total: chargeableWeightData.totalChargeableWeight
                },
                next_step: 'Order dialihkan ke Hub Internasional untuk proses first mile.'
            };

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error creating international order: ${error.message}`);
            throw new InternalServerErrorException(`Gagal membuat order internasional: ${error.message}`);
        }
    }

    /**
     * Validasi order internasional
     */
    private validateInternationalOrder(dto: any): void {
        // Validasi Wajib: Data dasar
        if (!dto.nama_pengirim || !dto.alamat_pengirim || !dto.no_telepon_pengirim) {
            throw new BadRequestException('Data pengirim (nama, alamat, telepon) wajib diisi');
        }

        if (!dto.nama_penerima || !dto.alamat_penerima || !dto.no_telepon_penerima) {
            throw new BadRequestException('Data penerima (nama, alamat, telepon) wajib diisi');
        }

        if (!dto.incoterms) {
            throw new BadRequestException('Incoterms wajib diisi untuk pengiriman internasional');
        }

        const billingFields = [
            { key: 'penagih_email', label: 'Email penagih' },
            { key: 'penagih_kodepos', label: 'Kode pos penagih' },
            { key: 'penagih_kota', label: 'Kota penagih' },
            { key: 'penagih_nama_pt', label: 'Nama perusahaan penagih' },
            { key: 'penagih_negara', label: 'Negara penagih' },
            { key: 'penagih_phone', label: 'Nomor telepon penagih' }
        ];

        for (const field of billingFields) {
            if (!dto[field.key]) {
                throw new BadRequestException(`${field.label} wajib diisi`);
            }
        }

        // Validasi Bersyarat (Barang)
        if (dto.tipe_pengiriman === 'Barang') {
            if (!dto.hs_code) {
                throw new BadRequestException('HS Code wajib diisi untuk pengiriman barang');
            }
            if (!dto.total_item_value_usd || dto.total_item_value_usd <= 0) {
                throw new BadRequestException('Total item value USD harus lebih dari 0 untuk pengiriman barang');
            }
            if (!dto.country_of_origin) {
                throw new BadRequestException('Country of origin wajib diisi untuk pengiriman barang');
            }
        }

        // Validasi Bersyarat (Dokumen)
        if (dto.tipe_pengiriman === 'Dokumen') {
            if (dto.total_item_value_usd > 100) {
                throw new BadRequestException('Total item value USD untuk dokumen harus rendah (≤ $100)');
            }

            // Hitung total berat
            const totalWeight = dto.pieces.reduce((sum: number, piece: any) => sum + (piece.berat * piece.qty), 0);
            if (totalWeight > 2.5) {
                throw new BadRequestException('Berat total dokumen tidak boleh melebihi 2.5 kg');
            }
        }
    }

    /**
     * Hitung chargeable weight
     */
    private calculateChargeableWeight(pieces: any[]): { totalChargeableWeight: number; totalVolume: number } {
        let totalChargeableWeight = 0;
        let totalVolume = 0;

        for (const piece of pieces) {
            const volume = (piece.panjang * piece.lebar * piece.tinggi) / 1000000; // Convert to m³
            const volumeWeight = volume * 200; // Volume weight factor 200 kg/m³
            const chargeableWeight = Math.max(piece.berat, volumeWeight);

            totalChargeableWeight += chargeableWeight * piece.qty;
            totalVolume += volume * piece.qty;
        }

        return { totalChargeableWeight, totalVolume };
    }

    /**
     * Hitung pricing internasional
     */
    private async calculateInternationalPricing(
        chargeableWeight: number,
        destinationCountry: string,
        service: string,
        itemValue: number,
        insurance: boolean
    ): Promise<{ totalPrice: number }> {
        // Pricing zones berdasarkan negara
        const pricingZones: { [key: string]: { express: number; economy: number } } = {
            'US': { express: 25, economy: 15 },
            'SG': { express: 20, economy: 12 },
            'MY': { express: 18, economy: 10 },
            'TH': { express: 16, economy: 9 },
            'AU': { express: 30, economy: 18 },
            'JP': { express: 22, economy: 13 },
            'KR': { express: 20, economy: 12 },
            'CN': { express: 15, economy: 8 },
            'HK': { express: 18, economy: 10 },
            'TW': { express: 19, economy: 11 }
        };

        const zone = pricingZones[destinationCountry] || { express: 25, economy: 15 };
        const ratePerKg = zone.express; // Gunakan rate express untuk layanan reguler

        let basePrice = chargeableWeight * ratePerKg;

        // Tambahkan biaya asuransi jika diperlukan
        if (insurance && itemValue > 0) {
            const insuranceRate = 0.01; // 1% dari nilai barang
            basePrice += itemValue * insuranceRate;
        }

        // Tambahkan biaya handling
        const handlingFee = 15; // USD
        basePrice += handlingFee;

        return { totalPrice: Math.round(basePrice * 100) / 100 };
    }

    /**
     * Generate tracking number untuk internasional
     */
    private async generateInternationalTrackingNumber(): Promise<string> {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const prefix = `INTLGG${year}${month}${day}`;

        // Cari nomor urut terakhir untuk hari ini
        const lastOrder = await this.orderModel.findOne({
            where: {
                no_tracking: {
                    [Op.like]: `${prefix}%`
                }
            },
            order: [['created_at', 'DESC']]
        });

        let nextNumber = 1;
        if (lastOrder && lastOrder.no_tracking) {
            const lastNumber = parseInt(lastOrder.no_tracking.slice(-3));
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${String(nextNumber).padStart(3, '0')}`;
    }

} 