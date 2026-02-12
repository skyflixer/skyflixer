import { useState, useEffect, useCallback } from "react";

interface UseScrollOptions {
  threshold?: number;
}

export function useScroll(options: UseScrollOptions = {}) {
  const { threshold = 50 } = options;
  
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  
  const lastScrollY = useState(0)[0];

  useEffect(() => {
    let lastY = 0;
    
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      setScrollY(currentY);
      setIsScrolled(currentY > threshold);
      
      if (currentY > lastY) {
        setScrollDirection("down");
      } else if (currentY < lastY) {
        setScrollDirection("up");
      }
      
      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    scrollY,
    isScrolled,
    scrollDirection,
    scrollToTop,
  };
}
