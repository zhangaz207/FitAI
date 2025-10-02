import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../auth/auth';
import { useNavigate } from 'react-router-dom';
import './search.css';

import AOS from 'aos'
import 'aos/dist/aos.css';

const UserSearch = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getProfileImage = (profileData) => {
      const profileId = profileData?.profile || '0';
    return `/images/profile/${profileId}.png`;
    };

    useEffect(() => {
        AOS.init({ duration: 2000 });
    }, []);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      const response = await axios.post('http://localhost:5001/get-user-rec', {
        username: user
      });
      
      const userDetails = await Promise.all(
        response.data.result.map(username => 
          axios.post('http://localhost:5001/get-userinfo', { username })
        )
      );

      const usersWithFollowStatus = await Promise.all(
        userDetails.map(async (res) => {
          const userData = res.data.rows[0];
          try {
            const followCheck = await axios.post('http://localhost:5001/api/search-users', {
              q: userData.username,
              searcher: user
            });
            return {
              ...userData,
              isFollowing: followCheck.data.some(u => u.username === userData.username && u.isFollowing),
              profileImage: getProfileImage(userData)
            };
          } catch {
            return {
              ...userData,
              profileImage: getProfileImage(userData)
            };
          }
        })
      );
      
        setRecommendations(usersWithFollowStatus);
        setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching recommendations');
    } finally {
      setRefreshing(false);
    }
  }, [user]);


  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setResults([]);
      setError('');
      return;
    }
  
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5001/search-user', {
        searchTerm: searchTerm,
        searcher: user 
      });
  
      if (response.data.result && response.data.result.length > 0) {
        const formattedResults = response.data.result.map(user => ({
          ...user,
          profileImage: getProfileImage(user)
        }));
        setResults(formattedResults);
        setError('');
      } else {
        setResults([]);
        setError('No users found');
      }
    } catch (err) {
      setResults([]); 
      setError(err.response?.data?.error || 'Error searching users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (followeeUsername, isFollowing) => {
    try {
      // Optimistic UI update
      setRecommendations(prev => 
        prev.map(u => 
          u.username === followeeUsername 
            ? { ...u, isFollowing: !isFollowing } 
            : u
        )
      );
      
      setResults(prev => 
        prev.map(u => 
          u.username === followeeUsername 
            ? { ...u, isFollowing: !isFollowing } 
            : u
        )
      );


      await axios.post('http://localhost:5001/follow', {
        follower: user,
        followee: followeeUsername,
        unfollow: isFollowing
      });


      setTimeout(() => {
        fetchRecommendations();
      }, 1000);
      
    } catch (err) {

      setRecommendations(prev => 
        prev.map(u => 
          u.username === followeeUsername 
            ? { ...u, isFollowing } 
            : u
        )
      );
      
      setResults(prev => 
        prev.map(u => 
          u.username === followeeUsername 
            ? { ...u, isFollowing } 
            : u
        )
      );
      
      setError(err.response?.data?.error || 'Error updating follow status');
    }
  };

  const viewProfile = (username) => {
    navigate(`/user/${username}`);
  };

  const UserResultCard = ({ userResult, index, viewProfile, handleFollow, currentUser, refreshing, isRecommended }) => (
    <div className="user-card">
      {isRecommended && <span className="recommended-badge">Recommended</span>}
      
      <div 
        className="user-info" 
        onClick={() => viewProfile(userResult.username)}
        style={{ cursor: 'pointer' }} 
      >
        <img 
          src={userResult.profileImage || '/images/profile/pic-0.png'} 
          alt={userResult.username}
          className="user-avatar"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = '/images/profile/pic-0.png';
          }}
        />
        <div className="user-details">
          <h3>{userResult.username}</h3>
          <p>{userResult.name || ''}</p>
        </div>
      </div>
      
      {userResult.username !== currentUser && (
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            handleFollow(userResult.username, userResult.isFollowing);
          }}
          className={`follow-button ${userResult.isFollowing ? 'following' : ''}`}
          disabled={refreshing}
        >
          {refreshing && userResult.isFollowing ? 'Updating...' : 
           userResult.isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );

  return (
    <div className="user-search-container">
      <h2>Search Users</h2>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by username or name..."
          className="search-input"
        />
        <button 
          type="submit" 
          className="search-button"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
  
      {error && <div className="error-message">{error}</div>}
  
      <div className="search-results" >
        {/* Show search results section if there are results */}
        {results.length > 0 && (
          <>
            <h3 className="results-section-title">Search Results</h3>
                      {results.map((userResult, index) => (
                <span data-aos="fade-up" data-aos-delay={index * 100}>
              <UserResultCard 
                key={userResult.username}
                userResult={userResult}
                index={index}
                viewProfile={viewProfile}
                handleFollow={handleFollow}
                currentUser={user}
                    refreshing={refreshing}
                              />
                          </span>
            ))}
          </>
        )}
  
        {/* Show recommendations section if no search results */}
        {results.length === 0 && recommendations.length > 0 && (
          <>
            <h3 className="results-section-title">Recommended Users</h3>
            {recommendations.map((userResult, index) => (
              <UserResultCard 
                key={userResult.username}
                userResult={userResult}
                index={index}
                viewProfile={viewProfile}
                handleFollow={handleFollow}
                currentUser={user}
                refreshing={refreshing}
                isRecommended={true}
              />
            ))}
          </>
        )}
  
        {refreshing && <div className="loading-message">Refreshing recommendations...</div>}
        
        {!refreshing && results.length === 0 && recommendations.length === 0 && (
          <div className="no-results">
            {searchTerm ? 'No users found' : 'No recommendations available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;