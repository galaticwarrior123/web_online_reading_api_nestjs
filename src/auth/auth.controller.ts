import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { VerifyDto } from './dtos/verify.dto';
import { LoginDto } from './dtos/login.dto';
import { User, UserRole } from 'src/schemas/user.schema';
import { AuthGuard } from './auth.guard';

@Controller('api/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Get('/all-users')
    async getAllUsers() {
        return this.authService.getAllUsers();
    }

    @Post('/register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('/verify')
    async verify(@Body() verifyDto: VerifyDto) {
        return this.authService.verify(verifyDto.email, verifyDto.activeCode);
    }

    @Post('/login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('/resend-verification-code')
    async resendActiveCode(@Body('email') email: string) {
        return this.authService.resendActiveCode(email);
    }

    @Post('/resetPassword')
    async resetPassword(@Body('email') email: string, @Body('newPassword') newPassword: string) {
        return this.authService.resetNewPassword(email, newPassword);
    }

    @Post('/me')
    async getMe(@Body('token') token: string) {
        return this.authService.findUserByToken(token);
    }

    @Post('create-user')
    async createUser(@Body() userData: Partial<any>) {
        return this.authService.createUser(userData);
    }

    @Put('/updateProfile/:id')
    @UseGuards(AuthGuard)
    async updateProfile(@Param('id') id: string, @Body() updateData: Partial<any>) {
        return this.authService.updateProfile(id, updateData);
    }

    @Put('/permission-role/:id')
    @UseGuards(AuthGuard)
    async permissionRoles(@Param('id') id: string, @Body('role') role: UserRole) {
        return this.authService.permissionRoles(id, role);
    }

    @Put("/banned/:userId")
    @UseGuards(AuthGuard)
    async bannedUser(@Param("userId") userId: string, @Body("isBanned") isBanned: boolean) {
        return this.authService.banUser(userId, isBanned);
    }

    @Get('/register/options')
    async registerOptions(@Query('email') email: string) {
        return this.authService.generatePasskeyRegisterOptions(email);
    }

    @Post('/register/verify')
    async verifyRegister(@Body() body: any) {
        return this.authService.verifyPasskeyRegisterResponse(body.email, body.response);
    }

    @Get('/login/options')
    async loginOptions(@Query('email') email: string) {
        return this.authService.generatePasskeyLoginOptions(email);
    }

    @Post('/login/verify')
    async verifyLogin(@Body() body: any) {
        return this.authService.verifyPasskeyLoginResponse(body.email, body.response);
    }

}