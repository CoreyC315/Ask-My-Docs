variable "prefix" {
  description = "Resource name prefix (project-environment)."
  type        = string
}

variable "location" {
  description = "Azure region for AI Search."
  type        = string
}

variable "openai_location" {
  description = "Azure region for the OpenAI account. GPT-4o and Ada are not available in every region."
  type        = string
}

variable "rg_name" {
  description = "Resource group name."
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources."
  type        = map(string)
}

variable "openai_capacity" {
  description = "OpenAI deployment capacity in thousands of tokens per minute."
  type        = number
}

variable "ai_search_sku" {
  description = "AI Search SKU: free (dev) or basic+ (prod)."
  type        = string
}
