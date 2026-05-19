variable "project" {
  description = "Short project name, used as a prefix on every resource."
  type        = string
  default     = "askmydocs"
}

variable "environment" {
  description = "Deployment environment: dev, staging, or prod."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "eastus"
}

variable "openai_location" {
  description = "Azure region for the OpenAI account. GPT-4o and Ada are not available in every region."
  type        = string
  default     = "eastus"
}

# Naming helper — produces a consistent short suffix like "askmydocs-dev"
locals {
  prefix = "${var.project}-${var.environment}"
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }
}
