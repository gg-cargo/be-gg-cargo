import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      this.logger.log(`Register request received for email: ${registerDto.email}`);
      const result = await this.authService.register(registerDto);
      this.logger.log(`Register successful for email: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Register failed for email: ${registerDto.email}`, error.stack);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Login request received for: ${loginDto.email_or_phone}`);
      const result = await this.authService.login(loginDto);
      this.logger.log(`Login successful for: ${loginDto.email_or_phone}`);
      return result;
    } catch (error) {
      this.logger.error(`Login failed for: ${loginDto.email_or_phone}`, error.stack);
      throw error;
    }
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      this.logger.log(`OTP verification request received for phone: ${verifyOtpDto.phone}`);
      const result = await this.authService.verifyOtp(verifyOtpDto);
      this.logger.log(`OTP verification successful for phone: ${verifyOtpDto.phone}`);
      return result;
    } catch (error) {
      this.logger.error(`OTP verification failed for phone: ${verifyOtpDto.phone}`, error.stack);
      throw error;
    }
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    try {
      this.logger.log(`Resend OTP request received for phone: ${resendOtpDto.phone}`);
      const result = await this.authService.resendOtp(resendOtpDto);
      this.logger.log(`Resend OTP successful for phone: ${resendOtpDto.phone}`);
      return result;
    } catch (error) {
      this.logger.error(`Resend OTP failed for phone: ${resendOtpDto.phone}`, error.stack);
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      this.logger.log(`Forgot password request received for email: ${forgotPasswordDto.email}`);
      const result = await this.authService.forgotPassword(forgotPasswordDto);
      this.logger.log(`Forgot password successful for email: ${forgotPasswordDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Forgot password failed for email: ${forgotPasswordDto.email}`, error.stack);
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      this.logger.log(`Reset password request received with token: ${resetPasswordDto.token}`);
      const result = await this.authService.resetPassword(resetPasswordDto);
      this.logger.log(`Reset password successful with token: ${resetPasswordDto.token}`);
      return result;
    } catch (error) {
      this.logger.error(`Reset password failed with token: ${resetPasswordDto.token}`, error.stack);
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    try {
      const userId = req.user.user.id;
      this.logger.log(`Get profile request received for user: ${userId}`);
      const result = await this.authService.getProfile(userId);
      this.logger.log(`Get profile successful for user: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Get profile failed for user: ${req.user?.user?.id}`, error.stack);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    try {
      const userId = req.user.id;
      this.logger.log(`Logout request received for user: ${userId}`);
      const result = await this.authService.logout(userId);
      this.logger.log(`Logout successful for user: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Logout failed for user: ${req.user?.id}`, error.stack);
      throw error;
    }
  }

  @Post('remember-me')
  @HttpCode(HttpStatus.OK)
  async rememberMe(@Body() body: { remember_token: string }) {
    try {
      this.logger.log(`Remember me request received with token: ${body.remember_token}`);
      const user = await this.authService.validateRememberToken(body.remember_token);

      // Generate new tokens for remember me
      const payload = {
        sub: user.getDataValue('id'),
        email: user.getDataValue('email'),
        phone: user.getDataValue('phone'),
        level: user.getDataValue('level'),
      };

      const accessToken = this.authService.generateToken(payload);

      this.logger.log(`Remember me successful for user: ${user.getDataValue('id')}`);

      return {
        success: true,
        message: 'Auto login berhasil',
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
        remember_token: body.remember_token,
      };
    } catch (error) {
      this.logger.error(`Remember me failed with token: ${body.remember_token}`, error.stack);
      throw error;
    }
  }
} 