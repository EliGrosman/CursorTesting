# 🚀 Quick Start Guide

Get your Claude Clone running in under 5 minutes!

## Prerequisites

1. **Node.js 18+** installed ([Download here](https://nodejs.org/))
2. **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

## 3-Step Setup

### Step 1: Clone and Navigate
```bash
git clone <repository-url>
cd claude-clone
```

### Step 2: Add Your API Key
Edit `server/.env` and replace `your_anthropic_api_key_here` with your actual API key:
```bash
# Open the file in your editor
nano server/.env
# OR
code server/.env
```

### Step 3: Start the App
```bash
./start.sh
```

That's it! 🎉

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## First Chat

1. The app will open automatically in your browser
2. Click "New Chat"
3. Type a message and press Enter
4. Watch Claude respond in real-time!

## Features to Try

- 🎨 **Dark Mode**: Click the moon icon in the sidebar
- 🤖 **Change Models**: Use the dropdown in the top-right
- 📎 **Attach Files**: Drag & drop or click the paperclip
- 🔍 **Research Mode**: Click the search icon
- 💭 **Thinking Mode**: Enable in Settings (Sonnet only)
- 💾 **Export Chat**: Hover over a conversation → Download icon

## Troubleshooting

**"API Key Invalid"**
- Double-check your key in `server/.env`
- Ensure no extra spaces or quotes

**"Cannot connect"**
- Make sure both servers are running
- Check if ports 3001 and 5173 are free

**Need help?** Check the full README.md or open an issue!

---

💡 **Pro Tip**: The app shows real-time costs after each message, so you can track your API usage!