import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class Category extends BaseSchema {
    @Prop({
        type: {
            vi: { type: String, required: true },
            en: { type: String, required: true },
        },
    })
    name: { vi: string; en: string };

    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @Prop({ type: String, required: true, unique: true })
    slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

export type CategoryDocument = HydratedDocument<Category>;

