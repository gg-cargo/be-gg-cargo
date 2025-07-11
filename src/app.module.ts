import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './auth/auth.module';
import { User } from './models/user.model';
import { DumpOtp } from './models/dump-otp.model';
import { PasswordReset } from './models/password-reset.model';
import { Level } from './models/level.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_DEVELOPMENT_HOST || 'localhost',
      port: parseInt(process.env.DB_DEVELOPMENT_PORT || '3306'),
      username: process.env.DB_DEVELOPMENT_USERNAME || 'root',
      password: process.env.DB_DEVELOPMENT_PASSWORD || '',
      database: process.env.DB_DEVELOPMENT_DATABASE || 'api',
      models: [User, DumpOtp, PasswordReset, Level],
      autoLoadModels: true,
      synchronize: false, // Set false karena kita pakai migration
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
