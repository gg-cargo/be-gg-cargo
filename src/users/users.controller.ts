import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, HttpCode, HttpStatus, ParseIntPipe, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { LinkSalesDto } from './dto/link-sales.dto';
import { ListUsersResponseDto, CreateUserResponseDto, UpdateUserResponseDto, ChangePasswordResponseDto } from './dto/user-response.dto';
import { ChangeMyPasswordResponseDto } from './dto/change-my-password-response.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
import { UpdateLocationDto, UpdateLocationResponseDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async listUsers(@Query() query: ListUsersDto): Promise<ListUsersResponseDto> {
        return this.usersService.listUsers(query);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() createUserDto: CreateUserDto): Promise<CreateUserResponseDto> {
        return this.usersService.createUser(createUserDto);
    }

    /**
     * Link customer ke sales berdasarkan kode referral
     */
    @Post('link-sales')
    @HttpCode(HttpStatus.OK)
    async linkToSales(
        @Request() req,
        @Body() linkSalesDto: LinkSalesDto,
    ): Promise<any> {
        const userId = req.user.id;
        return this.usersService.linkUserToSales(userId, linkSalesDto.kode_referral_sales);
    }

    /**
     * Get info sales yang terhubung dengan customer
     */
    @Get('my-sales')
    @HttpCode(HttpStatus.OK)
    async getMySales(@Request() req): Promise<any> {
        const userId = req.user.id;
        return this.usersService.getMySalesInfo(userId);
    }

    /**
     * Unlink customer dari sales
     */
    @Delete('unlink-sales')
    @HttpCode(HttpStatus.OK)
    async unlinkFromSales(@Request() req): Promise<any> {
        const userId = req.user.id;
        return this.usersService.unlinkUserFromSales(userId);
    }

    @Patch('change-password')
    async changePassword(
        @Request() req,
        @Body() changePasswordDto: ChangePasswordDto
    ): Promise<ChangePasswordResponseDto> {
        const userId = req.user.id;
        return this.usersService.changePassword(userId, changePasswordDto);
    }

    @Patch('me/password')
    async changeMyPassword(
        @Request() req,
        @Body() changeMyPasswordDto: ChangeMyPasswordDto
    ): Promise<ChangeMyPasswordResponseDto> {
        const userId = req.user.id;
        return this.usersService.changeMyPassword(userId, changeMyPasswordDto);
    }

    @Patch('me/location')
    async updateMyLocation(
        @Request() req,
        @Body() updateLocationDto: UpdateLocationDto,
    ): Promise<UpdateLocationResponseDto> {
        const userId = req.user.id;
        return this.usersService.updateMyLocation(userId, updateLocationDto);
    }

    @Get(':id')
    async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserDetailResponseDto> {
        return this.usersService.getUserById(id);
    }

    @Patch(':id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ): Promise<UpdateUserResponseDto> {
        return this.usersService.updateUser(id, updateUserDto);
    }
} 