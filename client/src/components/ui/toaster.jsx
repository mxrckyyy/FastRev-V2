import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { Toast, ToastProvider, ToastViewport } from './toast';
import { useToast } from '@/lib/toast';

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          title={t.title}
          description={t.description}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
      <ToastViewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:max-w-[420px] sm:flex-col" />
    </ToastProvider>
  );
}
