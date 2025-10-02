import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../../App.css';
import './user.css';
import { AuthContext } from "../auth/auth.js"
import LogItem from '../LogItem/LogItem.jsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';

const User = () => {
    const { user } = useContext(AuthContext);
    const { queryUser } = useParams();
    const [logs, setLogs] = useState([]);
    const [userExists, setUserExists] = useState(true)
    const [editingLogId, setEditingLogId] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [data, setData] = useState([]);
    const [style, setStyle] = useState("Loading...");

    const genAI = new GoogleGenerativeAI("AIzaSyCjKRjNSU9UwkgtpIb0reNGjbmotkh7Xs8");

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


    useEffect(() => {
        if (!user) return;

        async function fetchProfile() {
            try {
                const res = await axios.post('http://localhost:5001/get-userinfo', { username: queryUser });
                setInfo(res.data.rows[0]);
            } catch (err) {
                console.error('Cannot load profile:', err.response?.data || err);
            }

        }
        fetchProfile();


    }, [user]);

    const fetchLogs = async () => {
        try {
            let numLogs = 10;
            const response = await axios.post('http://localhost:5001/get-log', {
                username: [queryUser],
                range_start: 0,
                range_end: numLogs,
            });
            setLogs(response.data.combined || []);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
            setUserExists(false);
        }
    };

    const handleReact = async (logId) => {
        try {
            await axios.post('http://localhost:5001/react', {
                log_id: logId,
                username: user
            });
            fetchLogs(); // Refresh to show updated reactions
        } catch (err) {
            console.error("Reaction failed:", err);
        }
    };

    const handleUnreact = async (logId) => {
        try {
            await axios.post('http://localhost:5001/unreact', {
                log_id: logId,
                username: user
            });
            fetchLogs(); // Refresh to show updated reactions
        } catch (err) {
            console.error("Reaction failed:", err);
        }
    };
    const handleDelete = async (logId) => {
        try {
            await axios.post('http://localhost:5001/delete-log', {
                log_id: logId
            });

            fetchLogs();
        } catch (err) {
            alert(err);
            console.error("error");
        }
    };

    const handleSaveLog = async (logData) => {
        try {
            const response = await axios.post('http://localhost:5001/log', {
                ...logData,
                username: user
            });

            // Optimistic UI update instead of full refresh
            setLogs(prevLogs =>
                logData.log_id
                    ? prevLogs.map(log =>
                        log.log_id === logData.log_id
                            ? { ...log, ...logData }
                            : log
                    )
                    : [...prevLogs, { ...logData, log_id: response.data.log_id }]
            );

            setEditingLogId(null);
        } catch (err) {
            console.error("Save failed:", err);
            alert(err.response?.data?.error || "Failed to save");
            fetchLogs()
        }
    };

    const handleFollow = async () => {
        try {
            await axios.post('http://localhost:5001/follow', {
                follower: user,
                followee: queryUser,
                unfollow: isFollowing
            })
            setIsFollowing(!isFollowing)
        } catch (err) {
            console.error("folllow failed ", err)
        }
    }

    const refreshFollow = async () => {
        try {
            const response = await axios.post("http://localhost:5001/get-follower", {
                followee: queryUser
            })
            setIsFollowing(response.data.result.indexOf(user) !== -1);
        }
        catch (err) {
            console.error("get follow failed")
        }
    }


    useEffect(() => {
        refreshFollow();
        getStats();
        if (queryUser) {
            fetchLogs();

            
        }
    }, [queryUser]);

    useEffect(() => {
        const summarizeStyle = async () => {
            if (style === "Loading...") {
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                    const prompt = `given the user's recent workouts listed below , give a short description of the user's workout style. Do not include bold markings. Return only your analysis and nothing else before and after. Do not include text like 'based on the logs you provided' or include the json data, ignore logs named demo \n ` + JSON.stringify(logs);
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    setStyle(response.text());
                } catch (error) {
                    setStyle("Unable to generate workout style. Please try again later. ");
                }
            }
        }
        if (logs.length > 0) {
            summarizeStyle();
        }
    }, [logs]);

    const getStats = async () => {
        try {
            let queryUserStat = await axios.post('http://localhost:5001/get-stats', {
                username: queryUser,
            });

            let currUserStat = await axios.post('http://localhost:5001/get-stats', {
                username: user,
            });
            queryUserStat = queryUserStat.data.result;
            currUserStat = currUserStat.data.result;
            const queryUserSum = queryUserStat.aerobic + queryUserStat.stretching + queryUserStat.strengthening + queryUserStat.balance + queryUserStat.rest + queryUserStat.other
            const currUserSum = currUserStat.aerobic + currUserStat.stretching + currUserStat.strengthening + currUserStat.balance + currUserStat.rest + currUserStat.other
            setData([
                {
                    activity: "Aerobic",
                    A: parseInt(queryUserStat.aerobic / queryUserSum * 100),
                    B: parseInt(currUserStat.aerobic / currUserSum * 100),
                    fullMark: 100,
                },
                {
                    activity: "Stretching",
                    A: parseInt(queryUserStat.stretching / queryUserSum * 100),
                    B: parseInt(currUserStat.stretching / currUserSum * 100),
                    fullMark: 100,
                },
                {
                    activity: "Strengthen",
                    A: parseInt(queryUserStat.strengthening / queryUserSum * 100),
                    B: parseInt(currUserStat.strengthening / currUserSum * 100),
                    fullMark: 100,
                },
                {
                    activity: "Balance",
                    A: parseInt(queryUserStat.balance / queryUserSum * 100),
                    B: parseInt(currUserStat.balance / currUserSum * 100),
                    fullMark: 100,
                },
                {
                    activity: "Rest",
                    A: parseInt(queryUserStat.rest / queryUserSum * 100),
                    B: parseInt(currUserStat.rest / currUserSum * 100),
                    fullMark: 100,
                },
                {
                    activity: "Other",
                    A: parseInt(queryUserStat.other / queryUserSum * 100),
                    B: parseInt(currUserStat.other / currUserSum * 100),
                    fullMark: 100,
                },
            ]);

        } catch (err) {
            console.error("get failed:", err);
        }
    }
    return (
        <div className="user-container">
            {userExists ? (
                <>
                    <div className="user-info-section">
                        <div className="welcome-section" style={{ flexWrap: "wrap", position: "sticky", top: "110px" }}>
                            <img
                                src={"/images/profile/" + info.profile + ".png"}
                                alt="Profile"
                                className="user-profile-pic"
                                style={{ borderRadius: '50%' }}
                            />
                            
                        <div className="user-name">
                                <h2>{queryUser}</h2>
                                <p style={{ color: "#757575", margin: "3px"} }>{info.name}</p>
                                <button
                                    onClick={handleFollow} style={{ width: "inherit", padding: "1rem 0rem" }} className={`follow-btn ${isFollowing ? 'followed' : ''}` } >
                                    {isFollowing ? 'Following' : 'Follow'}
                                    
                                </button>
                            </div>
                        </div>
                        <div style={{ flexWrap: "wrap", position: "sticky", top: "560px" }}>
                        <h2>Workout style</h2>
                            <p>{style}</p>
                        </div>
                    </div>
                    <div className="user-log-section">
                        {logs.length === 0 ? (
                            <p>No workouts recorded yet</p>
                        ) : (
                                <>

                                    <RadarChart cx={300} cy={250} outerRadius={150} width={625} height={500} data={data}>
                                        <PolarGrid stroke="#111" />
                                        <PolarAngleAxis dataKey="activity"  />
                                        <PolarRadiusAxis type="number" domain={[-10,]} round="true"/>

                                        <Radar name={queryUser} dataKey="A" stroke="green" fill="green" fillOpacity={0.4} strokeWidth="3.5" />
                                        <Radar name="Me" dataKey="B" stroke="#4499cc" fill="#4499cc" fillOpacity={0.4} strokeWidth="3.5" />
                                        <Legend></Legend>
                                    </RadarChart>
                                <div className="log-list">
                                    {logs.map((log) => (
                                        <LogItem
                                            key={log.log_id}
                                            log={log}
                                            isEditing={editingLogId === log.log_id}
                                            onEdit={() => setEditingLogId(log.log_id)}
                                            onSave={handleSaveLog}
                                            onCancel={() => setEditingLogId(null)}
                                            onDelete={() => handleDelete(log.log_id)}
                                            onReact={handleReact}
                                            onUnreact={handleUnreact}
                                            currentUser={user}
                                        />
                                    ))}
                                </div>
                                <p>Showing at most {Math.min(logs.length, 15)} entries</p>

                            </>
                        )}
                    </div>
                </>
            ) : (<>
                <p>user does not exist</p>
            </>)}
            
            
        </div>
    );
};

export default User;