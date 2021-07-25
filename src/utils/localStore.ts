import { RootContainer } from '@PO/BillContainer';
import { ContainerType } from '@PO/enums';

export const getRootContainer = (): RootContainer => {
  const jsonObj: RootContainer  = JSON.parse(localStorage.getItem('container') || '{}');
  if(jsonObj && jsonObj.type === ContainerType.Root){
    //已有
    return jsonObj;
  }
  else{
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