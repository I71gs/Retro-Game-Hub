import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async getCatalog() {
    return this.prisma.storeItem.findMany();
  }

  async getUserInventory(userId: string) {
    return this.prisma.userInventory.findMany({
      where: { userId },
      include: { storeItem: true },
    });
  }

  async purchaseItem(userId: string, storeItemId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const item = await this.prisma.storeItem.findUnique({ where: { id: storeItemId } });
    if (!item) throw new NotFoundException('Store item not found');

    const alreadyOwned = await this.prisma.userInventory.findUnique({
      where: { userId_storeItemId: { userId, storeItemId } },
    });
    if (alreadyOwned) throw new BadRequestException('Item already purchased');

    if (user.coins < item.price) {
      throw new BadRequestException('Insufficient coins');
    }

    // Deduct coins & grant item
    await this.prisma.user.update({
      where: { id: userId },
      data: { coins: user.coins - item.price },
    });

    return this.prisma.userInventory.create({
      data: { userId, storeItemId },
      include: { storeItem: true },
    });
  }
}
