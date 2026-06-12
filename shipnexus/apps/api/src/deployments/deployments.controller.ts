import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DeploymentsService }    from './deployments.service';
import { CreateDeploymentDto }   from './dto/create-deployment.dto';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDeploymentDto: CreateDeploymentDto) {
    return this.deploymentsService.create(createDeploymentDto);
  }

  @Get()
  findAll() {
    return this.deploymentsService.findAll();
  }
}