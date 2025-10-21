import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import { HydratedDocument } from "mongoose";

export enum UserRole {
    USER = "user",
    ADMIN = "admin",
    EDITOR = "editor",
    CHIEF_EDITOR = "chief_editor"
    
}

@Schema({ timestamps: true })
export class User extends BaseSchema {
    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: String, required: true })
    password: string;

    @Prop({ type: String, required: true })
    userName: string;

    @Prop({ type: String})
    avatar: string;

    @Prop({ type: String, enum: UserRole, default: UserRole.USER })
    role: UserRole;
    
    @Prop({ type: Boolean, default: false })
    isActive: boolean;

    @Prop({ type: String, default:null})
    activeCode: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserDocument = HydratedDocument<User>;