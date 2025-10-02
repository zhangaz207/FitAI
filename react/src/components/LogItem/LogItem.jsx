import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from "../auth/auth.js"
import axios from "axios"

const LogItem = ({
    log,
    isEditing,
    onEdit=null,
    onSave=null,
    onCancel = null,
    onDelete=null,
    onReact,
    onUnreact,
    currentUser,
    showHeader=false
}) => {

    
    const [name, setName] = useState("");
    const [profile, setProfile] = useState("");
    const [icon, setIcon] = useState("/images/icons/workout.svg")

    const [formData, setFormData] = useState({
        username: log.username,
        activity: log.activity,
        day: log.day ? log.day.split('T')[0] : '', // format for date input
        start: log.start,
        duration: log.duration,
        calories: log.calories,
        post: log.post || ''
    });

    const hasReacted = log.reacts?.includes(currentUser);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            log_id: log.log_id, 
            ...formData
        });
    };


    const handleReactClick = () => {
        if (hasReacted) {
            onUnreact(log.log_id);
        } else {
            onReact(log.log_id);
        }
    };


    const fetchUserData = async (username) => {
        const res = await axios.post('http://localhost:5001/get-userinfo', { username: log.username });
        setName(res.data.rows[0].name);
        setProfile(res.data.rows[0].profile);
    }

    // Helper to format duration for display
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    useEffect (() => {
        
       fetchUserData(); 
       changeIcon();
    })

    function changeIcon() {
        const lower = log.activity.toLowerCase();
        if (lower.includes("run") || lower.includes('ran') || lower.includes('sprint')) {
        setIcon('/images/icons/running.svg');
        } else if (lower.includes("lift") || lower.includes("weight")) {
        setIcon('/images/icons/dumbbell.svg');
        } else if (lower.includes("swim") || lower.includes("swam") ||  lower.includes("water")) {
        setIcon('/images/icons/swimming.svg');
        } else if (lower.includes('bik') || lower.includes('cycl')) {
        setIcon('/images/icons/cycle.webp');
        } else if (lower.includes('box')) {
        setIcon('/images/icons/boxing.svg');
        } else if (lower.includes('yoga')) {
        setIcon('/images/icons/yoga.svg')
        } else if (lower.includes('pilate')) {
            setIcon('/images/icons/pilates.svg')
        }  else if (lower.includes('hik') || lower.includes('walk')) {
        setIcon('/images/icons/hiking.png')
        } else if (lower.includes('meditat') || lower.includes('rest')) {
        setIcon('/images/icons/meditation.png')
        } else if (lower.includes('ball')) {
        setIcon('/images/icons/ball.png')
        }

        else {
        setIcon('/images/icons/workout.svg');
        }
    }

    return (
        <div className={`log-item ${isEditing ? 'editing' : ""}`} onDoubleClick={handleReactClick} >
            {isEditing ? (
                // Edit Mode 
                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-group">
                        <label>Activity:</label>
                        <input
                            type="text"
                            name="activity"
                            value={formData.activity}
                            onChange={handleChange}
                            placeholder="Exercise"
                            required
                        />
                    </div>
                    <div className="time-group">
                        <div className="form-group">
                            <label>Date:</label>
                            <input
                                type="date"
                                name="day"
                                value={formData.day.substring(0,10)}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Start Time:</label>
                            <input
                                type="time"
                                name="start"
                                value={formData.start}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="time-group">
                        

                        <div className="form-group">
                            <label>Duration (minutes):</label>
                            <input
                                type="number"
                                name="duration"
                                min="1"
                                max="1440" // 24 hours
                                value={formData.duration}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Calories (kcal):</label>
                            <input
                                type="number"
                                name="calories"
                                min="1"
                                max="1440" // 24 hours
                                value={formData.calories}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes:</label>
                        <textarea
                            name="post"
                            value={formData.post}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onDelete } className="delete-btn">Delete Log</button>
                        <button type="submit" className="save-btn">
                            Save Changes
                        </button>
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                // View Mode
                    <>
                        {showHeader ? (
                            <>
                                <a href={"/user/" + log.username}>
                                    <div className="welcome-section" style={{height:"1.5em"} }>
                                    
                                    <img src={"/images/profile/" + profile + ".png"} alt="Profile" style={{ width: "50px", borderRadius: '50%' }} className="log-profile" />
                                    <div style={{alignContent: "center", textAlign: "left"} }>
                                        <div className="log-username">{log.username}</div>
                                        <div className="log-name">{name}</div>
                                        </div>
                                    
                                    </div>
                                </a>
                            </>
                        ) : (
                            <></>
                        ) }
                        
                    <div className="log-header">
                        <img src={icon} alt="icon" style={{width:"50px"}}></img>
                        <h3>{log.activity}</h3>
                        <span className="timestamp">
                            {new Date(log.timestamp).toLocaleString()}
                        </span>
                    </div>
                        <div className="log-details">
                            {log.post && <p className="log-notes" style={{textAlign: "left"} }>{log.post}</p>}
                        <div className="log-meta">
                            <span className="log-date">{log.day.split("T")[0]+ " "}</span>
                            <span className="log-time">
                                    Started at: {log.start} • Duration: {formatDuration(log.duration)} • Calories burned: {log.calories} kcals
                            </span>
                        </div>
                    </div>

                        <div className="log-actions">
                            {currentUser === log.username ? (
                                <button
                                    onClick={() => onEdit(log.log_id)}
                                    className="edit-btn"
                                >
                                    Edit
                                </button>) : (
                                    <></>
                                )

                         }
                        <button
                            onClick={handleReactClick}
                            className={`react-btn ${hasReacted ? 'reacted' : ''}`}
                        >
                            {hasReacted ? '✓ Liked' : 'Like'} 
                            {log.reacts?.length > 0 && (
                                <span className="react-count">{log.reacts.length}</span>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default LogItem;
