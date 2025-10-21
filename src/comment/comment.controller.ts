import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentCreateDto } from './dtos/commentCreate.dto';
import { ReactionDataDto } from './dtos/reactionData.dto';
import { AuthGuard } from 'src/auth/auth.guard';


@Controller('api/comment')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @Post("/create")
    @UseGuards(AuthGuard)
    async createComment(@Body() commentCreateDto: CommentCreateDto){
        return this.commentService.create(commentCreateDto);
    }


    @Get("/:slug")
    async getComment(@Param("slug") slug: string) {
        return this.commentService.findBySlug(slug);
    }

    @Post("/reaction")
    @UseGuards(AuthGuard)
    async selectReactionComment(@Body() reactionDataDto: ReactionDataDto){
        return this.commentService.selectReactionComment(reactionDataDto);
    }
}
