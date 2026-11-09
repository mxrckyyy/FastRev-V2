import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = ToastPrimitive.Viewport;

const variantStyles = {
  default: 'border-border bg-card text-card-foreground',
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
};

const variantIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const Toast = React.forwardRef(({ className, variant = 'default', title, description, onDismiss, ...props }, ref) => {
  const Icon = variantIcons[variant];
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0" />}
      <div className="flex-1 space-y-1">
        {title && <ToastPrimitive.Title className="text-sm font-semibold">{title}</ToastPrimitive.Title>}
        {description && <ToastPrimitive.Description className="text-sm opacity-90">{description}</ToastPrimitive.Description>}
      </div>
      <ToastPrimitive.Close
        className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = 'Toast';

export { Toast, ToastProvider, ToastViewport };
