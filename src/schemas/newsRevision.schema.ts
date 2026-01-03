import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { News } from "./news.schema";

export enum NewsPriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    VERY_HIGH = 3,
}


@Schema({ timestamps: true })
export class NewsRevision extends BaseSchema {
    @Prop({ type: String, required: true, index: true, unique: true })
    slug: string;
    @Prop({ type: String, required: true })
    title: string;
    @Prop({ type: String, required: true })
    content: string;
    // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    // author: Types.ObjectId;
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true })
    news: Types.ObjectId;
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
    category: Types.ObjectId;
    @Prop({ type: String })
    featuredImage: string;
    @Prop({ type: String })
    summary: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ type: Number, default: 0 })
    views: number;

    @Prop({ type: Boolean, default: false })
    isFeatured: boolean;

    @Prop({ type: Boolean, default: true })
    isCanUndo: boolean;

    @Prop({ type: Number, enum: NewsPriority, default: NewsPriority.LOW })
    priorityInGlobal: NewsPriority;

    @Prop({ type: Number, enum: NewsPriority, default: NewsPriority.LOW })
    priorityInCategory: NewsPriority;

    @Prop({ type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'draft' })
    status: string;

    @Prop({ type: String, default: null })
    reason: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
    approvedBy: Types.ObjectId;

}

export const NewsRevisionSchema = SchemaFactory.createForClass(NewsRevision);
export type NewsRevisionDocument = HydratedDocument<NewsRevision>;


NewsRevisionSchema.index({
    title: "text",
    summary: "text",
    content: "text", // hoặc "content" nếu bạn chưa tách HTML
}, {
    weights: { title: 5, summary: 2, content: 1 }, // tuỳ chọn: trọng số
});