'use client';

import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

export default function OrientationGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col items-center text-white"
    >
      <motion.div
        animate={{ rotate: [0, 0, 90, 90, 0] }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.2, 0.5, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
      >
        <Smartphone size={64} />
      </motion.div>
      <p className="mt-4 text-lg">Ruota il dispositivo</p>
    </motion.div>
  );
} 