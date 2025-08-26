import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_your_stripe_publishable_key_here",
  {
    locale: 'en'
  }
);

export default stripePromise;

// Stripe configuration
export const stripeConfig = {
  publishableKey:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_your_stripe_publishable_key_here",
  currency: "thb",
  successUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
    : "http://localhost:3000/payment/success",
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`
    : "http://localhost:3000/payment/cancel",
};
