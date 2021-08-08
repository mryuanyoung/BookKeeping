import { InputProps } from '@interfaces/salary';
import { CityAverageSalary } from './cityAverageSalary';

export const PersonFiveInsureRate: { [key: string]: number } = {
  'age': 0.08,
  'medicine': 0.02,
  'unemploye': 0.005,
};

export const PersonTotalFiveInsureRate = Object.keys(PersonFiveInsureRate).reduce((prev, key) => prev += PersonFiveInsureRate[key], 0);

export const CompanyFiveInsureRate: { [key: string]: number } = {
  'age': 0.2,
  'medical': 0.09,
  'unemploye': 0.015,
  'injury': 0.005,
  'birth': 0.008,
};

export const CompanyTotalFiveInsureRate = Object.keys(CompanyFiveInsureRate).reduce((prev, key) => prev += CompanyFiveInsureRate[key], 0);

export const FreeTaxSalary = 5000;

export const TaxLevel = [
  0,
  36000,
  144000,
  300000,
  420000,
  660000,
  960000,
];

export const TaxTable = [
  [0.03, 0],
  [0.1, 2520],
  [0.2, 16920],
  [0.25, 31920],
  [0.3, 52920],
  [0.35, 85920],
  [0.45, 181920],
];

export const getDefaultInputs = (): InputProps => ({
  base: '',
  bonus: '',
  fundRate: '12',
  fundLimit: CityAverageSalary[0].salary + '',
  extraBonus: [{ remark: '', amount: '' }],
  subsidy: [{ remark: '', amount: '' }],
  OOT: '',
});