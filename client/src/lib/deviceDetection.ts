// Device detection utilities

export interface DeviceInfo {
  isApple: boolean;
  isIOS: boolean;
  isMac: boolean;
  isAndroid: boolean;
  deviceType: 'iPhone' | 'iPad' | 'iPod' | 'Mac' | 'Android' | 'Windows' | 'Other';
  appStoreUrl: string;
  downloadText: string;
}

/**
 * Detect the user's device type and return relevant information
 */
export const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  
  const isIPhone = /iPhone/.test(userAgent);
  const isIPad = /iPad/.test(userAgent);
  const isIPod = /iPod/.test(userAgent);
  const isMac = /Mac/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isWindows = /Windows/.test(userAgent);
  
  const isApple = isIPhone || isIPad || isIPod || isMac;
  const isIOS = isIPhone || isIPad || isIPod;
  
  let deviceType: DeviceInfo['deviceType'] = 'Other';
  if (isIPhone) deviceType = 'iPhone';
  else if (isIPad) deviceType = 'iPad';
  else if (isIPod) deviceType = 'iPod';
  else if (isMac) deviceType = 'Mac';
  else if (isAndroid) deviceType = 'Android';
  else if (isWindows) deviceType = 'Windows';
  
  // Determine app store URL and download text based on device
  let appStoreUrl: string;
  let downloadText: string;
  
  // All devices link to the main website
  appStoreUrl = 'https://mykliq.app';
  downloadText = 'join MyKliq at https://mykliq.app';
  
  return {
    isApple,
    isIOS,
    isMac,
    isAndroid,
    deviceType,
    appStoreUrl,
    downloadText
  };
};

/**
 * Get a formatted invite message based on the user's device
 */
export const getInviteMessage = (firstName: string, inviteCode: string): string => {
  const device = detectDevice();
  
  return `${firstName} wants you to join their Kliq. Use the following Invite Code ${inviteCode} and ${device.downloadText} - "A Different Social Experience"`;
};

/**
 * Get the app store URL for the current device
 */
export const getAppStoreUrl = (): string => {
  const device = detectDevice();
  return device.appStoreUrl;
};

/**
 * Get device-specific download text
 */
export const getDownloadText = (): string => {
  const device = detectDevice();
  return device.downloadText;
};