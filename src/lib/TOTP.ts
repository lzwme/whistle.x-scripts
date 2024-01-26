/*
 * @Author: bellstrand
 * @Date: 2024-02-05 11:03:02
 * @LastEditors: renxia
 * @LastEditTime: 2024-02-05 13:55:59
 * @Description:
 * @see https://github.com/bellstrand/totp-generator/blob/master/src/index.ts
 */

import { createHmac } from 'crypto';

/**
 * @param {string} [digits=6]
 * @param {string} [algorithm="SHA-1"]
 * @param {string} [period=30]
 * @param {string} [timestamp=Date.now()]
 */
export type TOTPOptions = {
  digits?: number;
  algorithm?: 'SHA-1' | 'SHA-224' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA3-224' | 'SHA3-256' | 'SHA3-384' | 'SHA3-512';
  period?: number;
  timestamp?: number;
};

/**  generate TOTP tokens from a TOTP key */
export class TOTP {
  static generate(key: string, options?: TOTPOptions) {
    const _options: Required<TOTPOptions> = { digits: 6, algorithm: 'SHA-1', period: 30, timestamp: Date.now(), ...options };
    const epoch = Math.floor(_options.timestamp / 1000);
    const time = this.leftpad(this.dec2hex(Math.floor(epoch / _options.period)), 16, '0');
    const hmac = createHmac(_options.algorithm, Buffer.from(this.base32tohex(key), 'hex'))
      .update(Buffer.from(time, 'hex'))
      .digest('hex');
    const offset = this.hex2dec(hmac.slice(-1)) * 2;
    let otp = (this.hex2dec(hmac.slice(offset, offset + 8)) & this.hex2dec('7fffffff')) + '';
    const start = Math.max(otp.length - _options.digits, 0);
    otp = otp.slice(start, start + _options.digits);
    const expires = Math.ceil((_options.timestamp + 1) / (_options.period * 1000)) * _options.period * 1000;
    return { otp, expires };
  }
  private static hex2dec(hex: string) {
    return Number.parseInt(hex, 16);
  }
  private static dec2hex(dec: number) {
    return (dec < 15.5 ? '0' : '') + Math.round(dec).toString(16);
  }
  private static base32tohex(base32: string) {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let hex = '';

    const _base32 = base32.replace(/=+$/, '');

    for (let i = 0; i < _base32.length; i++) {
      const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
      if (val === -1) throw new Error('Invalid base32 character in key');
      bits += this.leftpad(val.toString(2), 5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
      const chunk = bits.slice(i, i + 8);
      hex = hex + this.leftpad(Number.parseInt(chunk, 2).toString(16), 2, '0');
    }
    return hex;
  }

  private static leftpad(str: string, len: number, pad: string) {
    if (len + 1 >= str.length) {
      str = Array.from({ length: len + 1 - str.length }).join(pad) + str;
    }
    return str;
  }
}
