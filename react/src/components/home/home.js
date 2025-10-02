import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import './home.css'
import '../../App.css';
import { AuthContext } from "../auth/auth.js";
import delay from 'delay';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AOS from 'aos'
import 'aos/dist/aos.css';

const Home = () => {
  const { user } = useContext(AuthContext);
  const today = new Date().toISOString().split('T')[0];   
  const now = new Date();
  const currentTime = now.toTimeString().slice(0,5);      

  const [activity, setActivity] = useState('');
  const [day, setDay] = useState(today);
  const [start, setStart] = useState(currentTime);
  const [duration, setDuration] = useState('');
  const [post, setPost] = useState('');
  const [error, setError] = useState('');
  const [icon, setIcon] = useState('/images/icons/workout.svg');
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [promptResponses, setpromptResponses] = useState([]);
  const [weight, setWeight] = useState(155);
  const [height, setHeight] = useState(68);
  const [age, setAge] = useState(20);
  const [gender, setGender] = useState("prefer not to say");
  const [loadingRec, setLoadingRec] = useState(false);
  const [workoutPreference, setWorkoutPreference] = useState('');
  const [profile, setProfile] = useState('pic-0');
  
  useEffect(() => {
    AOS.init({ duration: 2000 });
  }, []);

  const genAI = new GoogleGenerativeAI("AIzaSyCjKRjNSU9UwkgtpIb0reNGjbmotkh7Xs8");

  const calcCalories = async (timespent, activity, post) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `User weight: ${weight} lbs; height: ${height} in. age: ${age} gender: ${gender} activity: ${activity} time spent: ${timespent} minutes notes(if any): ${post}\n` + "an integer estimate of how much kcal the user burned based on the information given above, return only a number and nothing else";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return parseInt(response.text());
    } catch (error) {
      alert("Unable to generate calories estimates. Please try again later");
    }
  }

  const getResponseForGivenPrompt = async () => {
    try {
      setLoadingRec(true);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `User weight: ${weight} lbs; height: ${height} in. age: ${age} gender: ${gender} ${workoutPreference ? `preference: ${workoutPreference}` : ''} \n` + `Please give me three different workout recommendations based on my recent workouts (JSON below). ` +
        `Return ONLY a JSON array of objects with keys "activity" (string) and "duration" (number).\n` + JSON.stringify(pastWorkouts);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(text)
      let newtext = text.trim();

      if (newtext.startsWith("```")) {
        newtext = newtext.replace(/^```(?:json)?\r?\n/, "").replace(/\r?\n```$/, "").trim()
      }
      
      const start = newtext.indexOf('[');
      const end   = newtext.lastIndexOf(']');
      let finaltext;
      if (start !== -1 && end !== -1 && end > start) {
        finaltext = newtext.slice(start, end + 1);
      } else {
        finaltext = newtext;
      }

      let recs;
      try {
        recs = JSON.parse(newtext);
      } catch (err) {
        console.error("Could not parse AI response:", err);
        recs = [{ activity: newtext, duration: 0 }];
      }
      setpromptResponses(recs);
      setLoadingRec(false);
    }
    catch (error) {
      
      console.log(error)
      console.log("Something Went Wrong");
    }
  }

  const diversifyRecommendations = async () => {
    if (promptResponses.length === 0) return;
    try {
      setLoadingRec(true);
      setpromptResponses([]);
      setWorkoutPreference('');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `User weight: ${weight} lbs; height: ${height} in. age: ${age} gender: ${gender}  \n` +
    `Please diversify these workout recommendations by changing their categories (e.g. swap a run for a swim, yoga for a hike, etc). ` +
        `Return ONLY a JSON array of objects with keys "activity" and "duration".\n` + JSON.stringify(promptResponses);
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
  let  newtext   = text.trim();
  if (newtext.startsWith("```")) {
    newtext = newtext.replace(/^```(?:json)?\r?\n/, "").replace(/\r?\n```$/, "").trim();
  }

  let recs;
  try {
    recs = JSON.parse(newtext);
  } catch {
    recs = [{ activity: newtext, duration: 0 }];
  }
      setpromptResponses(recs);
      setLoadingRec(false);
    } catch (error) {
      alert("error")
      console.log(error)
      console.log("Something Went Wrong");
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    const pastArray = async() => {
      try {
        const {data} = await axios.post('http://localhost:5001/get-log', {username: [user], range_start: 0, range_end: 4});
        console.log('home recent logs:', data.combined);
        setPastWorkouts(data.combined || []);
      } catch (error){
        console.error('No workouts found',error);
      }
      }

      const getInfo = async () => {
          try {
              const info = await axios.post("http://localhost:5001/get-userinfo", { username: user });
              if (info.data.rows[0].weight !== null) {
                  setWeight(info.data.rows[0].weight)
              }
              if (info.data.rows[0].age !== null) {
                  setAge(info.data.rows[0].age)
              }
              if (info.data.rows[0].height!== null) {
                  setHeight(info.data.rows[0].height)
              }
              if (info.data.rows[0].profile !== null) {
                  setProfile(info.data.rows[0].profile)
              }
              setGender(info.data.rows[0].gender)
          } catch (error) {
              alert(error);
          }
      }
      pastArray();
      getInfo();
      

  }, [user]);

  function changeIcon(text) {
    const lower = text.toLowerCase();
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

    const autoUpdateStart = (e) => {
        let updated = new Date();
        updated = new Date(updated - 60000 * e);
        setStart(updated.toTimeString().slice(0, 5))
    }

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (post.length > 255) {
          alert("Note input cannot exceed 255 characters. ")
          return;
      }
      const calories = await calcCalories(duration, activity, post);
    if (duration <= 0) {
      setError('Duration must be at least 1 minute');
      return;
    }

    if (duration > 1440){
      setError('Duration cannot exceed 24 hours')
      return;
    }

    try {
      await axios.post('http://localhost:5001/log', {
        username: user,
        activity,
        day,
        start,
        duration,
          post,
        calories
      });

      await axios.post('http://localhost:5001/add-stats', {
        username: user,
          activity,
            calories,
      });
        const popup = document.getElementById('popup');
        popup.style.display = "flex";
        await delay(400);
      setActivity('');
      setDay(today); //default to todays date, should prob make end date to length of workout.
      setStart(currentTime);
      setDuration('');
      setPost('');
      setError('');
        setIcon('/images/icons/workout.svg');

        const pastArray = async () => {
            try {
                const { data } = await axios.post('http://localhost:5001/get-log', { username: [user], range_start: 0, range_end: 3 });
                console.log('home recent logs:', data.combined);
                setPastWorkouts(data.combined || []);
            } catch (error) {
                console.error('No workouts found', error);
            }
        }

        pastArray();

        await delay(3500);
        popup.style.display = "none";
    } catch (error) {
      console.error('Failed to add Workout:', error.response?.data || error);
      alert('There was an error adding your workout. ' + error);
    }
  };

  if (!user) {
    return (
      <div className="page">
        <div className="welcome-section">
          <h2>Please log in to add workouts.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="popup-home" id="popup">
        <span className="popuptext">Workout Logged!</span>
      </div>
      
      <div className="welcome-section">
        <img src={"/images/profile/" + profile + ".png"} alt="Profile" className="home-icon" style={{ borderRadius: '50%' }} />
        <h2>Welcome back, {user}!</h2>
        <img src={icon} alt="workout type" className="home-icon" />
      </div>

      <section className="workout">
        <h3>Add a Workout</h3>
        <form onSubmit={handleSubmit} className="form">
          <div>
            <label>Activity</label>
            <input
              type="text"
              value={activity}
              onChange={e => { setActivity(e.target.value); changeIcon(e.target.value); }}
              placeholder="What did you do?"
              required
            />
          </div>

          <div>
            <label>Duration</label>
            <input
              type="number"
              name="duration"
              min={1}
              max={1440}
              value={duration}
              onChange={e => { setDuration(e.target.value); autoUpdateStart(e.target.value); setError(''); }}
              placeholder="Minutes"
              required
            />
          </div>

          <div>
            <label>Date</label>
            <input
              type="date"
              value={day}
              onChange={e => { setDay(e.target.value); setError(''); }}
              max={today}
              required
            />
          </div>

          <div>
            <label>Start Time</label>
            <input
              type="time"
              value={start}
              onChange={e => { setStart(e.target.value); setError(''); }}
              required
            />
          </div>

          <div className="notes-field">
            <label>Notes</label>
            <textarea
              value={post}
              onChange={e => setPost(e.target.value)}
              placeholder="How was your workout? (Max 255 chars)"
              rows="4"
            />
          </div>

          {error && <p className="errors">{error}</p>}
          <button type="submit">Log Workout</button>
        </form>
      </section>

      <div className="home-sections">
        <section className="pastworkouts">
          <h3>Past Workouts</h3>
          {pastWorkouts.length === 0 ? (
            <p>No recent workouts</p>
          ) : (
            <div className="pastwork">
              {pastWorkouts.map(log => (
                <div key={log.log_id} className="pastitem" data-aos="fade-right" data-aos-once="true">
                  <strong>{log.activity}</strong>
                  <div>{log.day.slice(0, 10)} at {log.start.slice(0,5)}</div>
                  <div>{log.duration} min • {log.calories} kcals burned</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pastworkouts">
          <h3>Recommended Workouts</h3>
          <div className="big-buttons">
            <input
              type="text"
              value={workoutPreference}
              onChange={e => setWorkoutPreference(e.target.value)}
              placeholder="Exercise Focus?"
              className="preference-input"
            />
            <button className="div-button" onClick={getResponseForGivenPrompt}>
              Generate New Recs
            </button>
            {promptResponses.length > 0 && (
              <button className="div-button" onClick={diversifyRecommendations}>
                Diversify
              </button>
            )}
          </div>
          
          {promptResponses.length === 0 ? (
            loadingRec ? (
              <p>Loading...</p>
            ) : (
              <p>No recommendations yet</p>
            )
          ) : (
            <div className="pastwork">
              {promptResponses.map((rec, i) => (
                <div 
                  key={i} 
                  className="pastitem" 
                  data-aos="fade-left" 
                  data-aos-once="true" 
                  data-aos-delay={i*100}
                >
                  <strong>{rec.activity}</strong>
                  <div>{rec.duration} minutes</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
