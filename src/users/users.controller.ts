import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, HttpCode, HttpStatus, ParseIntPipe, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ListUsersResponseDto, CreateUserResponseDto, UpdateUserResponseDto, ChangePasswordResponseDto } from './dto/user-response.dto';
import { UserDetailResponseDto } from './dto/user-detail-response.dto';
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

    @Get(':id')
    async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserDetailResponseDto> {
        return this.usersService.getUserById(id);
    }

    @Patch('change-password')
    async changePassword(
        @Request() req,
        @Body() changePasswordDto: ChangePasswordDto
    ): Promise<ChangePasswordResponseDto> {
        const userId = req.user.id;
        return this.usersService.changePassword(userId, changePasswordDto);
    }

    @Patch(':id')
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ): Promise<UpdateUserResponseDto> {
        return this.usersService.updateUser(id, updateUserDto);
    }
} 