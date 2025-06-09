import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function AnalyticsCard({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
}: AnalyticsCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend !== 'neutral' && (
            <span className={`ml-1 ${trendColors[trend]}`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}