import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateItemDto } from "./dto/create-item.dto";
import { ItemsService } from "./items.service";

@Controller("items")
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  findAll() {
    return this.items.findAll();
  }

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.items.create(dto);
  }
}
