import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsersAddressService } from '../users-address/users-address.service';
import { UsersAddress } from '../models/users-address.model';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users-address')
export class UsersAddressController {
    constructor(private readonly usersAddressService: UsersAddressService) { }

    @Post()
    async create(@Body() dto: Partial<UsersAddress>, @Req() req: any) {
        const userId = req.user?.id;
        return this.usersAddressService.create(dto, userId);
    }

    @Get()
    async findAll(@Req() req: any) {
        const userId = req.user?.id;
        return this.usersAddressService.findAll(userId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const userId = req.user?.id;
        return this.usersAddressService.findOne(id, userId);
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<UsersAddress>, @Req() req: any) {
        const userId = req.user?.id;
        return this.usersAddressService.update(id, dto, userId);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const userId = req.user?.id;
        return this.usersAddressService.remove(id, userId);
    }
} 