import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const offline = localStorage.getItem('offline');
    if ((!offline || offline !== '*') && !token) {
      navigate('/login', { replace: true });
    }
  })
}

export default useAuth;