import React from 'react';
import MainPage from './pages/MainPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="w-screen h-screen">
        <MainPage />
      </main>
    </QueryClientProvider>
  );
}

export default App;
