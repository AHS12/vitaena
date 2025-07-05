import { useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
}

// Enhanced tablet detection
const detectTablet = (width: number, height: number): boolean => {
  // Check for touch capability
  const hasTouch = typeof window !== 'undefined' && (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    ((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0
  );

  // Check for tablet-specific user agent strings
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isTabletUserAgent = /tablet|ipad|playbook|silk|android.*tablet|galaxy tab|kindle|nook|xoom/.test(userAgent) ||
    (userAgent.includes('android') && !userAgent.includes('mobile'));

  // Screen size logic for tablets
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  // Tablet criteria:
  // 1. Has touch AND (specific tablet user agent OR larger screen size)
  // 2. Screen size between 600px and 1400px (wider range for modern tablets)
  // 3. Aspect ratio suggests tablet form factor
  if (hasTouch && isTabletUserAgent) {
    return true;
  }

  if (hasTouch && minDimension >= 600 && maxDimension <= 1400) {
    return true;
  }

  // For devices without obvious tablet indicators, use traditional breakpoints
  return width >= 600 && width < 1200 && !hasTouch;
};

export const useResponsive = (): ResponsiveInfo => {
  const theme = useTheme();

  // MUI breakpoints: xs: 0px, sm: 600px, md: 900px, lg: 1200px, xl: 1536px
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  // Get current screen dimensions
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced device type detection
  const isTabletDevice = detectTablet(dimensions.width, dimensions.height);

  // Mobile: xs (0-599px) AND not detected as tablet
  const isMobile = isXs && !isTabletDevice;

  // Tablet: detected as tablet device OR traditional tablet breakpoints
  const isTablet = isTabletDevice || (isSm || isMd);

  // Desktop: large screens AND not detected as tablet
  const isDesktop = (isLg || isXl) && !isTabletDevice;

  // Determine device type with enhanced logic
  const deviceType: DeviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  // Debug logging (can be removed later)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Device Detection:', {
        deviceType,
        dimensions,
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        userAgent: navigator.userAgent,
        isTabletDevice: isTabletDevice,
        breakpoints: { isXs, isSm, isMd, isLg, isXl }
      });
    }
  }, [deviceType, dimensions, isTabletDevice, isXs, isSm, isMd, isLg, isXl]);

  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
  };
};

// Additional utility hooks for specific device types
export const useIsMobile = (): boolean => {
  const { isMobile } = useResponsive();
  return isMobile;
};

export const useIsTablet = (): boolean => {
  const { isTablet } = useResponsive();
  return isTablet;
};

export const useIsDesktop = (): boolean => {
  const { isDesktop } = useResponsive();
  return isDesktop;
};

// Hook for checking if screen is mobile or tablet (useful for touch devices)
export const useIsTouchDevice = (): boolean => {
  const { isMobile, isTablet } = useResponsive();
  return isMobile || isTablet;
};

// Hook for checking if screen is tablet or desktop (useful for larger layouts)
export const useIsLargeScreen = (): boolean => {
  const { isTablet, isDesktop } = useResponsive();
  return isTablet || isDesktop;
};

// MUI-specific breakpoint hooks
export const useIsXs = (): boolean => {
  const { isXs } = useResponsive();
  return isXs;
};

export const useIsSm = (): boolean => {
  const { isSm } = useResponsive();
  return isSm;
};

export const useIsMd = (): boolean => {
  const { isMd } = useResponsive();
  return isMd;
};

export const useIsLg = (): boolean => {
  const { isLg } = useResponsive();
  return isLg;
};

export const useIsXl = (): boolean => {
  const { isXl } = useResponsive();
  return isXl;
};

// Hook for checking screen size comparisons using MUI breakpoints
export const useScreenSize = () => {
  const theme = useTheme();

  return {
    isUpSm: useMediaQuery(theme.breakpoints.up('sm')),
    isUpMd: useMediaQuery(theme.breakpoints.up('md')),
    isUpLg: useMediaQuery(theme.breakpoints.up('lg')),
    isUpXl: useMediaQuery(theme.breakpoints.up('xl')),
    isDownSm: useMediaQuery(theme.breakpoints.down('sm')),
    isDownMd: useMediaQuery(theme.breakpoints.down('md')),
    isDownLg: useMediaQuery(theme.breakpoints.down('lg')),
    isDownXl: useMediaQuery(theme.breakpoints.down('xl')),
    isBetweenSmMd: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isBetweenMdLg: useMediaQuery(theme.breakpoints.between('md', 'lg')),
  };
};
