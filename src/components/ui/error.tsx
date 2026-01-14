import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="max-w-md mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {description}
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto max-w-sm">
        <div className="rounded-full bg-muted p-6 mb-4">
          <div className="text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>
        {action && <Button onClick={action.onClick}>{action.label}</Button>}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto max-w-sm">
        <div className="rounded-full bg-muted p-6 mb-4">
          <div className="text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Page not found</h3>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button onClick={() => window.history.back()}>Go back</Button>
      </div>
    </div>
  );
}
