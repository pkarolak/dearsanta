"use client";

import { motion } from "motion/react";

/** The show's subtitle band, carrying a scene's heading and sentence. */
export function Caption({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-20 overflow-hidden"
      initial="hidden"
      whileInView="shown"
      viewport={{ amount: 0.5 }}
    >
      <motion.div
        className="bg-berry text-snow"
        variants={{ hidden: { y: "100%" }, shown: { y: 0 } }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-6 md:grid-cols-[1.1fr_1fr] md:items-end md:gap-12 md:px-8 md:py-9">
          <h2 className="font-display text-3xl font-black leading-[0.98] tracking-[-0.02em] md:text-[clamp(2.4rem,4vw,4rem)]">{title}</h2>
          <p className="max-w-xl text-base leading-relaxed text-snow/90 md:text-lg">{body}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
