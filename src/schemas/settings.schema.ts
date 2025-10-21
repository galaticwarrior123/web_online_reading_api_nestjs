import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import { HydratedDocument } from "mongoose";


@Schema({ timestamps: true })
export class Settings extends BaseSchema {
    @Prop({ type: String, required: true })
    logo: string;

}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

export type SettingsDocument = HydratedDocument<Settings>;