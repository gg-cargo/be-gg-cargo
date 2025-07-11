import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { DumpOtp } from '../models/dump-otp.model';
import { PasswordReset } from '../models/password-reset.model';
import { Level } from '../models/level.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  InvalidOtpException,
  OtpExpiredException,
  UserNotFoundException,
  InvalidCredentialsException,
  UserAlreadyExistsException,
  AccountInactiveException,
  InvalidResetTokenException,
  ResetTokenExpiredException,
  UnverifiedAccountException,
} from '../common/exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(DumpOtp)
    private dumpOtpModel: typeof DumpOtp,
    @InjectModel(PasswordReset)
    private passwordResetModel: typeof PasswordReset,
    @InjectModel(Level)
    private levelModel: typeof Level,
    private jwtService: JwtService,
  ) { }

  // Generate OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate JWT Token
  public generateToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  // Generate Remember Token
  private generateRememberToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Register User
  async register(registerDto: RegisterDto) {
    try {
      const { email, phone, password, level = 1 } = registerDto;

      this.logger.log(`Attempting to register user with email: ${email}`);

      // Check if email already exists
      const existingEmail = await this.userModel.findOne({ where: { email } });
      if (existingEmail) {
        throw new UserAlreadyExistsException('email');
      }

      // Check if phone already exists
      const existingPhone = await this.userModel.findOne({ where: { phone } });
      if (existingPhone) {
        throw new UserAlreadyExistsException('phone');
      }

      // Validate password input
      if (!password) {
        throw new InvalidCredentialsException('Password tidak boleh kosong');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await this.userModel.create({
        ...registerDto,
        password: hashedPassword,
        level,
        created_at: new Date(),
      });

      // Generate and save OTP
      const otp = this.generateOTP();
      await this.dumpOtpModel.create({
        phone,
        otp,
        created_at: new Date(),
      });

      // TODO: Send OTP via SMS/Email
      this.logger.log(`OTP generated for ${phone}: ${otp}`);

      this.logger.log(`User registered successfully: ${user.getDataValue('id')}`);

      return {
        success: true,
        message: 'Registrasi berhasil. Silakan verifikasi OTP',
        user: {
          id: user.getDataValue('id'),
          name: user.getDataValue('name'),
          email: user.getDataValue('email'),
          phone: user.getDataValue('phone'),
          level: user.getDataValue('level'),
        },
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Login User
  async login(loginDto: LoginDto) {
    try {
      const { email_or_phone, password, remember_me = false } = loginDto;

      this.logger.log(`Login attempt for: ${email_or_phone}`);

      // Find user by email or phone
      const user = await this.userModel.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { email: email_or_phone },
            { phone: email_or_phone },
          ],
        },
        include: [{ model: Level, as: 'levelData' }],
      });

      if (!user) {
        throw new InvalidCredentialsException();
      }

      // Validate password input
      if (!password || !user.getDataValue('password')) {
        throw new InvalidCredentialsException();
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.getDataValue('password'));
      if (!isPasswordValid) {
        throw new InvalidCredentialsException();
      }

      // Check if user is active
      if (user.getDataValue('aktif') !== 1) {
        throw new AccountInactiveException();
      }

      // Check if user is verified
      if (!user.getDataValue('phone_verify_at')) {
        throw new UnverifiedAccountException();
      }

      // Generate tokens
      const payload = {
        sub: user.getDataValue('id'),
        email: user.getDataValue('email'),
        phone: user.getDataValue('phone'),
        level: user.getDataValue('level'),
      };

      const accessToken = this.generateToken(payload);
      let rememberToken: string | null = null;

      if (remember_me) {
        rememberToken = this.generateRememberToken();
        await this.userModel.update(
          { remember_token: rememberToken },
          { where: { id: user.getDataValue('id') } }
        );
      }

      this.logger.log(`User logged in successfully: ${user.getDataValue('id')}`);

      return {
        success: true,
        message: 'Login berhasil',
        user: {
          id: user.getDataValue('id'),
          name: user.getDataValue('name'),
          email: user.getDataValue('email'),
          phone: user.getDataValue('phone'),
          level: user.getDataValue('level'),
          level_name: user.levelData?.getDataValue('nama'),
          email_verified_at: user.getDataValue('email_verified_at'),
          phone_verify_at: user.getDataValue('phone_verify_at'),
        },
        access_token: accessToken,
        remember_token: rememberToken,
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Verify OTP
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    try {
      const { phone, otp } = verifyOtpDto;

      this.logger.log(`OTP verification attempt for phone: ${phone}`);

      // Find OTP
      // find the latest otp record
      const otpRecord = await this.dumpOtpModel.findOne({});

      if (!otpRecord) {
        throw new InvalidOtpException();
      }

      // Check if OTP is expired (15 minutes)
      if (!otpRecord.getDataValue('created_at')) {
        await this.dumpOtpModel.destroy({ where: { id: otpRecord.id } });
        throw new InvalidOtpException('OTP tidak valid (created_at missing)');
      }

      const otpAge = Date.now() - otpRecord.getDataValue('created_at').getTime();
      if (otpAge > 15 * 60 * 1000) {
        await this.dumpOtpModel.destroy({ where: { id: otpRecord.id } });
        throw new OtpExpiredException();
      }

      // Find user
      const user = await this.userModel.findOne({ where: { phone } });
      if (!user) {
        throw new UserNotFoundException();
      }

      // Update user verification
      await this.userModel.update(
        {
          phone_verify_at: new Date(),
          updated_at: new Date(),
        },
        { where: { id: user.getDataValue('id') } }
      );

      // Delete OTP
      await this.dumpOtpModel.destroy({ where: { id: otpRecord.id } });

      this.logger.log(`OTP verified successfully for user: ${user.getDataValue('id')}`);

      return {
        success: true,
        message: 'Verifikasi OTP berhasil',
        user: {
          id: user.getDataValue('id'),
          name: user.getDataValue('name'),
          email: user.getDataValue('email'),
          phone: user.getDataValue('phone'),
          phone_verify_at: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(`OTP verification failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Resend OTP
  async resendOtp(resendOtpDto: ResendOtpDto) {
    try {
      const { phone } = resendOtpDto;

      this.logger.log(`Resend OTP attempt for phone: ${phone}`);

      // Check if user exists
      const user = await this.userModel.findOne({ where: { phone } });
      if (!user) {
        throw new UserNotFoundException();
      }

      // Delete existing OTP
      await this.dumpOtpModel.destroy({ where: { phone } });

      // Generate new OTP
      const otp = this.generateOTP();
      await this.dumpOtpModel.create({
        phone,
        otp,
        created_at: new Date(),
      });

      // TODO: Send OTP via SMS/Email
      this.logger.log(`New OTP generated for ${phone}: ${otp}`);

      return {
        success: true,
        message: 'OTP baru telah dikirim',
      };
    } catch (error) {
      this.logger.error(`Resend OTP failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Forgot Password
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { email } = forgotPasswordDto;

      this.logger.log(`Forgot password attempt for email: ${email}`);

      // Check if user exists
      const user = await this.userModel.findOne({ where: { email } });
      if (!user) {
        throw new UserNotFoundException('Email tidak terdaftar');
      }

      // Generate reset token
      const resetToken = this.generateRememberToken();

      // Save reset token
      await this.passwordResetModel.create({
        email,
        token: resetToken,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // TODO: Send reset email
      this.logger.log(`Reset token generated for ${email}: ${resetToken}`);

      return {
        success: true,
        message: 'Link reset password telah dikirim ke email',
      };
    } catch (error) {
      this.logger.error(`Forgot password failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Reset Password
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { token, password } = resetPasswordDto;

      this.logger.log(`Reset password attempt with token: ${token}`);

      // Find reset token
      const resetRecord = await this.passwordResetModel.findOne({
        where: { token },
        order: [['created_at', 'DESC']],
      });

      if (!resetRecord) {
        throw new InvalidResetTokenException();
      }

      // Check if token is expired (1 hour)
      if (!resetRecord.created_at) {
        await this.passwordResetModel.destroy({ where: { id: resetRecord.id } });
        throw new InvalidResetTokenException('Token reset tidak valid (created_at missing)');
      }

      const tokenAge = Date.now() - resetRecord.created_at.getTime();
      if (tokenAge > 60 * 60 * 1000) {
        await this.passwordResetModel.destroy({ where: { id: resetRecord.id } });
        throw new ResetTokenExpiredException();
      }

      // Find user
      const user = await this.userModel.findOne({ where: { email: resetRecord.email } });
      if (!user) {
        throw new UserNotFoundException();
      }

      // Validate password input
      if (!password) {
        throw new InvalidCredentialsException('Password tidak boleh kosong');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await this.userModel.update(
        {
          password: hashedPassword,
          updated_at: new Date(),
        },
        { where: { id: user.getDataValue('id') } }
      );

      // Delete reset token
      await this.passwordResetModel.destroy({ where: { id: resetRecord.id } });

      this.logger.log(`Password reset successfully for user: ${user.getDataValue('id')}`);

      return {
        success: true,
        message: 'Password berhasil direset',
      };
    } catch (error) {
      this.logger.error(`Reset password failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get Profile
  async getProfile(userId: number) {
    try {
      this.logger.log(`Getting profile for user: ${userId}`);

      const user = await this.userModel.findByPk(userId, {
        include: [{ model: Level, as: 'levelData' }],
      });

      if (!user) {
        throw new UserNotFoundException();
      }

      return {
        success: true,
        user: {
          id: user.getDataValue('id'),
          name: user.getDataValue('name'),
          email: user.getDataValue('email'),
          phone: user.getDataValue('phone'),
          level: user.getDataValue('level'),
          level_name: user.levelData?.getDataValue('nama'),
          email_verified_at: user.getDataValue('email_verified_at'),
          phone_verify_at: user.getDataValue('phone_verify_at'),
          address: user.getDataValue('address'),
          nik: user.getDataValue('nik'),
          sim: user.getDataValue('sim'),
          stnk: user.getDataValue('stnk'),
          kir: user.getDataValue('kir'),
          no_polisi: user.getDataValue('no_polisi'),
          type_transporter: user.getDataValue('type_transporter'),
          url_image: user.getDataValue('url_image'),
          created_at: user.getDataValue('created_at'),
        },
      };
    } catch (error) {
      this.logger.error(`Get profile failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Logout
  async logout(userId: number) {
    try {
      this.logger.log(`Logout attempt for user: ${userId}`);

      // Clear remember token
      await this.userModel.update(
        { remember_token: null },
        { where: { id: userId } }
      );

      this.logger.log(`User logged out successfully: ${userId}`);

      return {
        success: true,
        message: 'Logout berhasil',
      };
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Validate Remember Token
  async validateRememberToken(rememberToken: string) {
    try {
      this.logger.log(`Validating remember token: ${rememberToken}`);

      const user = await this.userModel.findOne({
        where: { remember_token: rememberToken },
        include: [{ model: Level, as: 'levelData' }],
      });

      if (!user) {
        throw new InvalidCredentialsException('Token tidak valid');
      }

      if (user.getDataValue('aktif') !== 1) {
        throw new AccountInactiveException();
      }

      return user;
    } catch (error) {
      this.logger.error(`Remember token validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }
} 