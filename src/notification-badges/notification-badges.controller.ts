import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
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
        return this.notificationBadgesService.markAllAsRead(markAllAsReadDto.hub_id, markAllAsReadDto.menu_name);
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
