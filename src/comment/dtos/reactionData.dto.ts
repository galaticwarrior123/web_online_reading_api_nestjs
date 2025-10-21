import { IsString } from "class-validator";




export class ReactionDataDto {
    @IsString()
    reactionType: string;
    @IsString()
    user: string;
    @IsString()
    commentId: string;
     
}