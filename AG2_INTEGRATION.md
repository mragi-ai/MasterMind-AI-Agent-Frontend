# AG2 Voice Chat Integration

## Summary
Successfully integrated AG2 voice chat client into the DemoCall component while preserving the existing UI.

## Changes Made

### 1. Added AG2 Client Library (`index.html`)
- Added the AG2 client script from GitHub releases (v0.3.1)
- Script is loaded before the main application bundle

```html
<script src="https://github.com/ag2ai/ag2-js-client/releases/download/v0.3.1/index.global.js"></script>
```

### 2. Updated DemoCall Component (`src/pages/DemoCall.tsx`)

#### Replaced Custom WebSocket Implementation
- **Removed**: Complex audio processing with AudioContext, ScriptProcessorNode, manual PCM16 conversion, resampling logic
- **Added**: Simple AG2 client integration that handles all audio processing internally

#### Key Changes:
- **WebSocket URL**: Now uses dynamic host detection (`ws://localhost:5050/media-stream` or `ws://${hostname}:5050/media-stream`)
- **Audio Client**: Replaced custom WebSocket with AG2's `WebsocketAudio` client
- **Simplified Logic**: Reduced ~400 lines of complex audio code to ~30 lines using AG2 client

#### State Management (Preserved):
- `isCallActive`: Tracks if call is active
- `isMuted`: Microphone mute state (UI only, AG2 handles internally)
- `isSpeakerOn`: Speaker state (UI only, AG2 handles internally)  
- `callDuration`: Call timer (preserved)
- `connectionStatus`: Connection status tracking

#### Methods Updated:
- `handleStartCall()`: Now initializes AG2 client and starts connection
- `handleEndCall()`: Stops AG2 client and cleans up
- `toggleMute()`: UI state only (AG2 handles audio internally)
- `toggleSpeaker()`: UI state only (AG2 handles audio internally)

## UI Preserved
All existing UI components remain unchanged:
- Call interface layout
- Avatar/Profile section with animated rings
- Call status indicators
- Control buttons (Mute, End Call, Speaker)
- Connection status cards
- Info cards at bottom
- Gradient background animations
- Timer display
- All styling and animations

## Server Requirements
- AG2 server must be running on port `5050`
- Endpoint: `/media-stream`
- The client will connect to the same hostname as the web app is served from

## Testing the Integration
1. Ensure AG2 server is running on `localhost:5050` (or your server's hostname)
2. Start the React application
3. Navigate to Demo Roles and select a role
4. Click "Start Call" button
5. Allow microphone permissions when prompted
6. Speak to test the voice chat
7. Use controls to test mute/speaker toggles
8. Click "Stop Voice Chat" to end the call

## Future Enhancements
- Implement actual mute/unmute functionality if AG2 client supports it
- Implement speaker volume control if AG2 client supports it
- Add error handling for specific AG2 error types
- Add reconnection logic if connection drops
- Display transcript or agent responses in UI

## Notes
- The AG2 client library handles all audio capture, encoding, streaming, and playback
- Mute and speaker buttons currently only update UI state (AG2 manages audio internally)
- Connection status accurately reflects AG2 client state
- Error messages provide helpful feedback to users
