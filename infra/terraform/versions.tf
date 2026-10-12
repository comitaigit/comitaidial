terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State lives in a private, versioned S3 bucket (it holds generated secrets
  # — DB password, JWT keys — so it must never sit only on someone's laptop or
  # in git). The bucket name isn't hardcoded; pass it at init time:
  #   terraform init -backend-config="bucket=comitai-tfstate-<aws-account-id>"
  # Each workspace (dev/prod) gets its own state object under env:/<workspace>/.
  backend "s3" {
    key    = "comitai/terraform.tfstate"
    region = "sa-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = terraform.workspace
      ManagedBy   = "terraform"
    }
  }
}
