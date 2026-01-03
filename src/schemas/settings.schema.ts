import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import { HydratedDocument } from "mongoose";


@Schema({ timestamps: true })
export class Settings extends BaseSchema {
    @Prop({ type: String, default:null })
    logo: string;

    @Prop({ type: String, default:null })
    iconLogo: string;

    @Prop({ type: String, default:null })
    nameWebsite: string;

    @Prop({ type: String, default:null })
    descriptionWebsite: string;

    @Prop({ type: String, default:null })
    emailWebsite: string;

    @Prop({ type: String, default:null })
    phoneWebsite: string;

    @Prop({ type: String, default:null })
    noImagePreview: string;

}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

export type SettingsDocument = HydratedDocument<Settings>;