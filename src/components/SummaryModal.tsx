import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';

interface DailySummaryModalProps {
  stats: {
    archived: number;
    pending: number;
    date: string;
  } | null;
  onClose: () => void;
}

export function DailySummaryModal({ stats, onClose }: DailySummaryModalProps) {
  if (!stats) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-2xl z-10"
        >
          <div className="absolute top-3 right-3">
             <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <X size={18} />
             </button>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight mb-2">Daily Summary</h2>
            <p className="text-muted-foreground mb-8">
              Work from <span className="text-foreground font-medium">{stats.date}</span> has been processed and archived.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-muted/30 p-4 rounded-xl border">
                <p className="text-2xl font-bold text-primary">{stats.archived}</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Completed</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border">
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Carried Over</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              Continue to Today
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
