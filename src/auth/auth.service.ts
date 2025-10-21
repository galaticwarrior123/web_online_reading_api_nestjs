import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'src/schemas/user.schema';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { LoginDto } from './dtos/login.dto';

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

        isBanned === true ? user.isActive = true : user.isActive = false;

        await user.save();

        return user;
    }

    generateActiveCode() {
        const random = Math.floor(100000 + Math.random() * 900000);
        return random.toString();
    }

}
