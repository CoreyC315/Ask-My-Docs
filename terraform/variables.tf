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

locals {
  prefix = "${var.project}-${var.environment}"

  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }

  # SKU map — setting environment = "dev" picks the free/cheap tier automatically.
  # Override individual values by editing this block; everything downstream
  # references local.skus.* so the change propagates to every module.
  skus = {
    # F1 is free shared infrastructure — no VM quota required, unblocks new subscriptions.
    # Upgrade to B1 once Azure approves a quota increase for the subscription.
    # P1v3 is the recommended production starting point.
    app_service_plan = var.environment == "prod" ? "P1v3" : "F1"

    # AI Search free tier: 1 index, 50MB — enough for dev with a handful of PDFs.
    # basic is the cheapest paid tier and supports managed identity auth.
    ai_search = var.environment == "prod" ? "basic" : "free"

    # SignalR free tier: 20 concurrent connections, 20K messages/day — fine for dev.
    signalr = var.environment == "prod" ? "Standard" : "Free"

    # OpenAI deployment capacity in thousands of tokens per minute.
    # 10 is the minimum and plenty for interactive dev/test use.
    openai_capacity = var.environment == "prod" ? 30 : 10

    # Log Analytics retention. Minimum billable period is 30 days.
    log_retention_days = var.environment == "prod" ? 90 : 30
  }
}
