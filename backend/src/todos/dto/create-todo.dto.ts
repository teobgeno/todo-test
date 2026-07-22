import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ maxLength: 255, example: 'Buy milk' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
