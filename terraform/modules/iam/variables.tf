variable "principal_id" {
  description = "Principal ID of the managed identity that needs access to Azure services."
  type        = string
}

variable "storage_account_id" {
  description = "Resource ID of the storage account."
  type        = string
}

variable "search_service_id" {
  description = "Resource ID of the AI Search service."
  type        = string
}
