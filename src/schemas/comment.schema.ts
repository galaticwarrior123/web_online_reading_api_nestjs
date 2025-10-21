import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import mongoose, { Types } from "mongoose";


@Schema({ timestamps: true })
export class Comment extends BaseSchema {
    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: mongoose.Types.ObjectId, ref: 'News', required: true })
    news: Types.ObjectId;

    @Prop({ type: mongoose.Types.ObjectId, ref: 'Comment', default: null })
    parentComment?: Types.ObjectId;

    @Prop({
        type: Map,
        of: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
        default: {}
    })
    reactions: Map<string, Types.ObjectId[]>;

    replies?: Comment[]; // virtual field

}

export const CommentSchema = SchemaFactory.createForClass(Comment);
export type CommentDocument = mongoose.HydratedDocument<Comment>;


CommentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment',
});

CommentSchema.set('toObject', { virtuals: true });
CommentSchema.set('toJSON', { virtuals: true });