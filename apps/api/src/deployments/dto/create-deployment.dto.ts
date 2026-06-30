import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  serviceName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  imageTag: string;

  @IsOptional()
  @IsString()
  @IsIn(['production', 'staging', 'development'])
  environment?: string = 'production';

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  triggeredBy: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  webhookEventId?: string;

  @IsOptional()
  payload?: Record<string, unknown>;
}
