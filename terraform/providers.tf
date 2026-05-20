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
      # Set to false so `terraform destroy` can delete the resource group even
      # if Azure auto-created resources inside it (e.g. App Insights Smart Detection).
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azuread" {}
