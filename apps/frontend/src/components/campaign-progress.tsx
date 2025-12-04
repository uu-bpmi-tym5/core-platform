import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, TrendingUp } from 'lucide-react';

interface CampaignProgressProps {
  goal: number;
  currentAmount: number;
  contributorsCount: number;
  daysRemaining: number | null;
  className?: string;
}

export function CampaignProgress({
  goal,
  currentAmount,
  contributorsCount,
  daysRemaining,
  className,
}: CampaignProgressProps) {
  const percentage = Math.min(100, Math.max(0, (currentAmount / goal) * 100));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-primary">
            ${currentAmount.toLocaleString()} raised
          </span>
          <span className="text-muted-foreground">
            {percentage.toFixed(0)}% of ${goal.toLocaleString()}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-lg">
          <Users className="h-4 w-4 mb-1 text-muted-foreground" />
          <span className="text-lg font-bold">{contributorsCount}</span>
          <span className="text-xs text-muted-foreground">Backers</span>
        </div>

        <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-lg">
          <Clock className="h-4 w-4 mb-1 text-muted-foreground" />
          <span className="text-lg font-bold">
            {daysRemaining !== null ? daysRemaining : '∞'}
          </span>
          <span className="text-xs text-muted-foreground">Days Left</span>
        </div>

        <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-lg">
          <TrendingUp className="h-4 w-4 mb-1 text-muted-foreground" />
          <span className="text-lg font-bold">
             {percentage >= 100 ? 'Funded' : 'Active'}
          </span>
          <span className="text-xs text-muted-foreground">Status</span>
        </div>
      </div>
    </div>
  );
}
