export interface Salary {
  base: number;
  bonus: number;
  stock: number;
  tax: number;
  fund: number;
}

export interface InfoType {
  remark: string;
  amount: string;
}

export interface InputProps {
  base: string; // 月薪
  bonus: string; // 年终奖
  fundRate: string; // 公积金比例
  fundLimit: string; // 公积金上限
  extraBonus: InfoType[]; // 其他年终奖励
  subsidy: InfoType[]; // 补贴
  OOT: string; // 一次性补贴,
  [key: string]: string | InfoType[];
}
