# OpenAI account — the parent resource that holds both model deployments.
# "Cognitive account" is the underlying Azure resource type for all AI services
# including OpenAI. kind = "OpenAI" scopes it to the OpenAI APIs.
# custom_subdomain_name becomes part of the endpoint URL:
#   https://{custom_subdomain_name}.openai.azure.com/
resource "azurerm_cognitive_account" "openai" {
  name                  = "oai-${var.prefix}"
  location              = var.openai_location
  resource_group_name   = var.rg_name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = "oai-${var.prefix}"
  tags                  = var.tags
}

# GPT-4o deployment — the chat model that reads context and generates answers.
# "Deployment" in Azure OpenAI means a named instance of a model you can call.
# capacity is in thousands of tokens per minute (10 = 10K TPM).
resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-11-20"
  }

  scale {
    type     = "Standard"
    capacity = var.openai_capacity
  }
}

# Ada-002 embedding deployment — converts text (PDF chunks and user questions)
# into 1536-dimensional vectors. Vectors are what make semantic search work:
# instead of matching keywords, you find chunks whose meaning is closest to
# the question.
resource "azurerm_cognitive_deployment" "ada" {
  name                 = "text-embedding-ada-002"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "text-embedding-ada-002"
    version = "2"
  }

  scale {
    type     = "Standard"
    capacity = var.openai_capacity
  }
}

# AI Search service — stores the vector index and handles similarity queries.
# The ingest function pushes document chunks + their Ada vectors here.
# The query function searches it to find the most relevant chunks, then
# passes those chunks to GPT-4o as context.
resource "azurerm_search_service" "main" {
  name                = "srch-${var.prefix}"
  location            = var.location
  resource_group_name = var.rg_name
  sku                 = var.ai_search_sku
  tags                = var.tags
}
