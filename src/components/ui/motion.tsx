"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { ReactNode } from "react";

// Common animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Reusable motion components
interface MotionDivProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "fadeInUp" | "fadeIn" | "slideInFromRight" | "slideInFromLeft" | "scaleIn";
  delay?: number;
}

export function MotionDiv({ children, variant = "fadeInUp", delay = 0, ...props }: MotionDivProps) {
  const variants = {
    fadeInUp,
    fadeIn,
    slideInFromRight,
    slideInFromLeft,
    scaleIn,
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[variant]}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export function StaggerContainer({ children, ...props }: StaggerContainerProps) {
  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} {...props}>
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export function StaggerItem({ children, ...props }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}

// Hover animations
export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

// Tap animations
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};
