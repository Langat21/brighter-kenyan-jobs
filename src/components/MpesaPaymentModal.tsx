import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { useMpesaPayment } from "@/lib/mpesa/useMpesaPayment";
import { isValidKenyanPhone, formatPhoneForDisplay } from "@/lib/mpesa/phoneUtils";
import { toast } from "sonner";

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  amountLabel?: string;
  onPaymentSuccess?: (transactionId: string) => void;
}

const phoneSchema = z.string().min(1, "Phone number is required").refine(isValidKenyanPhone, "Enter a valid Safaricom number (e.g. 0712345678)");

const MpesaPaymentModal = ({ isOpen, onClose, amount, amountLabel = "Weekly Subscription", onPaymentSuccess }: MpesaPaymentModalProps) => {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const { initiatePayment, paymentStatus, paymentResult, processingMessage, isProcessing, reset } = useMpesaPayment({
    onSuccess: (result) => {
      toast.success("Payment successful!", {
        description: `Transaction ID: ${result.transactionId}`,
      });
      onPaymentSuccess?.(result.transactionId || "");
    },
  });

  const handleClose = () => {
    if (!isProcessing) {
      reset();
      setPhone("");
      setPhoneError("");
      onClose();
    }
  };

  const handleSubmit = () => {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      setPhoneError(result.error.errors[0].message);
      return;
    }
    setPhoneError("");
    initiatePayment({ amount, phoneNumber: phone });
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">M-PESA Payment</DialogTitle>
          <DialogDescription>{amountLabel} — 7 days unlimited access</DialogDescription>
        </DialogHeader>

        {paymentStatus === "idle" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">{amountLabel}</p>
              <p className="text-2xl font-bold text-foreground">KES {amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Unlimited job applications for 7 days</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">Safaricom Phone Number</Label>
              <Input
                id="mpesa-phone"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                maxLength={13}
              />
              {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
            </div>
            <Button className="w-full bg-[hsl(var(--secondary))] text-secondary-foreground hover:opacity-90" onClick={handleSubmit}>
              Pay KES {amount.toLocaleString()} via M-PESA
            </Button>
          </div>
        )}

        {paymentStatus === "initiating" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{processingMessage}</p>
          </div>
        )}

        {paymentStatus === "pending" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <Smartphone className="h-12 w-12 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-secondary" />
              </span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Check your phone</p>
              <p className="text-sm text-muted-foreground">Enter your M-PESA PIN on {formatPhoneForDisplay(phone)}</p>
            </div>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-12 w-12 text-secondary" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Payment Successful!</p>
              {paymentResult?.transactionId && (
                <p className="text-xs text-muted-foreground mt-1">ID: {paymentResult.transactionId}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleClose}>Done</Button>
          </div>
        )}

        {(paymentStatus === "failed" || paymentStatus === "timeout") && (
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <p className="font-semibold text-foreground">
                {paymentStatus === "timeout" ? "Payment Timed Out" : "Payment Failed"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {paymentResult?.message || "Something went wrong. Please try again."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MpesaPaymentModal;
