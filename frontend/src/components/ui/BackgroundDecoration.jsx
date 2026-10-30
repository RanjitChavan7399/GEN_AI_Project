import React from 'react';
import { motion } from 'framer-motion';

export const BackgroundDecoration = ({ dark = false }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Animated Gradient Mesh Layer */}
      <div className={`absolute inset-0 ${dark ? 'animated-mesh-dark' : 'animated-mesh-bg'} opacity-90`} />

      {/* Floating Luminous Gradient Orb 1 */}
      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -50, 40, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="bg-orb-1 top-[-100px] left-[-50px]"
      />

      {/* Floating Luminous Gradient Orb 2 */}
      <motion.div
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 60, -30, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="bg-orb-2 bottom-[-150px] right-[-100px]"
      />

      {/* Floating 3D-inspired Translucent Ring 1 */}
      <motion.div
        animate={{
          rotate: 360,
          y: [0, -20, 0],
        }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: "linear" },
          y: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full border border-[#10B981]/20 border-dashed opacity-40"
      />

      {/* Floating 3D-inspired Translucent Ring 2 */}
      <motion.div
        animate={{
          rotate: -360,
          x: [0, 25, 0],
        }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          x: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute bottom-[25%] left-[5%] w-96 h-96 rounded-full border-2 border-[#D9F99D]/15 opacity-30"
      />
    </div>
  );
};
