import { useState, useCallback, useRef } from "react";
import type { MpesaPaymentConfig, PaymentResult, PaymentStatusType, InitiatePaymentParams } from "./types";
import { normalizePhoneNumber } from "./phoneUtils";

const DEFAULT_BACKEND_URL = "https://mpesabackend-production.onrender.com/mpesa";
const DEFAULT_STK_PATH = "/jobifystkpush";
const DEFAULT_STATUS_PATH = "/status";

export const useMpesaPayment = (config: MpesaPaymentConfig = {}) => {
  const {
    backendUrl = DEFAULT_BACKEND_URL,
    stkPushPath = DEFAULT_STK_PATH,
    statusPath = DEFAULT_STATUS_PATH,
    pollingIntervalMs = 5000,
    maxPollingAttempts = 20,
    onSuccess,
    onFailure,
    onTimeout,
  } = config;

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>("idle");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [processingMessage, setProcessingMessage] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    attemptRef.current = 0;
  }, []);

  const checkStatus = useCallback(async (checkoutId: string): Promise<PaymentResult> => {
    try {
      const res = await fetch(`${backendUrl}${statusPath}/${checkoutId}`);
      if (!res.ok) return { status: "pending" };
      const data = await res.json();

      if (data.status === "completed" || data.status === "success" || data.ResultCode === 0 || data.ResultCode === "0") {
        return {
          status: "success",
          message: "Payment completed successfully",
          transactionId: data.transactionId || data.MpesaReceiptNumber || data.CheckoutRequestID,
        };
      }

      if (data.status === "failed" || data.status === "cancelled" ||
          (data.ResultCode && data.ResultCode !== "0" && data.ResultCode !== 0)) {
        return {
          status: "failed",
          message: data.message || data.ResultDesc || "Payment was cancelled or failed",
        };
      }

      return { status: "pending" };
    } catch {
      return { status: "pending" };
    }
  }, [backendUrl, statusPath]);

  const startPolling = useCallback((checkoutId: string) => {
    attemptRef.current = 0;
    const poll = async () => {
      attemptRef.current += 1;
      const result = await checkStatus(checkoutId);

      if (result.status === "success") {
        stopPolling();
        setPaymentStatus("success");
        setPaymentResult(result);
        onSuccess?.(result);
        return;
      }

      if (result.status === "failed") {
        stopPolling();
        setPaymentStatus("failed");
        setPaymentResult(result);
        onFailure?.(result);
        return;
      }

      if (attemptRef.current >= maxPollingAttempts) {
        stopPolling();
        const timeoutResult: PaymentResult = { status: "timeout", message: "Payment verification timed out" };
        setPaymentStatus("timeout");
        setPaymentResult(timeoutResult);
        onTimeout?.();
      }
    };

    poll();
    pollingRef.current = setInterval(poll, pollingIntervalMs);
  }, [checkStatus, stopPolling, maxPollingAttempts, pollingIntervalMs, onSuccess, onFailure, onTimeout]);

  const initiatePayment = useCallback(async (params: InitiatePaymentParams) => {
    const normalizedPhone = normalizePhoneNumber(params.phoneNumber);
    setPaymentStatus("initiating");
    setProcessingMessage("Connecting to M-Pesa...");
    setPaymentResult(null);

    try {
      const res = await fetch(`${backendUrl}${stkPushPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: params.amount,
          phoneNumber: normalizedPhone,
          paymentId: params.paymentId || `PAY_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        const checkoutId = data.data?.checkoutId || `TXN_${Date.now()}`;
        setPaymentStatus("pending");
        setProcessingMessage("Waiting for payment confirmation...");
        startPolling(checkoutId);
        return { success: true, checkoutId };
      } else {
        const failResult: PaymentResult = {
          status: "failed",
          message: data.message || "Failed to initiate M-Pesa payment.",
        };
        setPaymentStatus("failed");
        setPaymentResult(failResult);
        setProcessingMessage("");
        onFailure?.(failResult);
        return { success: false, message: failResult.message };
      }
    } catch {
      const errorResult: PaymentResult = {
        status: "failed",
        message: "Network error. Please check your connection and try again.",
      };
      setPaymentStatus("failed");
      setPaymentResult(errorResult);
      setProcessingMessage("");
      onFailure?.(errorResult);
      return { success: false, message: errorResult.message };
    }
  }, [backendUrl, stkPushPath, startPolling, onFailure]);

  const reset = useCallback(() => {
    stopPolling();
    setPaymentStatus("idle");
    setPaymentResult(null);
    setProcessingMessage("");
  }, [stopPolling]);

  return {
    initiatePayment,
    paymentStatus,
    paymentResult,
    processingMessage,
    isProcessing: paymentStatus === "initiating" || paymentStatus === "pending",
    reset,
  };
};
