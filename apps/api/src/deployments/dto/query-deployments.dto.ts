import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  deploymentStatusEnum,
  type DeploymentStatus,
} from '../../database/schema';

export class QueryDeploymentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(deploymentStatusEnum.enumValues)
  status?: DeploymentStatus;
}
