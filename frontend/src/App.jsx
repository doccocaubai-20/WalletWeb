import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn gốc trỏ về Home thay vì Navigate sang Login */}
        <Route path="/" element={<Home />} />
        
        <Route path="/register" element={<Register />} />

        {/* Đường dẫn đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Đường dẫn Dashboard  */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;