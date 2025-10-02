import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import delay from 'delay';
import LogItem from '../LogItem/LogItem.jsx';
import "./history.css"
import { AuthContext } from "../auth/auth";
import '../../App.css';
import { Pie, Sector, PieChart } from 'recharts';
import {ComposedChart, Area, Bar,    XAxis,    YAxis,    CartesianGrid,    Tooltip,    Legend,    ResponsiveContainer,} from 'recharts';

import AOS from 'aos'
import 'aos/dist/aos.css';

const History = () => {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [editingLogId, setEditingLogId] = useState(null);
    const [data, setData] = useState([]);
    const [mostRecent, setMostRecent] = useState([]);
  const ITEMS_PER_PAGE = 7;

    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      const response = await axios.post('http://localhost:5001/get-log', {
        username: [user],
        range_start: page * ITEMS_PER_PAGE,
        range_end: (page + 1) * ITEMS_PER_PAGE + 1
      });
      setLogs(response.data.combined || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle initial load and page changes
  useEffect(() => {
    if (user) {
      fetchLogs();
        getStats();
        getMostRecent();
        
    }
  }, [user, page]);

  const handleSaveLog = async (logData) => {
    try {
      const response = await axios.post('http://localhost:5001/log', {
        ...logData,
        username: user
      });

        await axios.post('http://localhost:5001/refresh-stats-for', {
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
        const savelog = document.getElementById(logData.log_id);
        savelog.style.animation = "logItemFadeIn 3s 1";
        await delay(2900);
        savelog.style.animation = "none";

        
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.error || "Failed to save");
      fetchLogs(); // Fallback refresh if optimistic update fails
    }
  };

  // Handle reactions (likes)
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

            await axios.post('http://localhost:5001/refresh-stats-for', {
                username: user
            });
            
            fetchLogs();
        } catch (err) {
            alert(err);
            console.error("error");
        }
    };

const getStats = async () => {
  try {
      let stat = await axios.post('http://localhost:5001/get-stats', {
          username: user,
      });
      stat = stat.data.result;
      const sum = stat.aerobic + stat.stretching + stat.strengthening + stat.balance + stat.rest + stat.other
    setData([
      {
        activity: "Aerobic",
        A: (stat.aerobic / sum * 100),
        fullMark: 100,
      },
      {
        activity: "Stretch",
        A: (stat.stretching / sum * 100),
        fullMark: 100,
      },
      {
        activity: "Strength",
        A: (stat.strengthening / sum * 100),
        fullMark: 100,
      },
      {
        activity: "Balance",
        A: (stat.balance/ sum * 100),
        fullMark: 100,
      },
      {
        activity: "Rest",
        A: (stat.rest / sum * 100),
        fullMark: 100,
      },
      {
        activity: "Other",
        A: (stat.other / sum * 100),
        fullMark: 100,
      },
    ]);
    
    } catch (err) {
        console.error("get failed:", err);
    }
}
//source = https://www.health.harvard.edu/exercise-and-fitness/the-4-most-important-types-of-exercise
//example https://codesandbox.io/p/sandbox/simple-radar-chart-2p5sxm


    const getMostRecent = async () => {
        try {
            let response = await axios.post('http://localhost:5001/get-log', {
                username: [user],
                range_start: 0,
                range_end: 10
            });
            
            const formattedData = response.data.combined.map((item, index) => ({
                activity: `${item.activity} ${index + 1}`,
                calories: item.calories,
                duration: item.duration
            }));

            setMostRecent(formattedData.reverse()); 
        } catch (err) {
            alert(err);
            console.error("get failed:", err);
        }
    }

    useEffect(() => {
        try {
            console.log(mostRecent);
        } catch (err) {
            alert(err);
        }
        
    }, [mostRecent]);

    const renderActiveShape = (props) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

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

    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };


  if (!user) return <p>Please log in to view history</p>;
  if (loading) return <div className="loading">Loading...</div>;

  

  return (
      <div className="history-container">
          <div className="history-graphs" style={{borderRight:"solid 1px #eee", marginRight: "2em"} }>

              <h2>Workout Statistics</h2>

              {logs.length > 1 ? (
                  <>
                  <PieChart width={570} height={400} style={{ marginLeft: "0", position: "sticky", top: "7%" }}>
                  <Pie
                      activeIndex={activeIndex}
                      data={data}
                      dataKey="A"
                      innerRadius={100}
                      outerRadius={150}
                      cx="50%"
                      fill="#4499cc"
                      onMouseEnter={onPieEnter}
                      activeShape={renderActiveShape}
                      
                  >
                  </Pie>
                  <text x={"50%"} y={"50%"} dy={8} textAnchor="middle" fill="#000" style={{ fontWeight: "bold" }}>
                      Activity Distribution
                  </text>
              </PieChart>

              <h3 style={{position: "sticky", top: "450px" }}>Summary of most recent {mostRecent.length} workouts</h3>
                  <ResponsiveContainer width="100%" height={300} style={{ marginLeft: "0", position: "sticky", top: "475px" }}>
                  <ComposedChart
                      width={500}
                      height={400}
                      data={mostRecent}
                      margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                      }}
                  >
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis dataKey="activity" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="duration" fill="#8884d8" stroke="#8884d8" />
                      <Bar yAxisId="right" dataKey="calories" barSize={20} fill="#413ea0" />


                  </ComposedChart>
              </ResponsiveContainer>
                  </>) : (
                      <>
                    <div width="570px">
                              <p>please log more workouts to view statistics</p>
                          </div>
                  </>)}

          </div> 
          <div className="history-logs">

         
          <h2>Your Workout History</h2>
      {logs.length === 0 ? (
        <p>No workouts recorded yet</p>
      ) : (
        <>
                <div className="log-list" >
              
                  {logs.slice(0, ITEMS_PER_PAGE).map((log, index) => (
                      <div className="log" id={log.log_id} data-aos="fade-up" data-aos-once="true" data-aos-delay={400 - index * 50}>
                  <LogItem
                    key={log.log_id}
                    log={log}
                    isEditing={editingLogId === log.log_id}
                    onEdit={() => setEditingLogId(log.log_id)}
                    onSave={handleSaveLog}
                        onCancel={() => setEditingLogId(null)}
                        onDelete={() => handleDelete(log.log_id) }
                        onReact={handleReact}
                        onUnreact={handleUnreact}
                              currentUser={user}
                          />
                      </div>
                ))}
               
          </div>

          {/* Pagination */}
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
              disabled={logs.length < ITEMS_PER_PAGE + 1}
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

export default History;