/**
 * global process
 * Core Platform App component
 */
import { FunctionComponent, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const App: FunctionComponent<Props> = ({ children }) => {
  return <>{children}</>;
};

export default App;
