import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);

        // If Lenis is active, force it to scroll to top immediately
        if ((window as any).lenis) {
            (window as any).lenis.scrollTo(0, { immediate: true });
        }
    }, [pathname]);

    return null;
}
