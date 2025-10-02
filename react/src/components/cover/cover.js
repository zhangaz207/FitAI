import React, { useEffect,useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import './cover.css'
import { AuthContext } from '../auth/auth.js';

import AOS from 'aos'
import 'aos/dist/aos.css';


const Cover = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    });
    useEffect(() => {
        AOS.init({ duration: 2000 });
    }, []);

    const handleLogin = () => {
        navigate('/login');
    }

    const handleRegister = () => {
        navigate('/register');
    }
    

    return (
        <div className="cover-page">
        <div className="cover-background">
            <div style={{ height: "8vh" }}></div>
            <img className="cover-app-icon" src="/images/logo.png" alt="app-icon" data-aos="fade-up" data-aos-once="true" />
                <div className="header-text" data-aos="fade-up" data-aos-once="true">FitAI</div>
                <div style={{ height: "5vh" } }></div>
                <button onClick={handleRegister} className="cover-register-button" data-aos="fade-up" data-aos-delay="300" data-aos-once="true" >New user? Register</button>
                <br />
                <button onClick={handleLogin} className="cover-login-button" data-aos="fade-up" data-aos-delay="300" data-aos-once="true" >Old user? Login</button>
            </div>
        </div>
    );
};

export default Cover;