export function getFormattedNumber(num: number, digit: number = 2) {
  const signBit = num > 0 ? 1 : -1;
  const nature = Math.abs(num);

  if (nature < 1e4) {
    return {
      number: signBit * parseFloat(nature.toFixed(digit)),
      unit: ''
    }
  }
  else if (num < 1e8) {
    return {
      number: signBit * parseFloat((nature / 1e4).toFixed(digit)),
      unit: 'w'
    }
  }
  else {
    return {
      number: signBit * parseFloat((nature / 1e8).toFixed(digit)),
      unit: 'e',
    }
  }
}

export function getFormattedNumberStr(num: number | undefined, digit: number = 2) {
  if(num === undefined){
    return '';
  }

  const formattedPrice = getFormattedNumber(num, digit);

  return formattedPrice.number + formattedPrice.unit;
}