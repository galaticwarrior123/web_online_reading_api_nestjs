import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import mongoose, { HydratedDocument, Types } from "mongoose";


@Schema({ timestamps: true })
export class Notification extends BaseSchema {
    @Prop({ type: String, required: true })
    title: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    sender: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    receiver: Types.ObjectId;

    @Prop({ type: String, default: null })
    thumbnail: string;

    @Prop({ type: String, default: null })
    link: string;

    @Prop({ type: Boolean, default: false })
    isReaded: boolean;

}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

export type NotificationDocument = HydratedDocument<Notification>;