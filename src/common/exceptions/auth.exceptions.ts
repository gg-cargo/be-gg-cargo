import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidOtpException extends HttpException {
    constructor(message: string = 'OTP tidak valid') {
        super(
            {
                message,
                error: 'Invalid OTP',
                statusCode: HttpStatus.BAD_REQUEST,
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class OtpExpiredException extends HttpException {
    constructor(message: string = 'OTP sudah kadaluarsa') {
        super(
            {
                message,
                error: 'OTP Expired',
                statusCode: HttpStatus.BAD_REQUEST,
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class UserNotFoundException extends HttpException {
    constructor(message: string = 'User tidak ditemukan') {
        super(
            {
                message,
                error: 'User Not Found',
                statusCode: HttpStatus.NOT_FOUND,
            },
            HttpStatus.NOT_FOUND,
        );
    }
}

export class InvalidCredentialsException extends HttpException {
    constructor(message: string = 'Email/phone atau password salah') {
        super(
            {
                message,
                error: 'Invalid Credentials',
                statusCode: HttpStatus.UNAUTHORIZED,
            },
            HttpStatus.UNAUTHORIZED,
        );
    }
}

export class UserAlreadyExistsException extends HttpException {
    constructor(field: string = 'email') {
        const message = field === 'email'
            ? 'Email sudah terdaftar'
            : 'Nomor telepon sudah terdaftar';

        super(
            {
                message,
                error: 'User Already Exists',
                statusCode: HttpStatus.CONFLICT,
                details: { field },
            },
            HttpStatus.CONFLICT,
        );
    }
}

export class AccountInactiveException extends HttpException {
    constructor(message: string = 'Akun tidak aktif') {
        super(
            {
                message,
                error: 'Account Inactive',
                statusCode: HttpStatus.UNAUTHORIZED,
            },
            HttpStatus.UNAUTHORIZED,
        );
    }
}

export class InvalidResetTokenException extends HttpException {
    constructor(message: string = 'Token reset tidak valid') {
        super(
            {
                message,
                error: 'Invalid Reset Token',
                statusCode: HttpStatus.BAD_REQUEST,
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class ResetTokenExpiredException extends HttpException {
    constructor(message: string = 'Token reset sudah kadaluarsa') {
        super(
            {
                message,
                error: 'Reset Token Expired',
                statusCode: HttpStatus.BAD_REQUEST,
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class UnverifiedAccountException extends HttpException {
    constructor(message: string = 'Akun belum diverifikasi. Silakan verifikasi OTP terlebih dahulu') {
        super(
            {
                message,
                error: 'Unverified Account',
                statusCode: HttpStatus.UNAUTHORIZED,
            },
            HttpStatus.UNAUTHORIZED,
        );
    }
} 