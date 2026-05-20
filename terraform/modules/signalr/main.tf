# SignalR streams GPT-4o token-by-token responses to the browser in real time.
# Without it, the frontend would have to wait for the full response before
# displaying anything — a bad experience for a chat app.
# The query function holds a server-side SignalR connection and pushes each
# token as it arrives from OpenAI. The browser receives them over WebSocket.
resource "azurerm_signalr_service" "main" {
  name                = "sigr-${var.prefix}"
  location            = var.location
  resource_group_name = var.rg_name
  tags                = var.tags

  sku {
    name     = var.sku
    capacity = 1
  }

  # Serverless mode lets the Function App push messages without maintaining
  # a persistent connection — the function just sends and exits.
  service_mode = "Serverless"

  cors {
    allowed_origins = ["*"]
  }
}
