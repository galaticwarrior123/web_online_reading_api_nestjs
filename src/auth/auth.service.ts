import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'src/schemas/user.schema';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { LoginDto } from './dtos/login.dto';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    AuthenticatorTransportFuture
} from '@simplewebauthn/server';


@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
    ) { }

    async verify(email: string, activeCode: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.activeCode !== activeCode) {
            throw new Error('Invalid active code');
        }
        user.isActive = true;
        user.activeCode = '';
        await user.save();
        return user;
    }

    async login(loginDto: LoginDto) {

        // thử tìm theo email trước
        let user = await this.userModel.findOne({ email: loginDto.identify });

        if (!user) {
            // nếu không có thì thử username
            user = await this.userModel.findOne({ userName: loginDto.identify });
        }

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(loginDto.password, user.password);

        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const token = this.jwtService.sign({ id: user._id, role: user.role });
        return { user, token };
    }

    async register(registerDto: RegisterDto) {
        const foundUser = await this.userModel.findOne({
            $or: [
                { email: registerDto.email },
                { userName: registerDto.userName }
            ]
        });
        if (foundUser) {
            throw new Error('Email already exists');
        }
        const user = new this.userModel(registerDto);

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.activeCode = this.generateActiveCode();



        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Please confirm your email',
            text: `Your confirmation code is ${user.activeCode}`

        });

        return user.save();
    }


    async resendActiveCode(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        user.activeCode = this.generateActiveCode();
        await user.save();

        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Please confirm your email',
            text: `Your confirmation code is ${user.activeCode}`
        });

        return user;
    }

    async resetNewPassword(email: string, newPassword: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        return user;
    }


    async findUserByToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
            return await this.userModel.findById(payload.id);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }


    async updateProfile(id: string, updateData: Partial<User>) {
        const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
        return user;
    }

    async permissionRoles(userId: string, role: UserRole) {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.role = role;
        await user.save();
        return user;
    }

    async getAllUsers() {
        return this.userModel.find();
    }

    async banUser(userId: string, isBanned: boolean) {
        const user = await this.userModel.findOne({ _id: userId });

        if (!user) {
            throw new Error("User not found");
        }

        user.isActive = !isBanned;
        await user.save();

        return user;
    }


    async createUser(userData: Partial<User>) {
        const user = new this.userModel(userData);
        const salt = await bcrypt.genSalt(10);
        const randomPassword = this.randomPassword();
        user.password = await bcrypt.hash(randomPassword, salt);
        user.isActive = true;
        user.userName = userData.userName || `user${Date.now()}`;

        this.mailerService.sendMail({
            to: user.email,
            subject: 'Your account has been created',
            text: `Your account has been created. Your password is ${randomPassword}`
        });

        return user.save();
    }


    // --- Passkey Register ---
    async generatePasskeyRegisterOptions(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user) throw new Error('User not found');

        const options = await generateRegistrationOptions({
            rpName: process.env.NAME_APP || 'My App',
            rpID: process.env.DOMAIN_NAME || 'localhost',
            userName: user.userName,
            // See "Guiding use of authenticators via authenticatorSelection" below
            authenticatorSelection: {
                // Defaults
                residentKey: 'preferred',
                userVerification: 'preferred',
                // Optional
                authenticatorAttachment: 'platform',
            },
        });

        user.currentChallenge = options.challenge;
        await user.save();

        return options;
    }

    async verifyPasskeyRegisterResponse(email: string, response: any) {
        const user = await this.userModel.findOne({ email });
        if (!user) throw new Error('User not found');
        if (!user.currentChallenge) throw new Error('No challenge found');

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: process.env.LINK_CLIENT || 'http://localhost:3000', // domain frontend
            expectedRPID: process.env.DOMAIN_NAME || 'localhost',
        });

        if (verification.verified) {
            const info = verification.registrationInfo;
            user.passkey = {
                credentialID: info.credential.id,
                publicKey: info.credential.publicKey,
                counter: info.credential.counter,
                transports: info.credential.transports as AuthenticatorTransportFuture[] | undefined,
            };
            await user.save();
        }
        user.currentChallenge = '';
        await user.save();
        return verification;
    }

    // --- Passkey Login ---
    async generatePasskeyLoginOptions(email: string) {
        const user = await this.userModel.findOne({ email });
        if (!user || !user.passkey) throw new Error('User not found or no passkey');

        const options = await generateAuthenticationOptions({
            rpID: process.env.DOMAIN_NAME || 'localhost',
            allowCredentials: [{
                id: user.passkey.credentialID,
                transports: user.passkey.transports as AuthenticatorTransportFuture[] | undefined,
            }],
        });
        user.currentChallenge = options.challenge;
        await user.save();
        return options;
    }

    async verifyPasskeyLoginResponse(email: string, response: any) {
        const user = await this.userModel.findOne({ email });
        if (!user || !user.passkey) throw new Error('User not found or no passkey');
        if (!user.currentChallenge) throw new Error('No challenge found');

        // ✅ Decode lại publicKey từ MongoDB Binary
        const publicKeyBuffer = user.passkey.publicKey.buffer as ArrayBuffer;
        const publicKeyUint8 = new Uint8Array(publicKeyBuffer);

        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: process.env.LINK_CLIENT || 'http://localhost:3000',
            expectedRPID: process.env.DOMAIN_NAME || 'localhost',
            credential: {
                id: user.passkey.credentialID,
                publicKey: publicKeyUint8,
                counter: user.passkey.counter,
                transports: user.passkey.transports as AuthenticatorTransportFuture[] | undefined,
            },
        });



        if (verification.verified) {
            user.passkey.counter = verification.authenticationInfo.newCounter;
            await user.save();
            const token = this.jwtService.sign({ id: user._id, role: user.role });
            return { verified: true, token };
        }
        user.currentChallenge = '';
        await user.save();
        return { verified: false };
    }


    generateActiveCode() {
        const random = Math.floor(100000 + Math.random() * 900000);
        return random.toString();
    }

    randomPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 6; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

}
