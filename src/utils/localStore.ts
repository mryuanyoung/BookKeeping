import { getDefaultInputs } from '@constants/taxRate';
import { InputProps } from '@interfaces/salary';
import { RootContainer } from '@PO/BillContainer';
import { ContainerType } from '@PO/enums';

export const getRootContainer = (): RootContainer => {
  const jsonObj: RootContainer = JSON.parse(localStorage.getItem('container') || '{}');
  if (jsonObj && jsonObj.type === ContainerType.Root) {
    //已有
    return jsonObj;
  }
  else {
    //新建一个
    const container = new RootContainer();
    container.createAnnualBill();
    localStorage.setItem('container', JSON.stringify(container));
    return container;
  }
};

export const replaceRootContainer = (container: RootContainer) => {
  localStorage.setItem('container', JSON.stringify(container));
}

export const importRootContainer = (container: string) => {
  localStorage.setItem('container', container);
}

export const preserveSalary = (name: string, obj: InputProps) => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  companies[name] = obj;
  localStorage.setItem('companies', JSON.stringify(companies));
}

export const getCompanyData = (name: string): InputProps => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  return companies[name] || getDefaultInputs();
}

export const getCompanyNames = (): string[] => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  return Object.keys(companies);
}

export const deleteCompany = (name: string) => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  delete companies[name];
  localStorage.setItem('companies', JSON.stringify(companies));
}