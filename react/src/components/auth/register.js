import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate} from 'react-router-dom';
import { AuthContext } from './auth.js';
import delay from 'delay';

import './login.css'
import '../../App.css'

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const profile = "pic-0";
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [popupMsg, setPopupMsg] = useState('')

    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    });



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/register', { username, password, profile });
            setPopupMsg('New user created! Redirecting...');
            const popup = document.getElementById('popup');
            popup.style.display = "flex";
            await delay(2000);
            navigate("/login") 
            
                

        } catch (error) {
            setPopupMsg(error.response?.data?.error || 'Registration failed');
            const popup = document.getElementById('popup');
            popup.style.display = "flex";
            await delay(5000);
            popup.style.display = "none";
        }
    };

    return (
        <div className="login-background">
            <div className="login-page">
                <div class="popup" id="popup"><span class="popuptext">{popupMsg}</span></div>
                <div style={{ height: "10vh" }} />
                <div className="login-text">
                    Register
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="login-input"
                    />
                    <br></br>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                    />
                    <br></br>
                    <button type="submit" className="login-button">Register</button>
                </form>

            </div>
        </div> 
    );
};

export default Register;
