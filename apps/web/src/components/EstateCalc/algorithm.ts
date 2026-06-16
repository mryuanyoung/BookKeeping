import { Aod } from "@material-ui/icons"

export enum LoanSource {
  Commercial,
  Fund,
}

export interface Loan {
  source: LoanSource
  amount: number
  rate: number // 年化利率
  duration: number // 贷款年限
}

export enum PaymentType {
  /**
   * 等额本息Equal amount principle and interest
   * 每个月还的总额不变，根据首月利息计算剩余本金，再计算下月利息
   * 每月还款额=贷款本金×[月利率×(1+月利率)^还款月数]÷{[(1+月利率)^还款月数]-1}
  */
  EAPI,
  /**
   * 等额本金Equal amount principle
   * 每个月还的本金不变，且等于贷款总额/期数；利息会变
   * 每月还款金额 = (贷款本金 / 还款月数)+(本金-已归还本金累计额)×每月利率
   */
  EAP,
}

export type CalcParam = {
  totalPrice: number // 房屋总价
  downPaymentRate: number // 首付比例
  loans: Loan[] // 贷款来源及相关参数
  paymentType: PaymentType // 还款方式

  expectedRate: number // 预期理财年华利率
  years: number // 预期第n年卖出

  rent: number // 每月房租，按两倍理财利率增长
}

type MonthlyPayment = {
  total: number // 总额
  principal: number // 本金
  restPrincipal: number // 剩余本金
  interest: number // 利息
}

export function calcSellingPrice(param: CalcParam) {
  const { totalPrice, downPaymentRate, loans, paymentType, expectedRate, years, rent } = param;

  const payments = loans.map(loan => getMonthlyPayment(loan, paymentType));
  const longestTerm = Math.max(...loans.map(loan => loan.duration)) * 12, monthlyPayment = Array.from(Array(longestTerm), () => ({
    total: 0,
    principal: 0,
    restPrincipal: 0,
    interest: 0
  }));

  payments.forEach(payment => {
    payment.forEach(({ total, principal, restPrincipal, interest }, idx) => {
      monthlyPayment[idx].total += total;
      monthlyPayment[idx].principal += principal;
      monthlyPayment[idx].restPrincipal += restPrincipal;
      monthlyPayment[idx].interest += interest;
    })
  })

  const sellingTerm = years * 12;

  let accTotal = 0, accInterest = 0, accPrincipal = 0;
  monthlyPayment.slice(0, sellingTerm).forEach(({ principal, interest, total }) => {
    accTotal += total;
    accInterest += interest;
    accPrincipal += principal;
  });

  const toLoan = monthlyPayment[sellingTerm - 1].restPrincipal;

  const expectedInterest = getExpectedInterest(totalPrice * downPaymentRate, monthlyPayment, expectedRate, years, rent);

  const expectedSellingPrice = toLoan + expectedInterest.total;

  return {
    payments,
    monthlyPayment,
    accTotal,
    accInterest,
    accPrincipal,
    toLoan,
    expectedInterest,
    expectedSellingPrice
  }
}

function getExpectedInterest(downPayment: number, monthlyPayments: MonthlyPayment[], expectedRate: number, years: number, rent: number) {
  let principal = downPayment, total = downPayment, curTerm = 0, totalRent = 0;

  for (let i = 1; i <= years; i++) {
    total *= (1 + expectedRate);

    for (let j = 0; curTerm < i * 12; curTerm++, j++) {
      totalRent += rent * Math.pow(1 + 0.05 / 12, curTerm + 1);
      const base = monthlyPayments[curTerm].total - rent * Math.pow(1 + 0.05 / 12 ,curTerm + 1);
      principal += base;
      total += base + base * expectedRate * (12 - j) / 12
    }
  }

  return {total, principal, diff: total - principal, totalRent};
}


function getMonthlyPayment(loan: Loan, paymentType: PaymentType) {
  switch (paymentType) {
    case PaymentType.EAP:
      return getEAPMonthlyPayment(loan);
    case PaymentType.EAPI:
      return getEAPIMonthlyPayment(loan);
    default:
      return [];
  }
}

// 等额本息
function getEAPIMonthlyPayment(loan: Loan) {
  const { amount, duration, rate } = loan;
  const res: MonthlyPayment[] = [];

  let restPrincipal = amount;
  const term = duration * 12, monthlyRate = rate / 12, total = calcEAPIPayment(amount, term, monthlyRate);

  for (let i = 0; i < term; i++) {
    const interest = restPrincipal * monthlyRate, principal = total - interest;
    restPrincipal -= principal;

    res.push({
      total,
      restPrincipal,
      principal,
      interest
    })
  }

  return res;
}

function calcEAPIPayment(amount: number, term: number, monthlyRate: number) {
  // 贷款本金×[月利率×(1+月利率)^还款月数]÷{[(1+月利率)^还款月数]-1}
  return amount * monthlyRate * Math.pow((1 + monthlyRate), term) / (Math.pow((1 + monthlyRate), term) - 1);
}

// 等额本金
function getEAPMonthlyPayment(loan: Loan) {
  const { amount, duration, rate } = loan;
  const res: MonthlyPayment[] = [];

  let restPrincipal = amount;
  const term = duration * 12, principal = amount / term, monthlyRate = rate / 12;

  for (let i = 0; i < term; i++) {
    const interest = restPrincipal * monthlyRate;
    restPrincipal -= principal;

    res.push({
      total: interest + principal,
      restPrincipal,
      principal,
      interest
    })
  }

  return res;
}