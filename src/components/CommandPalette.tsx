import { useEffect, useState } from 'react';
import { Command } from 'lucide-react';

type PaletteItem = {
  id: string;
  label: string;
  hint?: string;
  onSelect: () => void;
};

type Props = {
  items: PaletteItem[];
};

export default function CommandPalette({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filtered = items.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.hint?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: PaletteItem) => {
    item.onSelect();
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-[min(600px,90vw)] z-50">
        <div className="command-palette animate-scale-in">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Command className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
            
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 rounded-lg text-left hover:bg-accent transition-colors group"
              >
                <div className="font-medium text-sm group-hover:text-primary transition-colors">
                  {item.label}
                </div>
                {item.hint && (
                  <div className="text-xs text-muted-foreground mt-1">{item.hint}</div>
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 text-[10px] bg-background rounded border border-border">⌘K</kbd> or <kbd className="px-1.5 py-0.5 text-[10px] bg-background rounded border border-border">Ctrl+K</kbd> anytime to open
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
