import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class ViewLog {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
    user: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true })
    news: Types.ObjectId;

    @Prop({ type: Number, default: 0 }) // thời gian đọc tính bằng giây
    duration: number;

    @Prop({ type:Boolean, default: false })
    isFinal: boolean;

    @Prop({ type: String }) // có thể lưu địa chỉ IP hoặc session ID
    sessionId: string;

    @Prop({ type: String })
    userAgent: string;
}

export const ViewLogSchema = SchemaFactory.createForClass(ViewLog);
export type ViewLogDocument = HydratedDocument<ViewLog>;
