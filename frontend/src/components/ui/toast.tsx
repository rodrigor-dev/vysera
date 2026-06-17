"use client";

import { toast as sonnerToast } from "sonner";
import type { ExternalToast } from "sonner";

type ToastProps = ExternalToast & {
  title: string;
  description?: string;
};

function toast({ title, description, ...props }: ToastProps) {
  return sonnerToast(title, {
    description,
    ...props,
  });
}

toast.success = (title: string, props?: ExternalToast) =>
  sonnerToast.success(title, {
    ...props,
    duration: 4000,
  });

toast.error = (title: string, props?: ExternalToast) =>
  sonnerToast.error(title, {
    ...props,
    duration: 6000,
  });

toast.info = (title: string, props?: ExternalToast) =>
  sonnerToast.info(title, {
    ...props,
    duration: 4000,
  });

toast.warning = (title: string, props?: ExternalToast) =>
  sonnerToast.warning(title, {
    ...props,
    duration: 5000,
  });

toast.dismiss = (id?: string | number) => sonnerToast.dismiss(id);

toast.loading = (title: string, props?: ExternalToast) =>
  sonnerToast.loading(title, props);

toast.promise = <T,>(
  promise: Promise<T>,
  msgs: {
    loading: string;
    success: string;
    error: string;
  },
  props?: ExternalToast,
) => sonnerToast.promise(promise, { ...msgs, ...props });

export { toast };
export type { ToastProps };
