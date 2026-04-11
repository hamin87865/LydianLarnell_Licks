import { toast } from "sonner";

type NotifyOptions = {
  description?: string;
};

export function notifySuccess(message: string, options?: NotifyOptions) {
  toast.success(message, options);
}

export function notifyError(message: string, options?: NotifyOptions) {
  toast.error(message, options);
}

export function notifyInfo(message: string, options?: NotifyOptions) {
  toast(message, options);
}
