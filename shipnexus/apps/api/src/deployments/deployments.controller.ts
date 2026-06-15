import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DeploymentsService }  from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { GithubWebhookGuard }  from './guards/github-webhook.guard';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(GithubWebhookGuard)
  create(@Body() createDeploymentDto: CreateDeploymentDto) {
    return this.deploymentsService.create(createDeploymentDto);
  }

  @Get()
  findAll() {
    return this.deploymentsService.findAll();
  }
}