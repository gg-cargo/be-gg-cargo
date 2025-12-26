import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as FormData from 'form-data';
import axios from 'axios';
import { User } from '../models/user.model';
import { DumpOtp } from '../models/dump-otp.model';
import { PasswordReset } from '../models/password-reset.model';
import { Level } from '../models/level.model';
import { Hub } from '../models/hub.model';
import { ServiceCenter } from '../models/service-center.model';
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
    @InjectModel(Hub)
    private hubModel: typeof Hub,
    @InjectModel(ServiceCenter)
    private serviceCenterModel: typeof ServiceCenter,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      if (existingEmail && existingEmail.getDataValue('phone_verify_at') === null) {
        await this.userModel.destroy({ where: { id: existingEmail.getDataValue('id') } });
      } else if (existingEmail) {
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

      // Send OTP via Email
      try {
        await this.sendMailgunEmail({
          to: [email],
          subject: 'OTP Verifikasi - GG KARGO',
          html: this.generateOTPEmailHtml(user.getDataValue('name'), otp),
        });
        this.logger.log(`OTP sent via email to ${email}`);
      } catch (emailError) {
        this.logger.error(`Failed to send OTP email to ${email}: ${emailError.message}`);
        // Continue registration even if email fails
      }

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
          otp: otp,
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
        include: [
          { model: Level, as: 'levelData' },
          { model: Hub, as: 'hub' },
          { model: ServiceCenter, as: 'serviceCenter' },
        ],
        raw: true,
      });

      if (!user) {
        throw new InvalidCredentialsException();
      }

      // Validate password input
      if (!password || !user.password) {
        throw new InvalidCredentialsException();
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsException();
      }

      // Check if user is active
      if (user.aktif !== 1) {
        throw new AccountInactiveException();
      }

      // Check if user is verified
      if (!user.phone_verify_at) {
        throw new UnverifiedAccountException();
      }

      // Generate tokens
      const payload = {
        sub: user.id,
        email: user.email,
        phone: user.phone,
        level: user.level,
      };

      const accessToken = this.generateToken(payload);
      let rememberToken: string | null = null;

      if (remember_me) {
        rememberToken = this.generateRememberToken();
        await this.userModel.update(
          { remember_token: rememberToken },
          { where: { id: user.id } }
        );
      }

      this.logger.log(`User logged in successfully: ${user.id}`);

      // Ambil informasi area (hub atau service center)
      let area: any = null;
      if (user.hub_id && user.hub_id !== 0) {
        area = {
          type: 'hub',
          id: user['hub.id'],
          nama: user['hub.nama'],
          kode: user['hub.kode'],
        };
      } else if (user.service_center_id && user.service_center_id !== 0) {
        area = {
          type: 'service_center',
          id: user['serviceCenter.id'],
          nama: user['serviceCenter.nama'],
          kode: user['serviceCenter.kode'],
        };
      }

      return {
        success: true,
        message: 'Login berhasil',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          level: user.level,
          level_name: user.levelData?.nama,
          email_verified_at: user.email_verified_at,
          phone_verify_at: user.phone_verify_at,
          area,
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
      const otpRecord = await this.dumpOtpModel.findOne({
        where: { phone },
        order: [['created_at', 'DESC']],
        limit: 1,
      });

      if (!otpRecord || otpRecord.getDataValue('otp') !== otp) {
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

      // Send OTP via Email
      try {
        await this.sendMailgunEmail({
          to: [user.getDataValue('email')],
          subject: 'OTP Baru - GG KARGO',
          html: this.generateOTPEmailHtml(user.getDataValue('name'), otp),
        });
        this.logger.log(`OTP resent via email to ${user.getDataValue('email')}`);
      } catch (emailError) {
        this.logger.error(`Failed to send OTP email to ${user.getDataValue('email')}: ${emailError.message}`);
        // Continue even if email fails
      }

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

  /**
   * Mengirim email melalui Mailgun API
   */
  private async sendMailgunEmail(emailData: {
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
    from?: string;
  }): Promise<{ id: string }> {
    const domain = this.configService.get('MAILGUN_DOMAIN');
    const apiKey = this.configService.get('MAILGUN_API_KEY');

    if (!domain || !apiKey) {
      this.logger.warn('Konfigurasi Mailgun tidak lengkap, skip pengiriman email');
      return { id: 'skipped' };
    }

    const formData = new FormData();
    formData.append('from', emailData.from || 'GG KARGO <no-reply@99delivery.id>');
    formData.append('to', emailData.to.join(','));
    formData.append('h:Content-Type', 'text/html; charset=UTF-8');

    if (emailData.cc && emailData.cc.length > 0) {
      formData.append('cc', emailData.cc.join(','));
    }

    formData.append('subject', emailData.subject);
    formData.append('html', emailData.html);

    try {
      const response = await axios.post(
        `https://api.mailgun.net/v3/${domain}/messages`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
          }
        }
      );

      if (response.status === 200) {
        this.logger.log(`Email sent successfully via Mailgun: ${response.data.id}`);
        return { id: response.data.id };
      } else {
        throw new Error(`Mailgun API error: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      this.logger.error(`Mailgun API error: ${error.message}`);
      throw new Error(`Gagal mengirim email melalui Mailgun: ${error.message}`);
    }
  }

  /**
   * Generate HTML template untuk email OTP
   */
  private generateOTPEmailHtml(name: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1A723B; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f5f5f5; padding: 30px; }
          .otp-box { background-color: #fff; border: 2px solid #1A723B; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #1A723B; letter-spacing: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GG KARGO</h1>
            <p>Verifikasi Kode OTP</p>
          </div>
          <div class="content">
            <p>Halo <strong>${name}</strong>,</p>
            <p>Terima kasih telah melakukan registrasi di GG KARGO. Gunakan kode OTP berikut untuk verifikasi akun Anda:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Kode OTP Anda:</p>
              <div class="otp-code">${otp}</div>
            </div>
            
            <p><strong>Perhatian:</strong></p>
            <ul>
              <li>Kode OTP ini berlaku selama <strong>15 menit</strong></li>
              <li>Jangan berikan kode ini kepada siapapun</li>
              <li>Jika Anda tidak melakukan registrasi, abaikan email ini</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GG KARGO. Hak Cipta Dilindungi.</p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 