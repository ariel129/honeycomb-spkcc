export const Base64Utils = {
  glyphs: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=',
  fromNumber: (number: number) => {
    if (
      isNaN(Number(number)) ||
      number === null ||
      number === Number.POSITIVE_INFINITY
    )
      throw 'The input is not valid';

    if (number < 0) throw "Can't represent negative numbers now";
    let char;
    let residual = Math.floor(number);
    let result = '';

    while (true) {
      char = residual % 64;
      result = Base64Utils.glyphs.charAt(char) + result;
      residual = Math.floor(residual / 64);
      if (residual == 0) break;
    }

    return result;
  },
  toNumber: (chars: any) => {
    let result = 0;

    chars = chars.split('');

    for (var e = 0; e < chars.length; e++) {
      result = result * 64 + Base64Utils.glyphs.indexOf(chars[e]);
    }
    return result;
  },
  fromFlags: (flags: any) => {
    let result = 0;
    let last = 1;

    for (let i = 0; i < flags.length; i++) {
      result = result + last * flags[i];
      last = last * 2;
    }

    return Base64Utils.fromNumber(result);
  },
  toFlags: (chars: any) => {
    const result = [];
    chars = chars.split('');

    for (let j = 0; j < chars.length; j++) {
      for (let i = 32; i >= 1; i = i / 2) {
        if (Base64Utils.glyphs.indexOf(chars[j]) >= i) {
          result.unshift(1);
          chars[j] = Base64Utils.glyphs[Base64Utils.glyphs.indexOf(chars[j]) - i];
        } else {
          result.unshift(0);
        }
      }
    }

    return result;
  },
};
