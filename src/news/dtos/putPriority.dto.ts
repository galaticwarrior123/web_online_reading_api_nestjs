import { IsNumber } from "class-validator";



export class PutPriorityDto {
    @IsNumber()
    priorityInGlobal: number;

    @IsNumber()
    priorityInCategory: number;

}