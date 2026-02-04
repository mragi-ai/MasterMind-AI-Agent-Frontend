import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

type TrainingResponseCardProps = {
  htmlContent: string;
  timestamp?: string;
};

// CSS styles for the training response card
const trainingResponseStyles = `
  .training-response {
    width: 100%;
  }
  
  .training-response .response-card {
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid hsl(var(--border));
    background: hsl(var(--card));
  }
  
  .training-response .summary-card {
    background: linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--accent) / 0.05));
    border-color: hsl(var(--primary) / 0.2);
  }
  
  .training-response .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: hsl(var(--primary) / 0.08);
    border-bottom: 1px solid hsl(var(--border) / 0.5);
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .training-response .card-header:hover {
    background: hsl(var(--primary) / 0.12);
  }
  
  .training-response .card-icon {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: hsl(var(--primary) / 0.15);
    border-radius: 10px;
  }
  
  .training-response .card-title {
    font-weight: 600;
    font-size: 1rem;
    color: hsl(var(--foreground));
    flex: 1;
  }
  
  .training-response .hide-details {
    font-size: 0.75rem;
    color: hsl(var(--muted-foreground));
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .training-response .card-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    padding: 16px;
    background: hsl(var(--primary) / 0.03);
    border-bottom: 1px solid hsl(var(--border) / 0.3);
  }
  
  .training-response .meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.8rem;
    color: hsl(var(--foreground) / 0.8);
  }
  
  .training-response .meta-item strong {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--muted-foreground));
    font-weight: 600;
  }
  
  .training-response .meta-icon {
    color: hsl(var(--primary));
    margin-right: 4px;
  }
  
  .training-response .card-content {
    padding: 16px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: hsl(var(--foreground));
  }
  
  .training-response .card-content p {
    margin-bottom: 8px;
  }
  
  .training-response .card-content p:last-child {
    margin-bottom: 0;
  }
  
  .training-response .card-content ul,
  .training-response .card-content ol {
    padding-left: 1.5rem;
    margin: 8px 0;
  }
  
  .training-response .card-content li {
    margin-bottom: 4px;
  }
  
  /* Collapsed state */
  .training-response .response-card.collapsed .card-meta,
  .training-response .response-card.collapsed .card-content {
    display: none;
  }
  
  .training-response .response-card.collapsed .hide-details {
    transform: rotate(180deg);
  }
`;

export default function TrainingResponseCard({ 
  htmlContent, 
  timestamp 
}: TrainingResponseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Process HTML to add click handling for expand/collapse
  const processedHtml = htmlContent
    // Replace "Hide details ▲" with our custom toggle
    .replace(
      /<span class="hide-details">.*?<\/span>/g, 
      `<span class="hide-details">${isExpanded ? 'Hide details' : 'Show details'}</span>`
    );

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Check if clicked on header or hide-details
    if (
      target.closest('.card-header') || 
      target.classList.contains('hide-details')
    ) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="w-full">
      {/* Inject styles */}
      <style dangerouslySetInnerHTML={{ __html: trainingResponseStyles }} />
      
      {/* Card header with training response label */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <div className="h-1 flex-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Training Response
        </span>
        <div className="h-1 flex-1 bg-gradient-to-l from-primary/50 to-accent/50 rounded-full" />
      </div>

      {/* Render the HTML content */}
      <div 
        onClick={handleClick}
        className={cn(
          "training-response-wrapper",
          !isExpanded && "[&_.card-meta]:hidden [&_.card-content]:hidden"
        )}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {/* Toggle button */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-full",
            "text-xs text-muted-foreground",
            "bg-muted/50 hover:bg-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show details
            </>
          )}
        </button>
      </div>

      {/* Timestamp */}
      {timestamp && (
        <div className="text-right mt-2">
          <span className="text-[10px] text-muted-foreground">{timestamp}</span>
        </div>
      )}
    </div>
  );
}

// Helper function to check if response contains training card HTML
export function isTrainingResponseHtml(answer: string): boolean {
  return answer.includes('class="training-response"') || 
         answer.includes('class="response-card"') ||
         answer.includes('class="card-header"');
}
