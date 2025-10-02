import React, { useEffect, useState } from 'react';
import axios from 'axios';  
import '../../App.css';

const RefreshStats = () => {
    const [msg, setMsg] = useState('')

    useEffect(() => {
        refresh();
    },);

    const refresh = async () => {
        try {
            const res = await axios.post("http://localhost:5001/refresh-stats")
            setMsg(res.data.message);
        } catch (err) {
            setMsg(err.data.error);
        }
    };
    
    

    return (
        <p>{msg}</p>
    );

};

export default RefreshStats;
