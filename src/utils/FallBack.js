import { Alert } from "antd"; // Import the Alert component
export const FallBack = ({ error, resetErrorBoundary }) => {
  return (
    <>
      <Alert
        message={error.name}
        description={error.message}
        type="error"
        showIcon
      />
      <button onClick={resetErrorBoundary}>Reload</button>
    </>
  );
};
