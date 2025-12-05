import { useState, FormEvent } from "react";
import { Search, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranscriptSegment, TranscriptSearchResult } from "@/lib/api/endpoints/videos";

type TranscriptSearchProps = {
  videoId: string;
  transcript?: TranscriptSegment[];
  onTimestampClick: (timestamp: number) => void;
  currentTime?: number;
};

export default function TranscriptSearch({
  videoId,
  transcript = [],
  onTimestampClick,
  currentTime = 0,
}: TranscriptSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState<TranscriptSegment[]>(transcript);
  const [isSearching, setIsSearching] = useState(false);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    performSearch(searchQuery);
  };

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredResults(transcript);
      return;
    }

    setIsSearching(true);
    
    // Filter transcript segments based on search query
    const results = transcript.filter((segment) =>
      segment.text.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredResults(results);
    setIsSearching(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-primary/30 text-primary font-semibold rounded px-1">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  const isCurrentSegment = (segment: TranscriptSegment) => {
    return currentTime >= segment.start && currentTime < segment.start + segment.duration;
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Search Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Transcript & Search</h3>
          <Badge variant="outline" className="text-xs">
            {filteredResults.length} {filteredResults.length === 1 ? "segment" : "segments"}
          </Badge>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                performSearch(e.target.value);
              }}
              placeholder="Search in transcript..."
              className="h-10 rounded-xl border-border/70 bg-background pl-10 text-sm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-10 rounded-xl px-4"
            disabled={isSearching}
          >
            Search
          </Button>
        </form>

        {searchQuery && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredResults.length === 0
                ? "No results found"
                : `Found ${filteredResults.length} ${
                    filteredResults.length === 1 ? "match" : "matches"
                  }`}
            </span>
            {filteredResults.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilteredResults(transcript);
                }}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Transcript Results */}
      <ScrollArea className="flex-1 rounded-2xl border border-border/50 bg-background/50">
        <div className="space-y-2 p-4">
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {searchQuery ? "No matches found" : "No transcript available"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try different keywords"
                    : "Transcript will appear here when available"}
                </p>
              </div>
            </div>
          ) : (
            filteredResults.map((segment, index) => {
              const isCurrent = isCurrentSegment(segment);
              
              return (
                <button
                  key={`${segment.start}-${index}`}
                  onClick={() => onTimestampClick(segment.start)}
                  className={`group w-full rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:bg-primary/5 ${
                    isCurrent
                      ? "border-primary/50 bg-primary/10 shadow-sm"
                      : "border-border/40 bg-background/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 min-w-[4rem] items-center justify-center rounded-lg border text-xs font-medium ${
                        isCurrent
                          ? "border-primary/50 bg-primary/20 text-primary"
                          : "border-border/50 bg-muted/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                      }`}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTimestamp(segment.start)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={`text-sm leading-relaxed ${
                          isCurrent ? "font-medium text-foreground" : "text-foreground/90"
                        }`}
                      >
                        {highlightText(segment.text, searchQuery)}
                      </p>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-xs text-primary"
                        >
                          Currently playing
                        </Badge>
                      )}
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1 ${
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Quick Stats */}
      {filteredResults.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{transcript.length}</span> total
              segments
            </span>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatTimestamp(transcript[transcript.length - 1]?.start || 0)}
              </span>{" "}
              duration
            </span>
          </div>
          <span className="text-muted-foreground">Click any segment to jump</span>
        </div>
      )}
    </div>
  );
}

