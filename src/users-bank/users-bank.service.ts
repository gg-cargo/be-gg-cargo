import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UsersBank } from '../models/users-bank.model';
import { User } from '../models/user.model';
import { CreateUsersBankDto } from './dto/create-users-bank.dto';

@Injectable()
export class UsersBankService {
  constructor(
    @InjectModel(UsersBank)
    private readonly usersBankModel: typeof UsersBank,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  private mapRow(row: UsersBank) {
    return {
      id: row.getDataValue('id'),
      id_user: row.getDataValue('id_user'),
      code_bank: row.getDataValue('code_bank') ?? null,
      nama_bank: row.getDataValue('nama_bank'),
      nama_pemilik_rekening: row.getDataValue('nama_pemilik_rekening'),
      nomor_rekening: row.getDataValue('nomor_rekening'),
      image: row.getDataValue('image') ?? null,
      created_at: row.getDataValue('created_at'),
    };
  }

  async create(dto: CreateUsersBankDto, userId: number) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const row = await this.usersBankModel.create({
      id_user: String(userId),
      code_bank: dto.code_bank?.trim() || null,
      nama_bank: dto.nama_bank.trim(),
      nama_pemilik_rekening: dto.nama_pemilik_rekening.trim(),
      nomor_rekening: dto.nomor_rekening.trim(),
      image: dto.image?.trim() || null,
      created_at: new Date(),
    } as any);

    return {
      success: true,
      message: 'Data rekening bank berhasil ditambahkan',
      data: this.mapRow(row),
    };
  }

  async findAllByUser(userId: number) {
    const rows = await this.usersBankModel.findAll({
      where: { id_user: String(userId) },
      order: [['created_at', 'DESC']],
    });

    return {
      success: true,
      message: 'Daftar rekening bank berhasil diambil',
      data: rows.map((row) => this.mapRow(row)),
    };
  }
}
