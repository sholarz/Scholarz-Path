import { api } from './client';

export const subscribeToPremium = async (payload: {
  payment_method: string;
  payment_details?: Record<string, unknown>;
  plan_id?: string;
}) => {
  return api.post('/subscriptions/subscribe', payload);
};

export const getCurrentSubscription = async () => {
  return api.get('/subscriptions/current');
};

export const getSubscriptionPlans = async () => {
  return api.get('/subscriptions/plans');
};
