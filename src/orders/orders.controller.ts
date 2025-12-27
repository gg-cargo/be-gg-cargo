import { Controller, Post, Body, UseGuards, Request, HttpStatus, HttpCode, Param, ParseIntPipe, Req, Get, Patch, Delete, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Query, Res } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderResponseDto } from './dto/order-response.dto';
import { CreateOrderHistoryDto } from './dto/create-order-history.dto';
import { UpdatePickupNoteDto } from './dto/update-pickup-note.dto';
import { ReweightPieceDto } from './dto/reweight-piece.dto';
import { ReweightPieceResponseDto } from './dto/reweight-response.dto';
import { ReweightBulkDto } from './dto/reweight-bulk.dto';
import { ReweightBulkResponseDto } from './dto/reweight-bulk-response.dto';
import { EstimatePriceDto } from './dto/estimate-price.dto';
import { BypassReweightDto } from './dto/bypass-reweight.dto';
import { BypassReweightResponseDto } from './dto/bypass-reweight-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OpsOrdersQueryDto, OpsOrdersResponseDto } from './dto/ops-orders.dto';
import { AvailableDriversQueryDto, AvailableDriversResponseDto } from './dto/available-drivers.dto';
import { AssignDriverDto, AssignDriverResponseDto } from './dto/assign-driver.dto';
import { SubmitReweightDto, SubmitReweightResponseDto } from './dto/submit-reweight.dto';
import { EditReweightRequestDto, EditReweightRequestResponseDto } from './dto/edit-reweight-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { DeleteOrderDto } from './dto/delete-order.dto';
import { DeleteOrderResponseDto } from './dto/delete-order-response.dto';
import { ReportMissingItemDto } from './dto/report-missing-item.dto';
import { ResolveMissingItemDto, ResolveMissingItemFormDto } from './dto/resolve-missing-item.dto';
import { GetReweightProofResponseDto } from './dto/reweight-proof-response.dto';
import { CompleteOrderDto, CompleteOrderResponseDto } from './dto/complete-order.dto';
import { ForwardToVendorDto, ForwardToVendorResponseDto } from './dto/forward-to-vendor.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderFieldsDto } from './dto/update-order-fields.dto';
import { CreateTruckRentalOrderDto } from './dto/create-truck-rental-order.dto';
import { CreateTruckRentalOrderResponseDto } from './dto/create-truck-rental-order-response.dto';
import { ListTruckRentalDto } from './dto/list-truck-rental.dto';
import { AssignTruckRentalDto } from './dto/assign-truck-rental.dto';
import { AssignTruckRentalResponseDto } from './dto/assign-truck-rental-response.dto';
import { UpdateItemDetailsDto } from './dto/update-item-details.dto';
import { UpdateItemDetailsResponseDto } from './dto/update-item-details-response.dto';
import { CreateInternationalOrderDto } from './dto/create-international-order.dto';
import { InternationalOrderResponseDto } from './dto/international-order-response.dto';
import { RevertInTransitDto, RevertInTransitResponseDto } from './dto/revert-in-transit.dto';
import { AssignVendorTrackingDto, AssignVendorTrackingResponseDto } from './dto/assign-vendor-tracking.dto';
import { StartDeliveryDto, StartDeliveryResponseDto } from './dto/start-delivery.dto';
// (imports JwtAuthGuard & BadRequestException sudah ada di atas)

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }
    @UseGuards(JwtAuthGuard)
    @Get('proofs/:no_tracking/pickup-note/pdf')
    async getPickupNotePdf(
        @Param('no_tracking') noTracking: string,
    ): Promise<{ message: string; data: { link: string } }> {
        const link = await this.ordersService.generatePickupNotePdf(noTracking);
        return { message: 'Berhasil menghasilkan PDF pickup note', data: { link } };
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AnyFilesInterceptor())
    @Patch('proofs/:no_tracking/pickup-note')
    async updatePickupNote(
        @Param('no_tracking') noTracking: string,
        @Body() formData: any,
        @UploadedFiles() files: Array<any>,
        @Request() req: any,
    ): Promise<{ message: string; data: any }> {
        const userId = req.user?.id;

        // Parse form data
        const updateData: any = {};

        // Handle text fields
        if (formData.pickup_time) updateData.pickup_time = formData.pickup_time;
        if (formData.pickup_notes) updateData.pickup_notes = formData.pickup_notes;

        // Handle file uploads
        if (files && files.length > 0) {
            const proofPhotos: string[] = [];
            let customerSignature: string | undefined;
            let driverSignature: string | undefined;

            for (const file of files) {
                const fieldName = file.fieldname;

                if (fieldName === 'proof_photos') {
                    // Simpan file dan dapatkan path
                    const filePath = await this.saveFile(file, 'pickup_proof');
                    proofPhotos.push(filePath);
                } else if (fieldName === 'customer_signature') {
                    // Simpan customer signature
                    const filePath = await this.saveFile(file, 'customer_signature');
                    customerSignature = filePath;
                } else if (fieldName === 'driver_signature') {
                    // Simpan driver signature
                    const filePath = await this.saveFile(file, 'driver_signature');
                    driverSignature = filePath;
                }
            }

            if (proofPhotos.length > 0) updateData.proof_photos = proofPhotos;
            if (customerSignature) updateData.customer_signature = customerSignature;
            if (driverSignature) updateData.driver_signature = driverSignature;
        }

        return this.ordersService.updatePickupNote(noTracking, updateData, userId);
    }

    @Get('proofs/:no_tracking/delivery-note/pdf')
    async generateDeliveryNotePdf(@Param('no_tracking') noTracking: string): Promise<{ message: string; data: string }> {
        const link = await this.ordersService.generateDeliveryNotePdf(noTracking);
        return { message: 'PDF surat jalan kirim berhasil digenerate', data: link };
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AnyFilesInterceptor())
    @Patch('proofs/:no_tracking/delivery-note')
    async updateDeliveryNote(
        @Param('no_tracking') noTracking: string,
        @Body() formData: any,
        @UploadedFiles() files: Array<any>,
        @Request() req: any,
    ): Promise<{ message: string; data: any }> {
        const userId = req.user?.id;

        // Parse form data
        const updateData: any = {};

        // Handle text fields
        if (formData.delivery_notes) updateData.delivery_notes = formData.delivery_notes;

        // Handle file uploads
        if (files && files.length > 0) {
            const proofPhotos: string[] = [];
            let customerSignature: string | undefined;
            let driverSignature: string | undefined;

            for (const file of files) {
                const fieldName = file.fieldname;

                if (fieldName === 'proof_photos') {
                    // Simpan file dan dapatkan path
                    const filePath = await this.saveFile(file, 'delivery_proof');
                    proofPhotos.push(filePath);
                } else if (fieldName === 'customer_signature') {
                    // Simpan customer signature
                    const filePath = await this.saveFile(file, 'customer_signature');
                    customerSignature = filePath;
                } else if (fieldName === 'driver_signature') {
                    // Simpan driver signature
                    const filePath = await this.saveFile(file, 'driver_signature');
                    driverSignature = filePath;
                }
            }

            if (proofPhotos.length > 0) updateData.proof_photos = proofPhotos;
            if (customerSignature) updateData.customer_signature = customerSignature;
            if (driverSignature) updateData.driver_signature = driverSignature;
        }

        return this.ordersService.updateDeliveryNote(noTracking, updateData, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':no_tracking/report-missing')
    async reportMissingItem(
        @Param('no_tracking') noTracking: string,
        @Body() dto: ReportMissingItemDto,
        @Request() req: any,
    ): Promise<{ message: string; data: any }> {
        // Override reported_by_user_id dengan user yang sedang login
        dto.reported_by_user_id = req.user?.id;

        return this.ordersService.reportMissingItem(noTracking, dto);
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('photo'))
    @Patch(':no_tracking/resolve-missing')
    async resolveMissingItem(
        @Param('no_tracking') noTracking: string,
        @Body() formData: ResolveMissingItemFormDto,
        @UploadedFile() photo: any,
        @Request() req: any,
    ): Promise<{ message: string; data: any }> {
        // Buat DTO untuk service
        const dto: ResolveMissingItemDto = {
            ...formData,
            resolved_by_user_id: req.user?.id, // Override dengan user yang sedang login
            photo_file: undefined
        };

        // Handle file upload jika ada
        if (photo) {
            const filePath = await this.saveFile(photo, 'missing_item_resolution');
            dto.photo_file = filePath;
        }

        // Validasi: jika tidak ada file upload, berikan pesan error yang jelas
        if (!photo) {
            throw new BadRequestException('Field "photo" (file) diperlukan untuk bukti penemuan barang. Gunakan multipart/form-data dengan field "photo" untuk upload file.');
        }

        return this.ordersService.resolveMissingItem(noTracking, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':no_tracking/missing-items')
    async getMissingItems(
        @Param('no_tracking') noTracking: string,
    ): Promise<{ success: boolean; message: string; data: any }> {
        return this.ordersService.getMissingItems(noTracking);
    }

    private async saveFile(file: any, type: string): Promise<string> {
        try {
            // Validasi file
            if (!file || !file.buffer) {
                throw new BadRequestException('File tidak valid');
            }

            // Validasi tipe file (hanya gambar)
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException('Hanya file gambar yang diperbolehkan (JPEG, PNG, GIF)');
            }

            // Validasi ukuran file (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new BadRequestException('Ukuran file terlalu besar, maksimal 5MB');
            }

            // Generate nama file yang unik
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `${type}_${timestamp}_${randomString}.${fileExtension}`;
            const filePath = `https://api.99delivery.id/uploads/${fileName}`;

            // Buat direktori jika belum ada
            const fs = require('fs');
            const path = require('path');
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Tulis file
            const fullPath = path.join(uploadDir, fileName);
            fs.writeFileSync(fullPath, file.buffer);

            console.log(`File berhasil disimpan: ${fullPath}`);
            return filePath;
        } catch (error) {
            console.error('Error saat menyimpan file:', error);
            throw new BadRequestException(`Gagal menyimpan file: ${error.message}`);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get(':no_tracking/labels')
    async getOrderLabels(
        @Param('no_tracking') noTracking: string,
    ): Promise<{ message: string; success: boolean; data: { pdf_url: string; image_urls: string[]; no_resi: string } }> {
        const result = await this.ordersService.generateOrderLabelsPdf(noTracking);
        return {
            message: 'PDF dan gambar label berhasil dibuat',
            success: true,
            data: {
                pdf_url: result.pdf_url,
                image_urls: result.image_urls,
                no_resi: noTracking,
            },
        };
    }
    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @Request() req: any,
    ): Promise<CreateOrderResponseDto> {
        // Ambil user ID dari request (asumsikan sudah ada middleware auth)
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('User ID tidak ditemukan');
        }
        return this.ordersService.createOrder(createOrderDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/referensi')
    async createResiReferensi(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.createResiReferensi(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/history')
    async addOrderHistory(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateOrderHistoryDto,
    ) {
        return this.ordersService.addOrderHistory(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async listOrders(@Req() req, @Query() query: ListOrdersDto) {
        // Asumsi user login ada di req.user.id
        return this.ordersService.listOrders(req.user.id, query);
    }

    // PENTING: Tempatkan route spesifik sebelum dynamic route ':no_resi'
    @UseGuards(JwtAuthGuard)
    @Get('sewa-truk')
    async listTruckRentalOrders(
        @Req() req,
        @Query() query: ListTruckRentalDto,
    ) {
        return this.ordersService.listTruckRentalOrders(req.user.id, query);
    }

    @UseGuards(JwtAuthGuard)
    @Get('statistics')
    async getDashboardStatistics(@Req() req) {
        return this.ordersService.getDashboardStatistics(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('dashboard/master-stats')
    async getMasterDashboardStats(@Query('tahun') tahun?: string) {
        return this.ordersService.getMasterDashboardStats(tahun);
    }

    @UseGuards(JwtAuthGuard)
    @Get('export/excel')
    async exportToExcel(@Req() req) {
        return this.ordersService.exportToExcel(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('export/pdf')
    async exportToPdf(@Req() req) {
        return this.ordersService.exportToPdf(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/reorder')
    async getReorderData(
        @Param('id', ParseIntPipe) id: number,
        @Req() req
    ) {
        return this.ordersService.getReorderData(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/reorder-sewa-truk')
    async getTruckRentalReorderData(
        @Param('id', ParseIntPipe) id: number,
        @Req() req
    ) {
        return this.ordersService.getTruckRentalReorderData(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/history')
    async getOrderHistory(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.getOrderHistoryByOrderId(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('ops/orders')
    async getOpsOrders(
        @Query() query: OpsOrdersQueryDto,
        @Request() req: any
    ): Promise<OpsOrdersResponseDto> {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('User ID tidak ditemukan');
        }
        return this.ordersService.getOpsOrders(query, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':no_tracking/labels-link')
    async getOrderLabelsLink(
        @Param('no_tracking') noTracking: string,
    ): Promise<{ message: string; link: string }> {
        const result = await this.ordersService.generateOrderLabelsPdf(noTracking);
        return { message: 'Berhasil menghasilkan tautan PDF label', link: result.pdf_url };
    }

    @Patch(':no_resi/cancel')
    @UseGuards(JwtAuthGuard)
    async cancelOrder(@Param('no_resi') noResi: string, @Body() body: CancelOrderDto) {
        return this.ordersService.cancelOrder(noResi, body);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('pieces/:piece_id/reweight')
    async reweightPiece(
        @Param('piece_id') pieceId: string,
        @Body() reweightDto: ReweightPieceDto,
    ): Promise<ReweightPieceResponseDto> {
        return this.ordersService.reweightPiece(pieceId, reweightDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('pieces/:piece_id')
    async getPieceDetail(
        @Param('piece_id') pieceId: string,
    ): Promise<{ message: string; success: boolean; data: any }> {
        return this.ordersService.getPieceDetail(pieceId.trim());
    }

    @UseGuards(JwtAuthGuard)
    @Get('pieces/:piece_id/validate')
    async validatePiece(
        @Param('piece_id') pieceId: string,
    ): Promise<{ message: string; success: boolean; data: { valid: boolean; piece_id: string; order_id?: number; no_tracking?: string } }> {
        if (!pieceId || pieceId.trim() === '') {
            throw new BadRequestException('piece_id wajib diisi');
        }
        return this.ordersService.validatePieceId(pieceId.trim());
    }


    @UseGuards(JwtAuthGuard)
    @Patch(':order_id/reweight/submit')
    async submitReweight(
        @Param('order_id', ParseIntPipe) orderId: number,
        @Body() submitReweightDto: SubmitReweightDto,
        @Request() req: any
    ): Promise<SubmitReweightResponseDto> {
        // Override submitted_by_user_id dengan user yang sedang login
        submitReweightDto.submitted_by_user_id = req.user?.id;
        return this.ordersService.submitReweight(orderId, submitReweightDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':order_id/reweight/edit-request')
    async editReweightRequest(
        @Param('order_id', ParseIntPipe) orderId: number,
        @Body() editReweightRequestDto: EditReweightRequestDto,
        @Request() req: any
    ): Promise<EditReweightRequestResponseDto> {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('User ID tidak ditemukan');
        }
        return this.ordersService.editReweightRequest(orderId, editReweightRequestDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('pieces/bulk-reweight')
    @UseInterceptors(FilesInterceptor('images', 5, {
        storage: diskStorage({
            destination: 'public/uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
        fileFilter: (req, file, cb) => {
            // Hanya terima file gambar
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Hanya file gambar yang diperbolehkan'), false);
            }
        },
    }))
    async reweightBulk(
        @Body() body: any,
        @UploadedFiles() images: File[],
    ): Promise<ReweightBulkResponseDto> {
        // Parse actions dari JSON string
        let actions;
        try {
            actions = typeof body.actions === 'string' ? JSON.parse(body.actions) : body.actions;
        } catch (error) {
            throw new BadRequestException('Invalid JSON format for actions');
        }

        // Parse user ID
        const reweight_by_user_id = parseInt(body.reweight_by_user_id, 10);
        if (isNaN(reweight_by_user_id)) {
            throw new BadRequestException('User ID harus berupa angka');
        }

        // Validasi basic
        if (!actions || !Array.isArray(actions) || actions.length === 0) {
            throw new BadRequestException('Actions harus berupa array dan tidak boleh kosong');
        }

        // Validasi images
        if (images && images.length > 5) {
            throw new BadRequestException('Maksimal 5 gambar yang diperbolehkan');
        }

        // Buat DTO object
        const reweightBulkDto: ReweightBulkDto = {
            actions,
            reweight_by_user_id,
            images: (images as unknown as Express.Multer.File[]) || []
        };

        return this.ordersService.reweightBulk(reweightBulkDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':order_id/bypass-reweight')
    @UseInterceptors(FileInterceptor('proof_image', {
        storage: diskStorage({
            destination: 'public/uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
    }))
    async bypassReweight(
        @Param('order_id', ParseIntPipe) orderId: number,
        @Body() body: any,
        @UploadedFile() proofImage: Express.Multer.File,
    ): Promise<BypassReweightResponseDto> {
        // Parse bypass_reweight_status dari body
        const bypass_reweight_status = body.bypass_reweight_status;
        const reason = body.reason;
        const updated_by_user_id = parseInt(body.updated_by_user_id, 10);

        // Validasi basic
        if (!bypass_reweight_status || !['true', 'false'].includes(bypass_reweight_status)) {
            throw new BadRequestException('Status bypass reweight wajib diisi dan harus "true" atau "false"');
        }

        if (!updated_by_user_id || isNaN(updated_by_user_id)) {
            throw new BadRequestException('User ID harus berupa angka');
        }

        // Gabungkan data
        const bypassData = {
            bypass_reweight_status,
            reason,
            updated_by_user_id,
            proof_image: proofImage
        };

        return this.ordersService.bypassReweight(orderId, bypassData);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':no_resi')
    async getOrderDetail(
        @Param('no_resi') noResi: string,
    ): Promise<OrderDetailResponseDto> {
        return this.ordersService.getOrderDetail(noResi);
    }

    @Post('estimate-price')
    async estimatePrice(@Body() estimateDto: EstimatePriceDto) {
        return this.ordersService.estimatePrice(estimateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_resi')
    async updateOrder(
        @Param('no_resi') noResi: string,
        @Body() updateOrderDto: UpdateOrderDto
    ): Promise<UpdateOrderResponseDto> {
        return this.ordersService.updateOrder(noResi, updateOrderDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_resi/update-fields')
    async updateOrderFields(
        @Param('no_resi') noResi: string,
        @Body() dto: UpdateOrderFieldsDto,
    ) {
        return this.ordersService.updateOrderFields(noResi, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':no_resi')
    async deleteOrder(
        @Param('no_resi') noResi: string,
        @Body() deleteDto: DeleteOrderDto,
    ): Promise<DeleteOrderResponseDto> {
        return this.ordersService.deleteOrder(noResi, deleteDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':order_id/reweight-proof')
    async getReweightProof(
        @Param('order_id', ParseIntPipe) orderId: number,
    ): Promise<GetReweightProofResponseDto> {
        return this.ordersService.getReweightProof(orderId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_resi/forward-to-vendor')
    async forwardToVendor(
        @Param('no_resi') noResi: string,
        @Body() forwardToVendorDto: ForwardToVendorDto,
    ): Promise<ForwardToVendorResponseDto> {
        return this.ordersService.forwardToVendor(noResi, forwardToVendorDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_tracking/complete')
    async completeOrder(
        @Param('no_tracking') noTracking: string,
        @Body() completeOrderDto: CompleteOrderDto,
    ): Promise<CompleteOrderResponseDto> {
        return this.ordersService.completeOrder(noTracking, completeOrderDto.completed_by_user_id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('sewa-truk')
    @HttpCode(HttpStatus.CREATED)
    async createTruckRentalOrder(
        @Body() createTruckRentalDto: CreateTruckRentalOrderDto,
        @Request() req: any,
    ): Promise<CreateTruckRentalOrderResponseDto> {
        const userId = req.user.id;
        return this.ordersService.createTruckRentalOrder(createTruckRentalDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('sewa-truk/:no_tracking/assign')
    @HttpCode(HttpStatus.OK)
    async assignTruckRental(
        @Param('no_tracking') noTracking: string,
        @Body() assignTruckRentalDto: AssignTruckRentalDto,
    ): Promise<AssignTruckRentalResponseDto> {
        return this.ordersService.assignTruckRental(noTracking, assignTruckRentalDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_tracking/item-details')
    @HttpCode(HttpStatus.OK)
    async updateItemDetails(
        @Param('no_tracking') noTracking: string,
        @Body() updateItemDetailsDto: UpdateItemDetailsDto,
        @Request() req: any,
    ): Promise<UpdateItemDetailsResponseDto> {
        const userId = req.user.id;
        return this.ordersService.updateItemDetails(noTracking, updateItemDetailsDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('international')
    @HttpCode(HttpStatus.CREATED)
    async createInternationalOrder(
        @Body() createInternationalDto: CreateInternationalOrderDto,
        @Request() req: any,
    ): Promise<InternationalOrderResponseDto> {
        const userId = req.user.id;
        return this.ordersService.createInternationalOrder(createInternationalDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_tracking/revert-in-transit')
    @HttpCode(HttpStatus.OK)
    async revertInTransit(
        @Param('no_tracking') noTracking: string,
        @Body() dto: RevertInTransitDto,
        @Request() req: any,
    ): Promise<RevertInTransitResponseDto> {
        const userId = req.user.id;
        return this.ordersService.revertInTransitToWaiting(noTracking, dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_tracking/start-delivery')
    @HttpCode(HttpStatus.OK)
    async startDelivery(
        @Param('no_tracking') noTracking: string,
        @Body() dto: StartDeliveryDto,
        @Request() req: any,
    ): Promise<StartDeliveryResponseDto> {
        const userId = req.user.id;
        return this.ordersService.startDeliveryFromInTransit(noTracking, dto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':no_tracking/vendor-tracking')
    @HttpCode(HttpStatus.OK)
    async assignVendorTracking(
        @Param('no_tracking') noTracking: string,
        @Body() dto: AssignVendorTrackingDto,
    ): Promise<AssignVendorTrackingResponseDto> {
        return this.ordersService.assignVendorTracking(noTracking, dto);
    }
}