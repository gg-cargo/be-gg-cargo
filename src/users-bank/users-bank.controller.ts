import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersBankService } from './users-bank.service';
import { CreateUsersBankDto } from './dto/create-users-bank.dto';

@UseGuards(JwtAuthGuard)
@Controller('users-bank')
export class UsersBankController {
  constructor(private readonly usersBankService: UsersBankService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUsersBankDto, @Req() req: { user?: { id?: number } }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.usersBankService.create(dto, userId);
  }

  @Get()
  async findAll(@Req() req: { user?: { id?: number } }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User tidak terautentikasi');
    }
    return this.usersBankService.findAllByUser(userId);
  }
}
