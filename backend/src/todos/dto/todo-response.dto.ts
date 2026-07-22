import { ApiProperty } from '@nestjs/swagger';

// Documents the response shape for Swagger; controllers return the Todo
// entity directly since it has no fields that need hiding from clients.
export class TodoResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Buy milk' })
  title: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
