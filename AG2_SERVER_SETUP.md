# AG2 Server Setup Guide

## Current Issue
The WebSocket connection is failing because there's no AG2 server running at the configured address.

**Error**: `WebSocket connection to 'ws://192.168.3.199:5050/media-stream' failed`

## Solution Options

### Option 1: Run AG2 Server (Recommended)

You need to run an AG2 voice server that handles the WebSocket connections. The server should:
- Listen on port `5050`
- Accept WebSocket connections at `/media-stream`
- Handle audio streaming with the AG2 protocol

**Steps:**
1. Install AG2 server dependencies (Python)
2. Start the AG2 voice server
3. Ensure it's listening on `ws://192.168.3.199:5050/media-stream`

### Option 2: Use Your Original Server

If you have your original voice server running on `ws://192.168.3.199:3000/media-stream`, you can either:

#### A. Keep Using Custom Implementation
Revert to your original code that had custom WebSocket handling (before AG2 integration)

#### B. Update AG2 Server URL
Change the server URL in `src/pages/DemoCall.tsx`:

```typescript
// Change this line:
const WEBSOCKET_URL = "ws://192.168.3.199:5050/media-stream";

// To match your server:
const WEBSOCKET_URL = "ws://192.168.3.199:3000/media-stream";
```

**IMPORTANT**: Your server at port 3000 must support the AG2 WebSocket protocol for this to work.

### Option 3: Run AG2 Server Locally

If you want to run the AG2 server on your local machine:

```typescript
// Update the URL in src/pages/DemoCall.tsx to:
const WEBSOCKET_URL = "ws://localhost:5050/media-stream";
```

Then start your AG2 server locally on port 5050.

## Server Requirements

The AG2 server must:
1. ✅ Accept WebSocket connections
2. ✅ Handle real-time audio streaming
3. ✅ Support the AG2 audio protocol
4. ✅ Process voice input and generate responses
5. ✅ Stream audio responses back to the client

## Testing the Connection

1. **Check if server is running:**
   ```bash
   # Try to connect with curl or wscat
   wscat -c ws://192.168.3.199:5050/media-stream
   ```

2. **Check if port is open:**
   ```bash
   nc -zv 192.168.3.199 5050
   ```

3. **View browser console:**
   - Open Developer Tools (F12)
   - Check Console tab for connection errors
   - Look for "WebSocket connected" success message

## Quick Fix: Update Server Address

Open `src/pages/DemoCall.tsx` and update line 17:

```typescript
// Current setting (update this to match YOUR server):
const WEBSOCKET_URL = "ws://192.168.3.199:5050/media-stream";
```

**Common configurations:**
- Local development: `ws://localhost:5050/media-stream`
- Your network: `ws://192.168.3.199:5050/media-stream`
- Production: `wss://your-domain.com/media-stream` (use `wss://` for secure connections)

## Troubleshooting

### Error: "Connection timeout - Server not responding"
- The server is not running or not reachable
- Check firewall settings
- Verify the IP address and port

### Error: "WebSocket connection failed"
- Server is not listening on the specified port
- Wrong URL or port number
- Network connectivity issues

### AG2 Library Loaded But Not Connecting
- Server might not support AG2 protocol
- Check server logs for errors
- Verify WebSocket endpoint path

## Need Help?

1. **Do you have an AG2 server?** 
   - If NO: You need to set up an AG2 server first
   - If YES: Update the WEBSOCKET_URL to match your server address

2. **Is your server at port 3000?**
   - Change `5050` to `3000` in the WEBSOCKET_URL
   - BUT: Ensure your server supports AG2 protocol

3. **Want to use your original implementation?**
   - Let me know and I can help revert to the custom WebSocket code
