import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UsersAddress } from '../models/users-address.model';

@Injectable()
export class UsersAddressService {
    constructor(
        @InjectModel(UsersAddress)
        private readonly usersAddressModel: typeof UsersAddress,
    ) { }

    async create(dto: Partial<UsersAddress>, userId: number) {
        const address = await this.usersAddressModel.create({
            ...dto,
            id_user: userId,
            created_at: new Date(),
        });
        return {
            message: 'Address created successfully',
            data: address,
        }
    }

    async findAll(userId: number) {
        const addresses = await this.usersAddressModel.findAll({
            where: {
                id_user: userId,
            },
        });
        if (addresses.length === 0) throw new NotFoundException('Addresses not found');
        return {
            message: 'Addresses fetched successfully',
            data: addresses,
        }
    }

    async findOne(id: number, userId: number) {
        const address = await this.usersAddressModel.findOne({
            where: {
                id: id,
                id_user: userId,
            },
        });
        if (!address) throw new NotFoundException('Address not found');
        return {
            message: 'Address fetched successfully',
            data: address,
        }
    }

    async update(id: number, dto: Partial<UsersAddress>, userId: number) {
        const addressResponse = await this.findOne(id, userId);
        const updatedAddress = await addressResponse.data.update({
            ...dto,
            updated_at: new Date(),
        });
        return {
            message: 'Address updated successfully',
            data: updatedAddress,
        }
    }

    async remove(id: number, userId: number) {
        const addressResponse = await this.findOne(id, userId);
        if (addressResponse.data.id_user !== userId) throw new ForbiddenException('You are not allowed to delete this address');
        await addressResponse.data.destroy();
        return {
            message: 'Address deleted successfully',
        }
    }
} 