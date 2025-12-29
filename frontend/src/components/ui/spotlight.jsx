"use client";
import React, { useRef, useState, useCallback } from "react";
import { motion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export const Spotlight = ({ className, fill }) => {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute z-[1] h-[169%] w-[138%] opacity-0 lg:w-[84%]",
        "animate-spotlight",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.56899 -0.56899 0.822377 3631.88 2291.09)"
          fill={fill || "white"}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_1065_8" />
        </filter>
      </defs>
    </svg>
  );
};

export const CardSpotlight = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const divRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    const mouseX = useSpring(0, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 100 });

    const handleMouseMove = useCallback(
      (event) => {
        const { left, top } = divRef.current?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
        };
        const x = event.clientX - left;
        const y = event.clientY - top;
        mouseX.set(x);
        mouseY.set(y);
        setMousePosition({ x, y });
      },
      [mouseX, mouseY]
    );

    return (
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "group relative rounded-xl border border-border bg-card p-6 transition-all duration-300",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          className
        )}
        {...props}
      >
        {/* Spotlight gradient overlay */}
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: isHovering
              ? `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.15), transparent 80%)`
              : "none",
          }}
        />
        
        {/* Inner glow on hover */}
        {isHovering && (
          <div
            className="pointer-events-none absolute -inset-px rounded-xl transition duration-300"
            style={{
              background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.25), transparent 60%)`,
            }}
          />
        )}
        
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

CardSpotlight.displayName = "CardSpotlight";
