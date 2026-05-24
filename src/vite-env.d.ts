declare module "*.svg?react" {
  import type { SVGProps } from "react";
  const SVGComponent: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  export default SVGComponent;
}
