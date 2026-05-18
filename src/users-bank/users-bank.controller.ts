import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersBankService } from './users-bank.service';
import { CreateUsersBankDto } from './dto/create-users-bank.dto';
import { UpdateUsersBankDto } from './dto/update-users-bank.dto';

@UseGuards(JwtAuthGuard)
@Controller('users-bank')
export class UsersBankController {
  constructor(private readonly usersBankService: UsersBankService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUsersBankDto) {
    return this.usersBankService.create(dto);
  }

  @Get()
  async findAll(@Req() req: { user?: { id?: number } }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.usersBankService.findAllByUser(userId);
  }

  @Get('user/:userId')
  async findByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: { user?: { id?: number } },
  ) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.usersBankService.findAllByUser(userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsersBankDto,
  ) {
    return this.usersBankService.update(id, dto);
  }
}
