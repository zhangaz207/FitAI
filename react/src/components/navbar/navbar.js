import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth/auth.js';
import axios from 'axios';
import "./navbar.css";

const Navbar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const excludedRoutes = ['/'];
    const hideNavbar = excludedRoutes.includes(location.pathname);
    const [followbackCount, setFollowbackCount] = useState(0);

    useEffect(() => {
        const handleCount = async () => {
            try {
                const res = await axios.post('http://localhost:5001/get-follow-back', {
                    username: user,
                });
                setFollowbackCount(res.data.result.length);
            } catch (err) {
                alert(err);
                console.error("Get count failed:", err);
            }
        }

        handleCount();

    });

    return (
        !hideNavbar && (
            <nav className="nav">
                <a href="/home" className="sitename">
                    {/*<img src="/images/logo.png" alt="logo" className="logo-image" />*/}
                    <p>FitAI</p>
                </a>
                <div className="links">
                    {user ? (
                        <button onClick={() => navigate("/home")} className={location.pathname === "/home" ? "active-link-container" : "link-container"}>
                            <a href="/home" className="home">Home</a>
                        </button>
                    ) : (<span />)
                    }

                    {user ? (
                        <button onClick={() => navigate("/history")} className={location.pathname === "/history" ? "active-link-container" : "link-container"}>
                            <a href="/history" className="home">History</a>
                        </button>
                    ) : (<span />)
                    }

                    {user ? (
                        <div>
                            <button onClick={() => navigate("/social")} className={location.pathname === "/social" ? "active-link-container" : "link-container"}>
                                {followbackCount ? (
                                    <a href="/social" className={location.pathname === "/social" ? "home" : "hover"}>Social {followbackCount}</a>
                                ) : (
                                    <a href="/social" className="home">Social</a>
                                )}
                            </button>
                        </div>
                    ) : (<span />)
                    }

                    {user ? (
                        <button onClick={() => navigate("/search")} className={location.pathname === "/search" ? "active-link-container" : "link-container"}>
                            <Link to="/search" className="home">
                                <i className="fas fa-search"></i> Search
                            </Link>
                        </button>
                    ) : (<span />)
                    }

                    <button onClick={() => navigate("/profile")} className={location.pathname === "/profile" ? "active-link-container" : "link-container"}>
                        {user ? (
                            <a href="/profile" className="home">Profile</a>
                        ) : (
                            <a href="/login" className="home">Login</a>
                        )
                        }
                    </button>
                </div>
            </nav>
        )
    );
};

export default Navbar;
