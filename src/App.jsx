import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Report from './components/Report';
import Extras from './components/Extras';
import SuscripcionVencida from './pages/SuscripcionVencida';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="app-container">
                <Routes>
                  <Route path="/" element={<OrderForm />} />
                  <Route path="/ordenes" element={<OrderList />} />
                  <Route path="/extras" element={<Extras />} />
                  <Route path="/reporte" element={<Report />} />
                  <Route path="/suscripcion-vencida" element={<SuscripcionVencida />} />
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
