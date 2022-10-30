interface Subsidy {
  amount: number;
  note: string;
}

interface SpecialDeduction {
  amount: number;
  note: string;
}

const InsuranceRates = [
  [0.08, 0.2], // pension
  [0.02, 0.065], // medical
  [0.01, 0.02], // unemployment
  [0, 0.006], // maternity
  [0, 0.006] // injury
];

export const TaxLevel = [0, 36000, 144000, 300000, 420000, 660000, 960000];

export const TaxTable = [
  [0.03, 0],
  [0.1, 2520],
  [0.2, 16920],
  [0.25, 31920],
  [0.3, 52920],
  [0.35, 85920],
  [0.45, 181920]
];

const DEFAULT_FUND_LIMIT = 3420;

export class Salary {
  base: number;
  subsidys: Subsidy[];
  yearAward: number;
  extraAward: Subsidy[];
  insurancesCardinality: number;
  fundRate: number;
  fundUpperLimit: number;
  specialDeductions: SpecialDeduction[];

  constructor() {
    this.base = 0;
    this.subsidys = [];
    this.yearAward = 0;
    this.extraAward = [];
    this.insurancesCardinality = 0;
    this.fundRate = 0;
    this.fundUpperLimit = 0;
    this.specialDeductions = [];
  }

  get beforeTaxYearSalary() {
    const subsidys = this.subsidys.reduce(
      (prev, item) => prev + item.amount,
      0
    );

    const extraAward = this.extraAward.reduce(
      (prev, item) => prev + item.amount,
      0
    );

    const total = (this.base + subsidys) * 12 + this.yearAward + extraAward;

    return total;
  }

  get fiveInsurances() {
    const rates = InsuranceRates.reduce((prev, item) => prev + item[0], 0);

    return this.insurancesCardinality * rates;
  }

  get fund() {
    return Math.min(
      this.fundRate * this.insurancesCardinality,
      this.fundUpperLimit
    );
  }

  get specialDeductionAmount() {
    return this.specialDeductions.reduce((prev, item) => prev + item.amount, 0);
  }

  get totalTax() {
    const taxBase =
      this.beforeTaxYearSalary -
      5000 * 12 - // 5k以下不纳税
      (this.fiveInsurances + this.fund) * 12 - // 五险一金
      this.specialDeductionAmount * 12; // 专项扣除

    let idx = 0;
    for (let len = TaxLevel.length; idx < len; idx++) {
      if (taxBase < TaxLevel[idx]) {
        break;
      }
    }
    const totalTax = taxBase * TaxTable[idx][0] - TaxTable[idx][1];
    return Math.max(0, totalTax);
  }

  get totalSalary() {
    return (
      this.beforeTaxYearSalary - this.fiveInsurances - this.totalTax + this.fund
    );
  }

  setField(inputs: any, bonusType: number) {
    this.base = inputs.base;
    this.subsidys = inputs.subsidy;
    this.yearAward =
      bonusType === 0 ? inputs.base * inputs.bonus : inputs.bonus;
    this.extraAward = inputs.extraBonus;
    this.insurancesCardinality = inputs.fundBase;
    this.fundRate = inputs.fundRate / 100;
    this.fundUpperLimit = inputs.fundLimit * 3 * 0.12;
    this.specialDeductions = [{ amount: 1500, note: '租房' }];
  }
}
