import { getDefaultInputs } from '@constants/taxRate';
import { InputProps } from '@interfaces/salary';
import { RootContainer } from '@PO/BillContainer';
import { ContainerType } from '@PO/enums';
import { getNowDate } from '@utils/calendar';

export const getRootContainer = (): RootContainer => {
  const jsonObj: RootContainer = JSON.parse(
    localStorage.getItem('container') || '{}'
  );
  if (jsonObj && jsonObj.type === ContainerType.Root) {
    //已有root
    const { year } = getNowDate();
    if (!jsonObj.containers[year]) {
      // 新的一年需要新建一个year container
      Object.setPrototypeOf(jsonObj, RootContainer.prototype);
      jsonObj.createAnnualBill(year);
      localStorage.setItem('container', JSON.stringify(jsonObj));
    }
    return jsonObj;
  } else {
    //新建一个
    const container = new RootContainer();
    container.createAnnualBill();
    localStorage.setItem('container', JSON.stringify(container));
    return container;
  }
};

export const replaceRootContainer = (container: RootContainer) => {
  // json全量更新
  localStorage.setItem('container', JSON.stringify(container));
};

export const importRootContainer = (container: string) => {
  localStorage.setItem('container', container);
};

export const preserveSalary = (name: string, obj: InputProps) => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  companies[name] = obj;
  localStorage.setItem('companies', JSON.stringify(companies));
};

export const getCompanyData = (name: string): InputProps => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  return companies[name] || getDefaultInputs();
};

export const getCompanyNames = (): string[] => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  return Object.keys(companies);
};

export const deleteCompany = (name: string) => {
  const companies = JSON.parse(localStorage.getItem('companies') || '{}');
  delete companies[name];
  localStorage.setItem('companies', JSON.stringify(companies));
};

export const getWebDAVAccount = () => {
  const account = JSON.parse(localStorage.getItem('account') || '{}');
  return {
    password: account.password,
    username: account.username
  };
};
