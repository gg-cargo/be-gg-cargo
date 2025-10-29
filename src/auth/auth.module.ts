import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../models/user.model';
import { DumpOtp } from '../models/dump-otp.model';
import { PasswordReset } from '../models/password-reset.model';
import { Level } from '../models/level.model';
import { Hub } from '../models/hub.model';
import { ServiceCenter } from '../models/service-center.model';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([User, DumpOtp, PasswordReset, Level, Hub, ServiceCenter]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { } 