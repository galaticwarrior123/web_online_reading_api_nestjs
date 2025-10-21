import { Prop } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";



export class BaseSchema {
    @Prop({ type: String, default: () => new mongoose.Types.ObjectId().toString(), unique: true })
    _id?: string;
    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}