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
  Headers,
} from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { QueryDeploymentsDto } from './dto/query-deployments.dto';
import { GithubWebhookGuard } from './guards/github-webhook.guard';
import { mapGithubWebhookToDeployment } from './github-webhook.mapper';

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
  create(
    @Body() body: unknown,
    @Headers('x-github-event') githubEvent?: string,
    @Headers('x-github-delivery') githubDelivery?: string,
  ) {
    if (githubEvent) {
      const deployment = mapGithubWebhookToDeployment(
        githubEvent,
        githubDelivery,
        body,
      );

      if (!deployment) {
        return {
          received: true,
          event: githubEvent,
          deliveryId: githubDelivery,
        };
      }

      return this.deploymentsService.create(deployment);
    }

    return this.deploymentsService.create(body as CreateDeploymentDto);
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
