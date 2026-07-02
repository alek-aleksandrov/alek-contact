import { Injectable } from "@nestjs/common";
import type { Item } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateItemDto } from "./dto/create-item.dto";

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Item[]> {
    const items = await this.prisma.item.findMany({
      orderBy: { createdAt: "desc" },
    });
    return items.map(serialize);
  }

  async create(dto: CreateItemDto): Promise<Item> {
    const item = await this.prisma.item.create({ data: { title: dto.title } });
    return serialize(item);
  }
}

/** Convert a Prisma row (Date) into the wire type (ISO string). */
function serialize(item: {
  id: string;
  title: string;
  createdAt: Date;
}): Item {
  return {
    id: item.id,
    title: item.title,
    createdAt: item.createdAt.toISOString(),
  };
}
