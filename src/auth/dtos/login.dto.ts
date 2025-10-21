import { IsEmail, IsString, ValidateIf } from "class-validator";


export class LoginDto {
    @IsString()
    identify: string;

    @IsString()
    password: string;
}
