export enum ContainerType {
  Root = 'Root',
  Year = 'Year',
  Quarter = 'Quarter',
  Month = 'Month',
  Day = 'Day'
}

export enum BillType {
  Export = 'Export',
  Import = 'Import'
}

export enum ExportBillType {
  Meal = 'Meal',
  Entertainment = 'Entertainment',
  Transportation = 'Transportation',
  Dress = 'Dress',
  Necessities = 'Necessities',
  Rent = 'Rent',
  Recharge = 'Recharge',
  Medical = 'Medical'
}

export enum ExportBillLabel {
  Meal = '餐食',
  Entertainment = '娱乐',
  Transportation = '出行',
  Dress = '服饰',
  Necessities = '日用',
  Rent = '租房',
  Recharge = '缴费',
  Medical = '医疗'
}

export enum ImportBillType {
  Salary = 'Salary',
  Bonus = 'Bonus',
  Others = 'Others'
}

export enum ImportBillLabel {
  Salary = '工资',
  Bonus = '奖金',
  Others = '其他'
}
