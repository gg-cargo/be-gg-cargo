export class UserResponseDto {
    id: number;
    service_center: string;
    code: string | null;
    name: string;
    email: string;
    phone: string;
    level: string;
    status: string;
    saldo: number;
}

export class CreateUserResponseDto {
    message: string;
    data: {
        id: number;
        name: string;
        email: string;
        phone: string;
        level: string;
        status: string;
        kode_referral?: string | null;
    };
}

export class UpdateUserResponseDto {
    message: string;
    data: {
        id: number;
        name: string;
        email: string;
        phone: string;
        level: string;
        status: string;
    };
}

export class ChangePasswordResponseDto {
    message: string;
    success: boolean;
}

export class PaginationDto {
    total_items: number;
    total_pages: number;
    current_page: number;
    items_per_page: number;
}

export class ListUsersResponseDto {
    message: string;
    data: {
        pagination: PaginationDto;
        users: UserResponseDto[];
    };
} 