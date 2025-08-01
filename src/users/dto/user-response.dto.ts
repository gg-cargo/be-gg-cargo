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
    id: number;
    name: string;
    email: string;
    phone: string;
    level: string;
    status: string;
    message: string;
}

export class UpdateUserResponseDto {
    id: number;
    name: string;
    email: string;
    phone: string;
    level: string;
    status: string;
    message: string;
}

export class PaginationDto {
    total_items: number;
    total_pages: number;
    current_page: number;
    items_per_page: number;
}

export class ListUsersResponseDto {
    pagination: PaginationDto;
    users: UserResponseDto[];
} 