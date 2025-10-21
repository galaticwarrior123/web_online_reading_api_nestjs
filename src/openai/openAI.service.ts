import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY, // nhớ đặt trong .env
        });
    }

    async translateViToEn(text: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini", // nhẹ và nhanh
            messages: [
                { role: "system", content: "You are a translator. Translate Vietnamese to English, only output the translation text." },
                { role: "user", content: text },
            ],
        });

        return response.choices[0].message.content?.trim() || text;
    }

    async extractTags(text: string): Promise<string[]> {
        const response = await this.client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a tag extractor. Extract relevant tags from the given text. Only output a comma-separated list of tags without any additional text." },
                { role: "user", content: text },
            ],
        });

        return response.choices[0].message.content?.trim().split(",") || [];
    }
}