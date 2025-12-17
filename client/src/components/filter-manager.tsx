import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Shield } from "lucide-react";
import type { ContentFilter } from "@shared/schema";

interface FilterManagerProps {
  filters: ContentFilter[];
  onAddFilter: (keyword: string) => void;
  onRemoveFilter: (filterId: string) => void;
}

export function FilterManager({ filters, onAddFilter, onRemoveFilter }: FilterManagerProps) {
  const [newKeyword, setNewKeyword] = useState("");

  const handleAddFilter = () => {
    if (newKeyword.trim()) {
      onAddFilter(newKeyword.trim().toLowerCase());
      setNewKeyword("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddFilter();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Shield className="w-5 h-5" />
          🚫 Content Filters
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Hide posts containing these keywords from your feed
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Filter Input */}
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter keyword to filter..."
            className="flex-1 bg-white border-gray-300 text-black placeholder-gray-500"
          />
          <Button
            onClick={handleAddFilter}
            disabled={!newKeyword.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Filters */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Active Filters ({filters.length})
          </h4>
          {filters.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No filters set. All posts will be visible.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="destructive"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer group"
                  onClick={() => onRemoveFilter(filter.id)}
                >
                  {filter.keyword}
                  <X className="w-3 h-3 ml-1 group-hover:scale-110 transition-transform" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-muted/30 border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Filters are case-insensitive and will hide any post 
            containing these keywords. Add filters for topics you'd rather not see in your feed.
          </p>
        </div>

        {/* Common Filter Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Common Filters
          </h4>
          <div className="flex flex-wrap gap-2">
            {["drama", "politics", "negative", "spam", "toxic", "hate"].map((suggestion) => {
              const alreadyFiltered = filters.some(f => f.keyword === suggestion);
              return (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => !alreadyFiltered && onAddFilter(suggestion)}
                  disabled={alreadyFiltered}
                  className={`text-xs ${alreadyFiltered 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                  }`}
                >
                  {alreadyFiltered ? '✓ ' : '+ '}{suggestion}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
