import './App.css';

import Login from "./components/auth/login.js"
import Register from "./components/auth/register.js"
import Navbar from "./components/navbar/navbar.js"
import Home from "./components/home/home.js"
import History from "./components/history/history.jsx"
import ProtectedRoute from "./components/auth/ProtectedRoute.js"
import Logout from "./components/auth/logout.js"
import Profile from "./components/profile/profile.js"
import Cover from "./components/cover/cover.js"
import Social from "./components/social/social.js"
import User from "./components/user/user.js"
import Search from "./components/search/search.js"
import RefreshStats from "./components/testing/refreshStats.js"
import { Auth } from "./components/auth/auth.js"

import {
  Route,
  Routes
} from "react-router-dom";


function App() {

    return (
      <Auth>
      <div className="App">
    <Navbar />
          <Routes>
              <Route path='/' element={<Cover /> } />
              <Route path="/register" element={<Register /> } />
              <Route path="/login" element={<Login />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/home" element={<ProtectedRoute> <Home /> </ProtectedRoute>} />
              <Route path="/history" element={ <ProtectedRoute> <History /> </ProtectedRoute>}/>
              <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute> } />
              <Route path="/social" element={<ProtectedRoute> <Social /> </ProtectedRoute>} />
              <Route path="/user/:queryUser" element={<ProtectedRoute><User /></ProtectedRoute> } />
                <Route path="/search" element={<ProtectedRoute> <Search /> </ProtectedRoute>} />
                <Route path="/testing/refresh-stats" element={<ProtectedRoute> <RefreshStats /> </ProtectedRoute>} />
          </Routes>
            </div>
        </Auth>
  );
}

export default App;
