import { useEffect, useState } from "react";

/** Reserve space on signup for the existing fixed iOS installation banner. */
export function useInstallBannerInset() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    let observed: Element | null = null;
    const resize = new ResizeObserver(() => measure());
    const measure = () => {
      const banner = document.querySelector("[data-pwa-install-banner]");
      if (banner !== observed) {
        resize.disconnect();
        observed = banner;
        if (banner) resize.observe(banner);
      }
      setHeight(banner ? Math.max(0, banner.getBoundingClientRect().bottom) : 0);
    };
    // The banner can appear after signup mounts, or expand into instructions.
    const mutations = new MutationObserver(measure);
    mutations.observe(document.body, { childList: true, subtree: true });
    measure();
    return () => {
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return height;
}
