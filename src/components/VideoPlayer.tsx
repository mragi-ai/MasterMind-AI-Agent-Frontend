import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type VideoPlayerProps = {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  initialTimestamp?: number;
};

export type VideoPlayerRef = {
  jumpToTimestamp: (timestamp: number) => void;
  play: () => void;
  pause: () => void;
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  videoId,
  onTimeUpdate,
  initialTimestamp = 0,
}, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const initializePlayer = () => {
    if (!containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        start: Math.floor(initialTimestamp),
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handlePlayerStateChange,
      },
    });
  };

  const handlePlayerReady = () => {
    setIsReady(true);
    setDuration(playerRef.current.getDuration());
    
    // Set up interval to update current time
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 100);

    return () => clearInterval(interval);
  };

  const handlePlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (
      event.data === window.YT.PlayerState.PAUSED ||
      event.data === window.YT.PlayerState.ENDED
    ) {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(value[0], true);
    setCurrentTime(value[0]);
  };

  const toggleFullscreen = () => {
    const player = playerRef.current?.getIframe();
    if (!player) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      player.requestFullscreen?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const jumpToTimestamp = (timestamp: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(timestamp, true);
    setCurrentTime(timestamp);
  };

  const play = () => {
    if (!playerRef.current) return;
    playerRef.current.playVideo();
  };

  const pause = () => {
    if (!playerRef.current) return;
    playerRef.current.pauseVideo();
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    jumpToTimestamp,
    play,
    pause,
  }));

  // Jump to initial timestamp when ready
  useEffect(() => {
    if (isReady && initialTimestamp > 0) {
      jumpToTimestamp(initialTimestamp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, initialTimestamp]);

  return (
    <div className="w-full space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
        <div
          ref={containerRef}
          className="absolute inset-0"
          id={`youtube-player-${videoId}`}
        />
        
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Custom Controls */}
      <div className="space-y-3 rounded-2xl border border-border/50 bg-background/90 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-sm font-medium text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={!isReady}
              className="h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              disabled={!isReady}
              className="h-10 w-10"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            disabled={!isReady}
            className="h-10 w-10"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;

