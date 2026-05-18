import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UsersBank } from '../models/users-bank.model';
import { User } from '../models/user.model';
import { CreateUsersBankDto } from './dto/create-users-bank.dto';
import { UpdateUsersBankDto } from './dto/update-users-bank.dto';

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

  async create(dto: CreateUsersBankDto) {
    const idUser = dto.id_user.trim();
    const userPk = Number(idUser);
    if (!idUser || Number.isNaN(userPk) || userPk <= 0) {
      throw new BadRequestException('id_user tidak valid');
    }

    const user = await this.userModel.findByPk(userPk);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const existing = await this.usersBankModel.findOne({
      where: { id_user: idUser },
    });
    if (existing) {
      throw new BadRequestException(
        'User ini sudah memiliki data rekening bank. Satu user hanya boleh satu rekening.',
      );
    }

    const row = await this.usersBankModel.create({
      id_user: idUser,
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

  private async findById(id: number): Promise<UsersBank> {
    const row = await this.usersBankModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Data rekening bank tidak ditemukan');
    }
    return row;
  }

  async update(id: number, dto: UpdateUsersBankDto) {
    const row = await this.findById(id);

    const hasUpdate =
      dto.code_bank !== undefined ||
      dto.nama_bank !== undefined ||
      dto.nama_pemilik_rekening !== undefined ||
      dto.nomor_rekening !== undefined ||
      dto.image !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException('Tidak ada field yang diubah');
    }

    if (dto.code_bank !== undefined) {
      row.setDataValue('code_bank', dto.code_bank.trim() || null);
    }
    if (dto.nama_bank !== undefined) {
      const v = dto.nama_bank.trim();
      if (!v) {
        throw new BadRequestException('nama_bank tidak boleh kosong');
      }
      row.setDataValue('nama_bank', v);
    }
    if (dto.nama_pemilik_rekening !== undefined) {
      const v = dto.nama_pemilik_rekening.trim();
      if (!v) {
        throw new BadRequestException('nama_pemilik_rekening tidak boleh kosong');
      }
      row.setDataValue('nama_pemilik_rekening', v);
    }
    if (dto.nomor_rekening !== undefined) {
      const v = dto.nomor_rekening.trim();
      if (!v) {
        throw new BadRequestException('nomor_rekening tidak boleh kosong');
      }
      row.setDataValue('nomor_rekening', v);
    }
    if (dto.image !== undefined) {
      row.setDataValue('image', dto.image.trim() || null);
    }

    await row.save();

    return {
      success: true,
      message: 'Data rekening bank berhasil diperbarui',
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
