import { CheckCircle, Crown, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'motion/react';

interface PaymentSuccessProps {
  onClose: () => void;
}

export function PaymentSuccess({ onClose }: PaymentSuccessProps) {
  return (
    <div className="py-8 text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="flex justify-center"
      >
        <div className="relative">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <div className="bg-yellow-400 p-2 rounded-full">
              <Crown className="w-6 h-6 text-yellow-900" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <div className="space-y-2">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold"
        >
          Welcome to Premium! 🎉
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          Your payment was successful and your premium features are now active!
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 p-6 rounded-lg border border-yellow-200"
      >
        <div className="flex items-center gap-2 justify-center mb-4">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
            Premium Benefits Unlocked
          </h4>
        </div>
        <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
          <li className="flex items-center gap-2 justify-center">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Unlimited scholarship bookmarks
          </li>
          <li className="flex items-center gap-2 justify-center">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Full access to preparation timeline
          </li>
          <li className="flex items-center gap-2 justify-center">
            <CheckCircle className="w-4 h-4 shrink-0" />
            All test simulations unlocked
          </li>
          <li className="flex items-center gap-2 justify-center">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Priority support
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button onClick={onClose} size="lg" className="w-full gap-2">
          <Crown className="w-5 h-5" />
          Start Exploring Premium Features
        </Button>
      </motion.div>

      <p className="text-xs text-muted-foreground">
        A confirmation email has been sent to your registered email address
      </p>
    </div>
  );
}
