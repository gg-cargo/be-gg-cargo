import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { NotificationBadgesService } from './notification-badges.service';
import {
    CreateNotificationBadgeDto,
    MarkAsReadDto,
    MarkAllAsReadDto,
    GetNotificationBadgesDto
} from './dto/notification-badge.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notification-badges')
@UseGuards(JwtAuthGuard)
export class NotificationBadgesController {
    constructor(private readonly notificationBadgesService: NotificationBadgesService) { }

    /**
     * Membuat notification badge baru
     * POST /notification-badges
     */
    @Post()
    async createNotificationBadge(@Body() createDto: CreateNotificationBadgeDto) {
        return this.notificationBadgesService.createNotificationBadge(createDto);
    }

    /**
     * Mendapatkan notification badges dengan filter optional
     * GET /notification-badges?hub_id=123&menu_name=Order Masuk&limit=20&offset=0
     */
    @Get()
    async getNotificationBadges(
        @Query() query: GetNotificationBadgesDto
    ) {
        // Konversi hub missing menjadi hub kosong
        if (query.menu_name === 'hub missing') {
            query.menu_name = 'hub kosong';
        }

        // Validasi menu_name jika diberikan
        if (query.menu_name) {
            const allowedMenus = ['Order Masuk', 'Reweight', 'Dalam pengiriman', 'hub kosong', 'hub missing'];
            if (!allowedMenus.includes(query.menu_name)) {
                throw new BadRequestException(`menu_name harus salah satu dari: ${allowedMenus.join(', ')}`);
            }
        }

        return this.notificationBadgesService.getNotificationBadges(query);
    }

    /**
     * Mendapatkan count notification badges per menu untuk hub tertentu atau semua hub
     * GET /notification-badges/counts?hub_id=123 (optional)
     */
    @Get('counts')
    async getNotificationBadgeCounts(@Query('hub_id') hubIdParam?: string) {
        const hubId = hubIdParam ? Number(hubIdParam) : undefined;
        if (hubIdParam && hubId !== undefined && (!Number.isFinite(hubId) || hubId <= 0)) {
            throw new Error('hub_id harus berupa angka valid');
        }
        return this.notificationBadgesService.getNotificationBadgeCounts(hubId);
    }

    /**
     * Mark notification sebagai read
     * PATCH /notification-badges/:id/mark-read
     */
    @Patch(':id/mark-read')
    async markAsRead(
        @Param('id', ParseIntPipe) notificationId: number
    ) {
        return this.notificationBadgesService.markAsRead(notificationId);
    }

    /**
     * Mark semua notification sebagai read untuk menu tertentu atau semua menu
     * PATCH /notification-badges/mark-all-read
     */
    @Patch('mark-all-read')
    async markAllAsRead(
        @Body() markAllAsReadDto: MarkAllAsReadDto
    ) {
        // Konversi hub missing menjadi hub kosong
        if (markAllAsReadDto.menu_name === 'hub missing') {
            markAllAsReadDto.menu_name = 'hub kosong';
        }

        // Validasi menu_name jika diberikan
        if (markAllAsReadDto.menu_name) {
            const allowedMenus = ['Order Masuk', 'Reweight', 'Dalam pengiriman', 'hub kosong', 'hub missing'];
            if (!allowedMenus.includes(markAllAsReadDto.menu_name)) {
                throw new BadRequestException(`menu_name harus salah satu dari: ${allowedMenus.join(', ')}`);
            }
        }

        return this.notificationBadgesService.markAllAsRead(markAllAsReadDto.hub_id ?? null, markAllAsReadDto.menu_name);
    }

    /**
     * Hapus notification badge
     * DELETE /notification-badges/:id
     */
    @Delete(':id')
    async deleteNotificationBadge(
        @Param('id', ParseIntPipe) notificationId: number,
        @Query('hub_id') hubIdParam: string
    ) {
        const hubId = Number(hubIdParam);
        if (!Number.isFinite(hubId) || hubId <= 0) {
            throw new Error('hub_id harus berupa angka valid');
        }
        return this.notificationBadgesService.deleteNotificationBadge(hubId, notificationId);
    }

    /**
     * Cleanup notification badges yang sudah lama (admin only)
     * DELETE /notification-badges/cleanup
     */
    @Delete('cleanup')
    async cleanupOldNotifications() {
        await this.notificationBadgesService.cleanupOldNotifications();
        return {
            message: 'Cleanup notification badges berhasil dilakukan',
            success: true,
        };
    }
}
