import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentsDto } from './dto/query-deployments.dto';
import { GithubWebhookGuard } from './guards/github-webhook.guard';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.CREATED)
  trigger(@Body() createDeploymentDto: CreateDeploymentDto) {
    return this.deploymentsService.create(createDeploymentDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(GithubWebhookGuard)
  create(@Body() createDeploymentDto: CreateDeploymentDto) {
    return this.deploymentsService.create(createDeploymentDto);
  }

  @Get()
  findAll(@Query() query: QueryDeploymentsDto) {
    return this.deploymentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deploymentsService.findOne(id);
  }
}
