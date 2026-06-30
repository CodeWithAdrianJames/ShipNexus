terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment this block when you're ready to store state remotely in S3
  # backend "s3" {
  #   bucket         = "shipnexus-terraform-state"
  #   key            = "shipnexus/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "shipnexus-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  # Skip credential validation for local terraform plan
  # Remove these three lines when running against real AWS
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  default_tags {
    tags = {
      Project     = "shipnexus"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}