

# M-PESA Payment Integration Plan

## Overview

Integrate your existing M-PESA payment code (from your other app) into BrighterJobs. This connects to your Render-hosted backend at `mpesabackend-production.onrender.com` -- no new secrets or edge functions needed since the backend already handles Daraja API credentials.

## Files to Create

### 1. `src/lib/mpesa/types.ts`
- Payment type definitions: `PaymentStatusType`, `PaymentResult`, `InitiatePaymentParams`, `MpesaPaymentConfig`, `MpesaPaymentModalProps`

### 2. `src/lib/mpesa/phoneUtils.ts`  
- `normalizePhoneNumber()` -- converts 07XX/01XX/+254 formats to 254XXXXXXXXX
- `isValidKenyanPhone()` -- validates Safaricom number format
- `formatPhoneForDisplay()` -- formats as +254 7XX XXX XXX

### 3. `src/lib/mpesa/useMpesaPayment.ts`
- The `useMpesaPayment` hook from your code, configured with:
  - `backendUrl`: `https://mpesabackend-production.onrender.com/mpesa`
  - `stkPushPath`: `/jobifystkpush` (reusing your existing endpoint)
  - `statusPath`: `/status`
  - Polling logic (5s intervals, 20 max attempts)

### 4. `src/components/MpesaPaymentModal.tsx`
- A dialog modal with 4 states:
  - **idle**: Phone number input with Kenyan format validation (zod), amount display
  - **initiating**: "Connecting to M-Pesa..." spinner
  - **pending**: "Check your phone -- enter M-PESA PIN" with animated indicator
  - **success**: Green checkmark, transaction ID display
  - **failed/timeout**: Error message with "Try Again" button
- Uses existing `Dialog` component from `src/components/ui/dialog.tsx`

## Files to Modify

### 5. `src/pages/JobDetail.tsx`
- Import `useMpesaPayment` and `MpesaPaymentModal`
- Wire the "Apply Now -- KES 99" button to open the payment modal
- Wire the "subscribe for KES 499/mo" button to open modal with subscription amount
- On payment success, show a toast confirmation via sonner

## Payment Flow

```text
User clicks "Apply Now - KES 99"
         |
         v
  Payment Modal opens (phone input)
         |
         v
  User enters phone -> Validate -> POST to Render backend /jobifystkpush
         |
         v
  STK Push sent -> Modal shows "Check your phone"
         |
         v
  Poll /status/{checkoutId} every 5s (max 20 attempts)
         |
    +----+----+
    |         |
 Success    Failed/Timeout
    |         |
 Toast +    Show error +
 close      retry option
 modal
```

## Job Scraper Instructions

Since scrapers need to run server-side on a schedule (not in-browser), here are ready-to-use instructions for setting up a Python scraper you run yourself (e.g., on your Render server or a cron job):

The plan will include a detailed scraper guide covering:

- **BrighterMonday** (`brightermonday.co.ke`): Scrape `/jobs` pages using BeautifulSoup; job cards have structured data in `div.search-result` elements
- **MyJobMag** (`myjobmag.co.ke`): Scrape `/jobs-in-kenya` listings  
- **LinkedIn**: Use the LinkedIn Jobs API or scrape public `/jobs/search` with location=Kenya filter (rate-limited, use delays)
- **Fuzu** (`fuzu.com`): Scrape `/kenya/jobs` listings

The scraper writes results to your database via a simple POST endpoint or direct Supabase insert. A sample Python script with `requests` + `BeautifulSoup` and a cron schedule suggestion will be provided as a markdown guide in `docs/SCRAPER_GUIDE.md`.

## Technical Details

- No new npm dependencies needed (all UI components already exist)
- Phone validation uses `zod` (already installed)
- The backend URL points to your existing Render deployment -- no Lovable Cloud secrets required for this
- Toast notifications use the existing `sonner` integration
