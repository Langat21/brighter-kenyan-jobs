/** M-Pesa payment status */
export type PaymentStatusType = "idle" | "initiating" | "pending" | "success" | "failed" | "timeout";

/** Result returned from status polling */
export interface PaymentResult {
  status: PaymentStatusType;
  message?: string;
  transactionId?: string;
}

/** Parameters for initiating a payment */
export interface InitiatePaymentParams {
  amount: number;
  phoneNumber: string;
  paymentId?: string;
}

/** Configuration for the useMpesaPayment hook */
export interface MpesaPaymentConfig {
  backendUrl?: string;
  stkPushPath?: string;
  statusPath?: string;
  pollingIntervalMs?: number;
  maxPollingAttempts?: number;
  onSuccess?: (result: PaymentResult) => void;
  onFailure?: (result: PaymentResult) => void;
  onTimeout?: () => void;
}

/** Props for MpesaPaymentModal */
export interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  amountLabel?: string;
}
