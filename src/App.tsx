import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from '@/controllers/StoreController';
import { ToastProvider } from '@/views/components/ui/Toast';
import { ErrorBoundary } from '@/views/components/ui/ErrorBoundary';
import { AppRoutes } from '@/routes';

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
