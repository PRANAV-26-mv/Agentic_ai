import QRCode from 'qrcode';

/**
 * Builds the canonical QR value for an attendance OTP session.
 * Encodes a direct URL that opens the student attendance page with the code query parameter.
 */
export const buildAttendanceQrPayload = (code: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/attendance?code=${code}`;
};

/**
 * Generates a high-definition base64 PNG data URL of the QR code.
 */
export const generateAttendanceQr = async (code: string, size = 320): Promise<string> => {
  const payload = buildAttendanceQrPayload(code);
  return await QRCode.toDataURL(payload, {
    width: size,
    margin: 2,
    color: {
      dark: '#090d16',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
};

/**
 * Downloads the generated QR code as a PNG file.
 */
export const downloadQrImage = (code: string, dataUrl: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `attendance_qr_${code}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Extracts a 6-digit numeric OTP from any scanned payload (URL, JSON, prefixed string, or plain digits).
 */
export const extractNumericOtp = (raw: string): string | null => {
  if (!raw) return null;
  const str = raw.trim();

  // 1. Check URL format e.g. /attendance?code=748291
  if (str.includes('code=')) {
    try {
      const url = new URL(str.startsWith('http') ? str : `http://dummy.com${str.startsWith('/') ? '' : '/'}${str}`);
      const codeParam = url.searchParams.get('code');
      if (codeParam && /^\d{6}$/.test(codeParam)) {
        return codeParam;
      }
    } catch {
      const match = str.match(/code=([0-9]{6})/i);
      if (match) return match[1];
    }
  }

  // 2. Check JSON string format e.g. {"code":"748291"}
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed.code && /^\d{6}$/.test(String(parsed.code))) {
        return String(parsed.code);
      }
    } catch {}
  }

  // 3. Regex match any 6 consecutive digits
  const digitMatch = str.match(/\b\d{6}\b/);
  if (digitMatch) {
    return digitMatch[0];
  }

  // 4. Fallback: clean non-digits
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length === 6) {
    return digitsOnly;
  }

  return null;
};

/**
 * Plays a pleasant success chime using the Web Audio API without any external assets.
 */
export const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.18);

    // Note 2: B5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.38);
  } catch {
    // Ignore audio errors on autoplay-restricted devices
  }
};
