import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { StoreService } from './store.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get all purchasable store items' })
  async getCatalog() {
    return this.storeService.getCatalog();
  }

  @Get('inventory/:userId')
  @ApiOperation({ summary: 'Get user purchased inventory' })
  async getInventory(@Param('userId') userId: string) {
    return this.storeService.getUserInventory(userId);
  }

  @Post('buy')
  @ApiOperation({ summary: 'Purchase an item with coins' })
  async buyItem(@Body() body: { userId: string; itemId: string }) {
    return this.storeService.purchaseItem(body.userId, body.itemId);
  }
}
