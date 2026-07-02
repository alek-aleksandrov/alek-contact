import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import type { CreateItemInput } from "@repo/shared";

export class CreateItemDto implements CreateItemInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;
}
