import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        {Icon && <Icon className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />}
        <div className="space-y-1">
          <h2 className="font-medium">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actionLabel && actionTo && (
          <Button asChild>
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        )}
        {actionLabel && onAction && !actionTo && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
