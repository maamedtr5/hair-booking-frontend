//src/components/ui/icons.ts
import {
  Check,
  X,
  Info,
  AlertTriangle,
  Loader,
  Trash,
  Edit,
  Calendar,
  CreditCard,
} from "lucide-react";

// Centralized icon registry
export const Icons = {
  success: Check,
  error: X,
  info: Info,
  warning: AlertTriangle,
  spinner: Loader,
  delete: Trash,
  edit: Edit,
  calendar: Calendar,
  payment: CreditCard,
};
