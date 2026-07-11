import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Report from './components/Report';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="max-w-md mx-auto pb-20 bg-[#1a1a1a] min-h-screen">
                <Routes>
                  <Route path="/" element={<OrderForm />} />
                  <Route path="/ordenes" element={<OrderList />} />
                  <Route path="/reporte" element={<Report />} />
                </Routes>
                <Navbar />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
