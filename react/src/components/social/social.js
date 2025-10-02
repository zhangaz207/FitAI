import React, { useEffect, useState, useContext } from 'react';
import '../../App.css';
import './social.css';
import { AuthContext } from "../auth/auth.js"
import axios from 'axios';
import LogItem from '../LogItem/LogItem.jsx';
import { Pie, Sector, PieChart } from 'recharts';
import delay from 'delay'

import AOS from 'aos'
import 'aos/dist/aos.css';

const Social = () => {
    const { user } = useContext(AuthContext);
    const [recs, setRecs] = useState([])
    const [following, setFollowing] = useState([])
    const [follower, setFollower] = useState([]);
    const [recLogs, setRecLogs] = useState([]);
    const [followLogs, setFollowLogs] = useState([]);
    const [followerLogs, setFollowerLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [editingLogId, setEditingLogId] = useState(null);
    const [followAvg, setFollowAvg] = useState([]);
    const [totalAvg, setTotalAvg] = useState([]);
    const ITEMS_PER_PAGE = 3;



    const getRecs = async () => {
        try {
            const recommended = await axios.post('http://localhost:5001/get-user-rec', {
                username: user
            });
            setRecs(recommended.data.result);
            
        } catch (err) {
            console.error("Get rec failed:", err);

        }
    };

    const getFollowing = async () => {
        try {
            const follow = await axios.post('http://localhost:5001/get-followee', {
                follower: user
            });
            setFollowing(follow.data.result);

        } catch (err) {
            console.error("Get following failed:", err);

        }
    };

    const getFollower = async () => {
        try {
            const follow = await axios.post('http://localhost:5001/get-follow-back', {
                username: user
            });
            setFollower(follow.data.result);

        } catch (err) {
            console.error("Get following failed:", err);
        }
    }


    useEffect(() => {
        getRecs();
        getFollowing();
        getFollower();

    }, []);

    //copied from history.jsx
    const handleDelete = async (logId) => {
        try {
            await axios.post('http://localhost:5001/delete-log', {
                log_id: logId
            });
            await axios.post('http://localhost:5001/refresh-stats-for', {
                username: user
            });


            fetchFollowLogs();
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
            setFollowLogs(prevLogs =>
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
            fetchFollowLogs()
        }
    };


    const fetchRecLogs = async () => {
        try {
            let log = [];

            const response = await axios.post('http://localhost:5001/get-log', {
                username: recs,
                range_start: 0,
                range_end: 3,
            });
            log = response.data.combined;

            setRecLogs(log);
            if (log.length === 0) {
                getRecs();
            }
            
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };

    const fetchFollowLogs = async () => {
        try {
            const response = await axios.post('http://localhost:5001/get-log', {
                username: following,
                range_start: page * ITEMS_PER_PAGE,
                range_end: (page + 1) * ITEMS_PER_PAGE + 1
            });
            setFollowLogs(response.data.combined || []);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };

    const fetchFollowerLogs = async () => {
        try {
            const response = await axios.post('http://localhost:5001/get-log', {
                username: follower,
                range_start: page * ITEMS_PER_PAGE,
                range_end: 2
            });
            setFollowerLogs(response.data.combined || []);
        } catch (err) {
            console.error("Failed to fetch logs:", err);
        }
    };


    useEffect(() => {
        fetchRecLogs();
        fetchFollowLogs();
        fetchFollowerLogs();
    }, [recs, following, follower]);

    useEffect(() => {
        fetchFollowLogs();
    }, [page]);

    const handleReact = async (logId) => {
        try {
            await axios.post('http://localhost:5001/react', {
                log_id: logId,
                username: user
            });
            fetchFollowerLogs();
            fetchRecLogs();
            fetchFollowLogs();
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
            fetchFollowerLogs();
            fetchRecLogs();
            fetchFollowLogs();
        } catch (err) {
            console.error("Reaction failed:", err);
        }
    };

    const getStatsAvg = async (which, data) => {
        try {
            let stat = await axios.post('http://localhost:5001/get-stats-avg', {
                username: which,
            });
            stat = stat.data.result;
            const sum = Number(stat["avg(aerobic)"]) + Number(stat["avg(stretching)"]) + Number(stat["avg(strengthening)"]) + Number(stat["avg(balance)"]) + Number(stat["avg(rest)"]) + Number(stat["avg(other)"])
            data([]);
            setTimeout(() => {
                data([
                    {
                        activity: "Aerobic",
                        A: (stat["avg(aerobic)"] / sum * 100),
                        fullMark: 100,
                    },
                    {
                        activity: "Stretch",
                        A: (stat["avg(stretching)"] / sum * 100),
                        fullMark: 100,
                    },
                    {
                        activity: "Strength",
                        A: (stat["avg(strengthening)"] / sum * 100),
                        fullMark: 100,
                    },
                    {
                        activity: "Balance",
                        A: (stat["avg(balance)"] / sum * 100),
                        fullMark: 100,
                    },
                    {
                        activity: "Rest",
                        A: (stat["avg(rest)"] / sum * 100),
                        fullMark: 100,
                    },
                    {
                        activity: "Other",
                        A: (stat["avg(other)"] / sum * 100),
                        fullMark: 100,
                    },
                ]);
            }, 10);
            

        } catch (err) {
            data([]);
            console.error("get failed:", err);
        }
    }

    useEffect(() => {
        const d = async () => {
            delay(150);
        }
        d(); //need this for animation to show up?
        getStatsAvg(following, setFollowAvg); 
        getStatsAvg("", setTotalAvg);
    }, [following]);


    const renderActiveShape = (props) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 6}
                    outerRadius={outerRadius + 10}
                    fill={fill}
                />
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.activity}`}</text>
                <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                    {`${(percent * 100).toFixed(2)}%`}
                </text>
            </g>
        );
    };

    const [activeIndex1, setActiveIndex1] = useState(0);
    const [activeIndex2, setActiveIndex2] = useState(0);

    const onPieEnter1 = (_, index) => {
        setActiveIndex1(index);
    };
    const onPieEnter2 = (_, index) => {
        setActiveIndex2(index);
    };
    //maybe clean this up

    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    return (

        <div className="social-container">
            <div className="social-graphs" style={{ borderRight: "solid 1px #eee", marginRight: "2em" }}>
                

                <h2 style={{ position: "sticky", top: "10%" }}>Activity Distributions</h2>
                
                <PieChart width={530} height={380} style={{ marginLeft: "0", position: "sticky", top: "11%" }} isAnimationActive={true}>
                        <Pie
                        activeIndex={activeIndex1}
                        data={totalAvg}
                        dataKey="A"
                        innerRadius={90}
                        outerRadius={130}
                        cx="50%"
                        fill="#4499cc"
                        onMouseEnter={onPieEnter1}
                        activeShape={renderActiveShape}
                        isAnimationActive={true}
                        animationDuration={2000}
                        >
                        </Pie>
                        <text x={"50%"} y={"50%"} dy={8} textAnchor="middle" fill="#000" style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                            Global
                        </text>
                    </PieChart>
                
                
                {following.length > 0 ? (
                    <PieChart width={530} height={360} style={{ marginLeft: "0", position: "sticky", top: "50%" }} isAnimationActive={true}>
                    <Pie
                        activeIndex={activeIndex2}
                        data={followAvg}
                        dataKey="A"
                        innerRadius={90}
                        outerRadius={130}
                        cx="50%"
                        fill="green"
                        onMouseEnter={onPieEnter2}
                        activeShape={renderActiveShape}
                        isAnimationActive={true}
                    >
                    </Pie>
                    <text x={"50%"} y={"50%"} dy={8}  textAnchor="middle" fill="#000" style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                        Following
                    </text>
                    </PieChart>
                ) : (<></>)}
            </div>
            <div className="social-logs">

                {followerLogs.length === 0 ? (
                    <></>
                ) : (
                    <div style = {{ minHeight: "85vh" } }>
                            <h1 data-aos="fade-down" data-aos-once="true" >New followers!</h1>
                            <div className="social-log-list">
                                
                                {followerLogs.map((log, index) => (
                                    <div className="log" data-aos="fade-up" data-aos-once="true" data-aos-delay={150 - index * 50}>
                                <LogItem
                                            key={log.log_id}
                                            log={log}
                                            isEditing={false}
                                            onReact={handleReact}
                                            onUnreact={handleUnreact}
                                            currentUser={user}
                                            showHeader={true}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <h1 data-aos="fade-up" data-aos-once="true" >Recommended</h1>
                {recLogs.length === 0 ? (
                    <p>No workouts recorded yet</p>
                ) : (
                    <>
                            <div className="social-log-list" data-aos="fade-up" data-aos-once="true" >
                                {recLogs.map((log) => (
                                <LogItem
                                        key={log.log_id}
                                        log={log}
                                        isEditing={false}
                                        onReact={handleReact}
                                        onUnreact={handleUnreact}
                                        currentUser={user}
                                        showHeader={true }
                                />
                            ))}
                        </div>
                    </>
                )}

                <h1 data-aos="fade-up" data-aos-once="true" >Following</h1>
                {followLogs.slice(0, ITEMS_PER_PAGE).length === 0 ? (
                    <p>No workouts recorded yet</p>
                ) : (
                    <>
                            <div className="social-log-list" data-aos="fade-up" data-aos-once="true" >
                                {followLogs.slice(0, ITEMS_PER_PAGE).map((log) => (
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
                                    showHeader={true}
                                />
                            ))}
                            </div>
                            <div className="pagination">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    Previous
                                </button>
                                <span>Page {page + 1}</span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={followLogs.length < ITEMS_PER_PAGE + 1 }
                                >
                                    Next
                                </button>
                            </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Social;