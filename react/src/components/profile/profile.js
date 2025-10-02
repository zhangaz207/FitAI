import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import delay from 'delay';
import '../../App.css';
import { Link } from 'react-router-dom';
import './profile.css';
import { AuthContext } from '../auth/auth.js';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [info, setInfo] = useState({
    username: '',
    name: '',
    profile: '',
    weight: '',
    height: '',
    age: '',
    gender: '',
    social: true,
  });
  const [editing, setEditing] = useState(false);
  const [toggleFollower, setToggleFollower] = useState(true) 
    const profileOptions = ['pic-0', 'pic-1', 'pic-2', 'pic-3', 'pic-4', 'pic-5', 'pic-6', 'pic-7', 'pic-8', 'pic-9', 'pic-10', 'pic-11'];

  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followerInfo, setFollowerInfo] = useState({});
  const [followingInfo, setFollowingInfo] = useState({});

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      try {
        const res = await axios.post('http://localhost:5001/get-userinfo', { username: user });
        setInfo(res.data.rows[0]);
      } catch (err) {
        console.error('Cannot load profile:', err.response?.data || err);
      }
      
    }
    fetchProfile();

    const getFollowers = async () => {
      try {
        const res = await axios.post('http://localhost:5001/get-follower', { followee: user });
        const followers = res.data.result || [];
        setFollowersList(followers);
        
        // Fetch info for each follower
        const followerInfoMap = {};
        for (const follower of followers) {
          try {
            const infoRes = await axios.post('http://localhost:5001/get-userinfo', { username: follower });
            followerInfoMap[follower] = infoRes.data.rows[0];
          } catch (err) {
            console.error(`Could not fetch info for follower ${follower}:`, err);
          }
        }
        setFollowerInfo(followerInfoMap);
      } catch (err) {
        console.error('Get followers failed:', err);
      }
    };
    const getFollowing = async () => {
      try {
        const res = await axios.post('http://localhost:5001/get-followee', { follower: user });
        const following = res.data.result || [];
        setFollowingList(following);
        
        // Fetch info for each following
        const followingInfoMap = {};
        for (const followee of following) {
          try {
            const infoRes = await axios.post('http://localhost:5001/get-userinfo', { username: followee });
            followingInfoMap[followee] = infoRes.data.rows[0];
          } catch (err) {
            console.error(`Could not fetch info for following ${followee}:`, err);
          }
        }
        setFollowingInfo(followingInfoMap);
      } catch (err) {
        console.error('Get following failed:', err);
      }
    };
    getFollowers();
    getFollowing();
  }, [user, toggleFollower]);


  const handleEditing = (param) => (tobj) => {
    const value = tobj.target.value;
    setInfo({ ...info, [param]: value });
  };

  const handleEditingBox = (param) => (tobj) => {
    const checked = tobj.target.checked;
    setInfo({ ...info, [param]: checked });
  };


  const handleProfileSelect = (n) => {
    setInfo(prev => ({
      ...prev,
      profile: n}));
  };
  
  const handleSaveEdits = async () => {
    try {
      await axios.post('http://localhost:5001/update-profile', {
        username:   user,
        name:       info.name,
        profile:    info.profile,
        weight:     info.weight,
        height:     info.height,
        age:       info.age,
        gender:    info.gender,
        social:    info.social,
      });
      setEditing(false);
      const popup = document.getElementById('popup');
      popup.style.display = "flex";
      await delay(4900);
      popup.style.display = "none";
    } catch (err) {
      console.error('Could not update profile', err.response);
    }
  };

    const changeToggleFollower = async (b) => {
        try {
            const follow = document.getElementById('follow');
            const followerButton = document.getElementById('followerButton');
            const followingButton = document.getElementById('followingButton');
            //performance issues

            if (b === toggleFollower) {

            } else if (b) {
                followerButton.style.borderBottom = "solid 0.5em #4499cc"
                followingButton.style.borderBottom = "solid 0.5em transparent"
                follow.style.animationDirection = "normal"
                follow.style.animation = "swipe-right 0.2s 1"
                await delay(190);
                await setToggleFollower(b);
            } else {
                followingButton.style.borderBottom = "solid 0.5em #4499cc"
                followerButton.style.borderBottom = "solid 0.5em transparent"
                follow.style.animationDirection = "normal"
                follow.style.animation = "swipe-left 0.2s 1"
                await delay(190);
                await setToggleFollower(b);
            }
        } catch {
            await setToggleFollower(b);
        }
        
    };

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <>
      <div className="popup-home" id="popup">
        <span className="popuptext">Success!</span>
      </div>
      
          <div className="page">
              <a href={"/user/"+user}> 
        <div className="welcome-section">
          <img 
            src={"/images/profile/" + info.profile + ".png"} 
            alt="Profile" 
            className="home-icon"
            style={{ borderRadius: '50%' }}
          />
          <h2>Your Profile</h2>
                  </div>
              </a>

        <div className="profile-section">
          {editing && (
            <div className="profile-dropdown-menu">
              {profileOptions.map((profile) => (
                <img
                  key={profile}
                  src={`/images/profile/${profile}.png`}
                  alt={`Profile ${profile}`}
                  style={{
                    width: '50px', 
                    borderRadius: '50%', 
                    cursor: 'pointer', 
                    margin: '10px', 
                    border: info.profile === profile ? '2px solid #4499cc' : 'none'
                  }}
                  onClick={() => handleProfileSelect(profile)}
                />
              ))}
            </div>
          )}

          <div className="profile-actions">
            <button className="editbutton" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit'}
            </button>

            {editing && (
              <button className="savebutton" onClick={handleSaveEdits}>
                Save Changes
              </button>
            )}
          </div>

          <div className="profile-grid">
            <div className="profile">
              <label className="tag">Username:</label>
              <span className="val">{info.username}</span>
            </div>

            <div className="profile">
              <label className="tag">Name:</label>
              {editing ? (
                <input
                  type="text"
                  value={info.name}
                  onChange={handleEditing('name')}
                />
              ) : (
                <span className="val">{info.name || info.username}</span>
              )}
            </div>

            <div className="profile">
              <label className="tag">Weight (lbs):</label>
              {editing ? (
                <input
                  type="number"
                  value={info.weight}
                  onChange={handleEditing('weight')}
                />
              ) : (
                <span className="val">{info.weight || '—'}</span>
              )}
            </div>

            <div className="profile">
              <label className="tag">Height (in):</label>
              {editing ? (
                <input
                  type="number"
                  value={info.height}
                  onChange={handleEditing('height')}
                />
              ) : (
                <span className="val">{info.height || '—'}</span>
              )}
            </div>

            <div className="profile">
              <label className="tag">Age:</label>
              {editing ? (
                <input
                  type="number"
                  value={info.age}
                  onChange={handleEditing('age')}
                />
              ) : (
                <span className="val">{info.age || '—'}</span>
              )}
            </div>

            <div className="profile">
              <label className="tag">Gender:</label>
              {editing ? (
                <select
                  value={info.gender}
                  onChange={handleEditing('gender')}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <span className="val">{info.gender || '—'}</span>
              )}
            </div>
          </div>

          <Link to="/logout" className="logout">
            Logout
          </Link>
        </div>

        <div className="followsection">
          <div style={{display: "flex", width: "100%"}}>
            <button 
              onClick={() => changeToggleFollower(true)} 
              id="followerButton" 
              className="toggleFollowButton" 
              style={{ borderBottom: toggleFollower ? "solid 0.5em #4499cc" : undefined }}
            >
              <h3>Followers</h3>
            </button>
            <button 
              onClick={() => changeToggleFollower(false)} 
              id="followingButton" 
              className="toggleFollowButton"
              style={{ borderBottom: !toggleFollower ? "solid 0.5em #4499cc" : undefined }}
            >
              <h3>Following</h3>
            </button>
          </div>
          <div className={toggleFollower ? "followersbox" : "followingbox"}>
            <span className="followList">
              {toggleFollower ? (
                followersList.length === 0 ? (
                  <p id="follow">No followers yet</p>
                ) : (
                  <ul id="follow">
                    {followersList.map(f => (
                    <Link to={`/user/${f}`}>
                      <li key={f}>
                        
                          {f}
                          {followerInfo[f]?.name && (
                            <i> ({followerInfo[f].name})</i>
                          )}
                        
                                                  </li>
                    </Link>
                    ))}
                  </ul>
                )
              ) : (
                followingList.length === 0 ? (
                  <p id="follow">Not following anyone yet</p>
                ) : (
                  <ul id="follow">
                                              {followingList.map(f => (
                                                  <Link to={`/user/${f}`}>
                      <li key={f}>
                        
                          {f}
                          {followingInfo[f]?.name && (
                            <i> ({followingInfo[f].name})</i>
                          )}
                        
                                                      </li>
                                                  </Link>
                    ))}
                  </ul>
                )
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
