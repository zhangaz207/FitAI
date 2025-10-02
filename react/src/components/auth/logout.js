import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './auth.js';

import './login.css'
import '../../App.css'

const Logout = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    useEffect(() => {
        // Function to be executed on component load
        function handleLogout() {
            logout();
            navigate("/");
        }

        handleLogout();

        // Optional: Return a cleanup function
        return () => {
            
        };
    }, []); // Empty dependency array ensures the effect runs only once

    return  (
        <div></div>
    );
};

export default Logout;
