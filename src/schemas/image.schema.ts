import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { Type } from "@nestjs/common";

enum ImageStatus {
    PENDING = 'pending',
    TRAINED = "trained",
}

enum ImageType {
    SAFE = 'safe',
    SENSITIVE = 'sensitive',
}


@Schema({timestamps: true})
export class Image extends BaseSchema {
    @Prop({type: String, required: true})
    url: string;
    @Prop({type: mongoose.Types.ObjectId, ref: 'User', default: null})
    sender: Types.ObjectId | null; 

    @Prop({type: mongoose.Types.ObjectId, ref: 'User', required: true})
    receiver: Types.ObjectId | null;

    @Prop({type: String, required: true, enum: ImageType})
    type: ImageType;

    @Prop({type: mongoose.Types.ObjectId, ref: 'News', required: true})
    news: Types.ObjectId | null;

    @Prop({type: String, enum: ImageStatus, default: ImageStatus.PENDING})
    status: ImageStatus;

    @Prop({type: String, default: null})
    rejectReason: string | null;
}


export const ImageSchema = SchemaFactory.createForClass(Image);

export type ImageDocument = HydratedDocument<Image>;