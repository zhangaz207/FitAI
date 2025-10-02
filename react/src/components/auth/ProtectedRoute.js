import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './auth.js';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Loading...</div>; // Or a spinner
    }

    return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;