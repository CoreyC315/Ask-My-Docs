terraform {
  required_version = ">= 1.7"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.110"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.53"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state in Azure Blob Storage.
  # Before running `terraform init`, create this storage account manually
  # (or via a bootstrap script) — it can't manage the bucket that holds its own state.
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "staskmydocstfstate"
    container_name       = "tfstate"
    key                  = "askmydocs.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      # Keep secrets in Key Vault recoverable for 7 days after deletion.
      # This prevents accidental permanent loss of secrets.
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      # Prevent Terraform from deleting a resource group that still has
      # resources in it — a safeguard against `terraform destroy` accidents.
      prevent_deletion_if_contains_resources = true
    }
  }
}

provider "azuread" {}
