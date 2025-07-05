# Claude Clone - Full-Featured AI Assistant

A complete clone of Claude's interface with all functionality, using Anthropic's API with pay-as-you-go pricing instead of subscriptions. Built with React, TypeScript, Node.js, and WebSocket for real-time streaming.

## Features

- 🤖 **Full Claude Functionality**
  - Real-time streaming responses with WebSocket
  - Support for all Claude models (Sonnet, Opus, Haiku)
  - Extended thinking mode for Claude 3.5 Sonnet
  - File attachments and image support
  - Conversation history and management

- 🔍 **Research Capabilities**
  - Web search integration
  - Deep research mode with source extraction
  - Content summarization from multiple sources

- 💰 **Pay-As-You-Go Pricing**
  - Real-time cost tracking per message
  - Total conversation cost display
  - Transparent pricing information

- 🎨 **Modern UI/UX**
  - Beautiful Claude-inspired interface
  - Dark/light mode support
  - Markdown rendering with syntax highlighting
  - Responsive design for all devices

- 💾 **Data Management**
  - Export conversations as Markdown
  - Conversation search and filtering
  - Auto-save functionality

## Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([Get one here](https://console.anthropic.com/))
- (Optional) Google Custom Search API key for enhanced research

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd claude-clone
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your API keys:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # Optional for web search
   SEARCH_API_KEY=your_google_api_key
   SEARCH_ENGINE_ID=your_search_engine_id
   ```

4. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3001
   - Frontend on http://localhost:5173

## Usage

### Basic Chat

1. Click "New Chat" to start a conversation
2. Type your message and press Enter or click Send
3. Watch as Claude streams the response in real-time
4. View token usage and cost after each message

### Advanced Features

- **Model Selection**: Click the model selector in the top-right to choose between Sonnet, Opus, or Haiku
- **Extended Thinking**: Enable in Settings to see Claude's reasoning process (Sonnet only)
- **File Attachments**: Click the paperclip icon or drag & drop files into the chat
- **Research Mode**: Click the search icon to access web search and deep research capabilities
- **Export Conversations**: Hover over a conversation in the sidebar and click the download icon

### Settings

Navigate to Settings to:
- Adjust temperature (creativity level)
- Set max tokens (response length)
- Enable/disable extended thinking
- View pricing information

## API Costs

Current Anthropic API pricing (as of late 2024):

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

The app tracks costs in real-time and displays them after each message.

## Architecture

### Backend (Node.js + Express)
- RESTful API for conversation management
- WebSocket server for real-time streaming
- Integration with Anthropic SDK
- Web scraping for research capabilities
- File upload handling

### Frontend (React + TypeScript)
- Zustand for state management
- TailwindCSS for styling
- React Router for navigation
- Socket.io client for WebSocket
- React Markdown for rendering

## Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Route pages
│   │   ├── services/     # API services
│   │   └── stores/       # Zustand stores
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── middleware/   # Express middleware
```

### Adding Features

1. **New API Endpoint**: Add route in `server/src/routes/`
2. **New UI Component**: Add in `client/src/components/`
3. **State Management**: Update stores in `client/src/stores/`

## Security Notes

- Never commit your `.env` file with real API keys
- In production, store API keys securely on the server
- Implement rate limiting for API endpoints
- Add authentication for multi-user scenarios

## Troubleshooting

### Common Issues

1. **"Cannot connect to server"**
   - Ensure the backend is running on port 3001
   - Check if the port is already in use

2. **"Invalid API key"**
   - Verify your Anthropic API key in `.env`
   - Ensure there are no extra spaces

3. **WebSocket connection fails**
   - Check if your firewall allows WebSocket connections
   - Try disabling browser extensions

### Debug Mode

Set `NODE_ENV=development` in your `.env` file for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Anthropic's Claude API
- Inspired by the official Claude interface
- Uses various open-source libraries (see package.json)

## Disclaimer

This is an unofficial clone for educational purposes. Not affiliated with Anthropic.