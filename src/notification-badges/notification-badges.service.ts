import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col } from 'sequelize';
import { NotificationBadge } from '../models/notification-badge.model';
import {
    CreateNotificationBadgeDto,
    MarkAsReadDto,
    MarkAllAsReadDto,
    GetNotificationBadgesDto,
    NotificationBadgeResponseDto,
    NotificationBadgeCountResponseDto
} from './dto/notification-badge.dto';

@Injectable()
export class NotificationBadgesService {
    constructor(
        @InjectModel(NotificationBadge)
        private notificationBadgeModel: typeof NotificationBadge,
    ) { }

    /**
     * Membuat notification badge baru
     */
    async createNotificationBadge(createDto: CreateNotificationBadgeDto): Promise<NotificationBadgeResponseDto> {
        // Cek apakah notification sudah ada untuk item yang sama
        const existingNotification = await this.notificationBadgeModel.findOne({
            where: {
                hub_id: createDto.hub_id,
                item_id: createDto.item_id,
                item_type: createDto.item_type,
                menu_name: createDto.menu_name,
            }
        });

        if (existingNotification) {
            // Jika sudah ada, update created_at saja
            await existingNotification.update({ created_at: new Date() });
            return existingNotification;
        }

        const notification = await this.notificationBadgeModel.create({
            user_id: createDto.user_id ?? null,
            menu_name: createDto.menu_name,
            item_id: createDto.item_id,
            item_type: createDto.item_type,
            hub_id: createDto.hub_id,
            is_read: 0,
        });
        return notification;
    }

    /**
     * Membuat notification badge untuk multiple users
     */
    async createNotificationBadgeForHub(
        menuName: string,
        itemId: number,
        itemType: string,
        hubId: number,
        createdByUserId?: number
    ): Promise<void> {
        await this.notificationBadgeModel.create({
            user_id: createdByUserId ?? null,
            menu_name: menuName,
            item_id: itemId,
            item_type: itemType,
            hub_id: hubId,
            is_read: 0,
        });
    }

    /**
     * Mendapatkan notification badges dengan filter optional
     */
    async getNotificationBadges(
        query: GetNotificationBadgesDto
    ): Promise<{ message: string; data: NotificationBadgeResponseDto[] }> {
        const whereClause: any = {};

        // Filter berdasarkan hub_id jika diberikan
        if (query.hub_id !== undefined) {
            whereClause.hub_id = query.hub_id;
        }

        // Filter berdasarkan menu_name jika diberikan
        if (query.menu_name) {
            whereClause.menu_name = query.menu_name;
        }

        whereClause.is_read = 0;

        const notifications = await this.notificationBadgeModel.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: query.limit || 50,
            offset: query.offset || 0,
        });

        return {
            message: 'Data notification badges berhasil diambil',
            data: notifications,
        };
    }

    /**
     * Mendapatkan count notification badges per menu untuk hub tertentu atau semua hub
     */
    async getNotificationBadgeCounts(hubId?: number): Promise<{
        message: string;
        data: Array<{
            hub_id: number | null;
            menus: Array<{
                menu_name: string;
                unread_count: number;
                total_count: number;
            }>;
        }>;
    }> {
        const whereClause: any = {};

        // Jika hub_id diberikan, filter berdasarkan hub_id
        if (hubId !== undefined) {
            whereClause.hub_id = hubId;
        }

        whereClause.is_read = 0;

        const counts = await this.notificationBadgeModel.findAll({
            where: whereClause,
            attributes: [
                'menu_name',
                'hub_id',
                [fn('COUNT', col('id')), 'total_count'],
                [fn('SUM', col('is_read')), 'read_count'],
            ],
            group: hubId !== undefined ? ['menu_name'] : ['menu_name', 'hub_id'],
            raw: true,
        });

        // Pisahkan data berdasarkan hub_id dan hub kosong
        const hubDataMap = new Map<number | null, Array<{
            menu_name: string;
            unread_count: number;
            total_count: number;
        }>>();

        counts.forEach((count: any) => {
            const menuData = {
                menu_name: count.menu_name,
                unread_count: count.total_count - (count.read_count || 0),
                total_count: count.total_count,
            };

            // Untuk "hub kosong", gunakan hub_id: null
            const targetHubId = count.menu_name === 'hub kosong' ? null : count.hub_id;

            // Group berdasarkan hub_id (atau null untuk hub kosong)
            if (!hubDataMap.has(targetHubId)) {
                hubDataMap.set(targetHubId, []);
            }
            hubDataMap.get(targetHubId)!.push(menuData);
        });

        // Convert Map ke Array
        const data = Array.from(hubDataMap.entries()).map(([hub_id, menus]) => ({
            hub_id,
            menus
        }));

        return {
            message: 'Data count notification badges berhasil diambil',
            data,
        };
    }

    /**
     * Mark notification sebagai read
     */
    async markAsRead(notificationId: number): Promise<{ message: string; success: boolean }> {
        const notification = await this.notificationBadgeModel.findOne({
            where: {
                id: notificationId,
            }
        });

        if (!notification) {
            throw new NotFoundException('Notification tidak ditemukan');
        }

        await notification.update({ is_read: 1 });

        return {
            message: 'Notification berhasil ditandai sebagai dibaca',
            success: true,
        };
    }

    /**
     * Mark semua notification sebagai read untuk menu tertentu atau semua menu
     */
    async markAllAsRead(hubId: number, menuName?: string): Promise<{ message: string; success: boolean }> {
        const whereClause: any = { hub_id: hubId, is_read: 0 };

        if (menuName) {
            whereClause.menu_name = menuName;
        }

        const [affectedCount] = await this.notificationBadgeModel.update(
            { is_read: 1 },
            { where: whereClause }
        );

        return {
            message: `${affectedCount} notification berhasil ditandai sebagai dibaca`,
            success: true,
        };
    }

    /**
     * Hapus notification badge
     */
    async deleteNotificationBadge(hubId: number, notificationId: number): Promise<{ message: string; success: boolean }> {
        const notification = await this.notificationBadgeModel.findOne({
            where: {
                id: notificationId,
                hub_id: hubId,
            }
        });

        if (!notification) {
            throw new NotFoundException('Notification tidak ditemukan');
        }

        await notification.destroy();

        return {
            message: 'Notification berhasil dihapus',
            success: true,
        };
    }

    /**
     * Hapus notification badge berdasarkan item
     */
    async deleteNotificationBadgeByItem(itemId: number, itemType: string): Promise<void> {
        await this.notificationBadgeModel.destroy({
            where: {
                item_id: itemId,
                item_type: itemType,
            }
        });
    }

    /**
     * Mark notification "Order Masuk" sebagai read berdasarkan order_id
     */
    async markOrderMasukAsRead(orderId: number): Promise<void> {
        await this.notificationBadgeModel.update(
            { is_read: 1 },
            {
                where: {
                    item_id: orderId,
                    item_type: 'order',
                    menu_name: 'Order Masuk',
                    is_read: 0
                }
            }
        );
    }

    /**
     * Mark notification "Order kirim" sebagai read berdasarkan order_id
     */
    async markOrderKirimAsRead(orderId: number): Promise<void> {
        await this.notificationBadgeModel.update(
            { is_read: 1 },
            {
                where: {
                    item_id: orderId,
                    item_type: 'order',
                    menu_name: 'Order kirim',
                    is_read: 0
                }
            }
        );
    }

    /**
     * Mark notification "Dalam pengiriman" sebagai read berdasarkan order_id
     */
    async markDalamPengirimanAsRead(orderId: number): Promise<void> {
        await this.notificationBadgeModel.update(
            { is_read: 1 },
            {
                where: {
                    item_id: orderId,
                    item_type: 'order',
                    menu_name: 'Dalam pengiriman',
                    is_read: 0
                }
            }
        );
    }

    /**
     * Mark notification "Dalam pengiriman" sebelumnya sebagai read berdasarkan order_id
     * (menandai yang terlama berdasarkan created_at)
     */
    async markDalamPengirimanPreviousAsRead(orderId: number): Promise<void> {
        // Cari notification "Dalam pengiriman" terlama untuk order ini
        const oldestNotification = await this.notificationBadgeModel.findOne({
            where: {
                item_id: orderId,
                item_type: 'order',
                menu_name: 'Dalam pengiriman',
                is_read: 0
            },
            order: [['created_at', 'ASC']], // ASC untuk mendapatkan yang terlama
            attributes: ['id', 'created_at']
        });

        if (oldestNotification) {
            // Mark notification "Dalam pengiriman" yang terlama
            await this.notificationBadgeModel.update(
                { is_read: 1 },
                {
                    where: {
                        id: oldestNotification.id
                    }
                }
            );
        }
    }

    /**
     * Mark notification "Reweight" sebagai read berdasarkan order_id
     */
    async markOrderReweight(orderId: number): Promise<void> {
        await this.notificationBadgeModel.update(
            { is_read: 1 },
            {
                where: {
                    item_id: orderId,
                    item_type: 'order',
                    menu_name: 'Reweight',
                    is_read: 0
                }
            }
        );
    }

    /**
     * Cleanup notification badges yang sudah lama (lebih dari 30 hari)
     */
    async cleanupOldNotifications(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await this.notificationBadgeModel.destroy({
            where: {
                created_at: {
                    [Op.lt]: thirtyDaysAgo,
                },
                is_read: 1, // Hanya hapus yang sudah dibaca
            }
        });
    }
}
