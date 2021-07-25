import { RouteProp } from "@interfaces/route";
import React, {ReactElement} from "react";

const RouteComponent: React.FC<RouteProp> = (props) => {

  const {children, index, curr} = props;

  return index === curr ? children as ReactElement : null;
}

export default RouteComponent;