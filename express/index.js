require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

const initializeDatabase = async () => {
    const connect = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
    });

    try {
        await connect.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);

        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
        });

        await pool.query(`USE ${process.env.DB_NAME}`);
        await pool.query("CREATE TABLE IF NOT EXISTS users ( user_id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), name VARCHAR(255), profile VARCHAR(255) DEFAULT 'pic-0', weight SMALLINT(15), height SMALLINT(15), age SMALLINT(15), social BOOLEAN DEFAULT TRUE, gender VARCHAR(255) DEFAULT 'prefer not to say' )");
        await pool.query("CREATE TABLE IF NOT EXISTS stats ( username VARCHAR (255), aerobic SMALLINT(15) DEFAULT 0, stretching SMALLINT(15) DEFAULT 0 , strengthening SMALLINT(15) DEFAULT 0, balance SMALLINT(15) DEFAULT 0, rest SMALLINT(15) DEFAULT 0 , other SMALLINT(15) DEFAULT 0 )");
        await pool.query(`CREATE TABLE IF NOT EXISTS log (log_id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), activity VARCHAR(255), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, day DATE, start TIME, duration INT, post VARCHAR(255), calories INT)`);
        await pool.query("CREATE TABLE IF NOT EXISTS react ( log_id INT, username VARCHAR(255) )");
        await pool.query("CREATE TABLE IF NOT EXISTS follow ( follower VARCHAR(255) , followee VARCHAR(255) )");

        return pool;
    } catch (error) {
        throw error;
    } finally {
        await connect.end();
    }
};

const workoutCategories = {
    rest: ['rest', 'recovery', 'nap', 'sleep', 'relax', 'meditation', 'day off', 'chill', 'rest day'],
    aerobic: ['run', 'ran', 'sprint', 'jog', 'cycle', 'swim', 'row', 'dance', 'aerobics', 'cardio', 'hiit', 'kickbox', 'zumba', 'elliptical', 'spin', 'cycling', 'jumping rope', 'boxing', 'martial arts', 'hiking','ball', 'soccer', 'walk'],
    strengthening: ['strength', 'lift', 'weight', 'resistance', 'crossfit', 'powerlift', 'calisthen', 'plyo', 'muscle', 'bench', 'deadlift', 'squat', 'pull-up', 'push-up', 'dip', 'kettlebell', 'barbell', 'dumbbell', 'bodyweight', 'chin-up', 'press', 'clean', 'snatch'],
    balance: ['yoga', 'tai chi', 'balance', 'stability', 'pilates', 'proprioception', 'vinyasa', 'hatha', 'yin', 'ashtanga', 'iyengar', 'kundalini', 'acro yoga', 'balance board', 'slackline'],
    stretching: ['stretch', 'flexibility', 'limber', 'mobility', 'cool down', 'warm up', 'static', 'dynamic', 'hamstring', 'quad', 'shoulder', 'hip flexor', 'psoas', 'foam roll', 'myofascial', 'lunge', 'twist', 'extension'],
    other: [] 
};


initializeDatabase()
    .then(pool => {
app.get('/test', async (req, res) => {
    res.status(200).json({ message: 'test success' });
})

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const profile = "pic-0"
        const hashedPassword = await bcrypt.hash(password, 10);

        if (!username.length || !password.length) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (rows.length > 0) {
            return res.status(401).json({ error: 'User already exists' });
        }

        const [result] = await pool.execute(
            'INSERT INTO users (username, password, profile) VALUES (?, ?, ?)',
            [username, hashedPassword, profile]
            //[username, hashedPassword]
        );

        await pool.execute(
            `INSERT INTO log (username, activity, day, start, duration, post, calories)
           VALUES (?, "demo", '2025-01-01 00:00:00', '00:00:00', 0, "", 0)`,
            [username]
        );

        await pool.execute('INSERT INTO stats (username, aerobic, stretching, strengthening, balance, rest, other) VALUES (?, 0, 0, 0, 0, 0, 0)',
            [username]
        );

        res.status(200).json({ message: 'User created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        const hashedPassword = await bcrypt.hash(password, 10);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        //const match = (password == rows[0].password);
        const match = await bcrypt.compare(password, rows[0].password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0].username;

        res.json({ message: 'Login successful', user, });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/change-password', async (req, res) => {
    try {
        const { username, password, new_password } = req.body;
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length === 0) {
            return res.status(500).json({ message: 'wrong password' });
        }

        await pool.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            [new_password, username]

        )
        res.json({ message: 'Change password successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/update-profile', async (req, res) => {
    try {
        const { username, name, profile, weight, height, age, social, gender } = req.body;
        await pool.execute(
            'UPDATE users SET name = ?, profile = ?, weight = ?, height = ?, age = ?, social = ?, gender = ? WHERE username = ?',
            [name, profile, weight, height, age, social, gender, username]
        );

        res.json({ message: 'Update successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/get-userinfo', async (req, res) => {
    try {
        const { username } = req.body;

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Username not found' });
        }

        res.status(200).json({ rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/log', async (req, res) => {
    try {
      const { log_id, username, activity, day, start, duration, post, calories } = req.body;

      if (duration <= 0) {
        return res.status(400).json({ error: "Duration must be positive"});
      }

      if (duration > 1440) {
        return res.status(400).json({ error: "Duration exceeds 24 hours"});
      }
  
      if (log_id) {
        // Update existing log
        await pool.execute(
          `UPDATE log 
           SET activity=?, day=?, start=?, duration=?, post=?, calories=?
           WHERE log_id=? AND username=?`,
          [activity, day, start, duration, post, calories, log_id, username]
        );
        return res.status(200).json({ message: 'Log updated successfully' });
      } else {
        // Create new log
        const [result] = await pool.execute(
          `INSERT INTO log (username, activity, day, start, duration, post, calories)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [username, activity, day, start, duration, post, calories]
        );
        return res.status(200).json({ 
          message: 'Log created successfully',
          log_id: result.insertId 
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.post('/get-log', async (req, res) => {
    try {
        const { username, range_start, range_end } = req.body;
        const placeholders = username.map(() => '?').join(',');
        const [rows] = await pool.execute(
            'SELECT * FROM log WHERE username in (' + placeholders + ') ORDER BY timestamp DESC',
            [...username]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Username not found' });
        }

        const result = rows.slice(range_start, range_end);

        let reacts = []
        for (let i = 0; i < result.length; i++) {
            const [row] = await pool.execute(
                'SELECT * FROM react WHERE log_id = ?',
                [result[i].log_id]
            );
            let reduced_row = [];
            for (let i = 0; i < row.length; i++) {
                reduced_row.push(row[i].username);
            }
            reacts.push(reduced_row)
        }

        const combined = result.map((item, index) => ({
            ...item,
            reacts: reacts[index]
        }));

        res.status(200).json({ combined });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/refresh-stats', async (req, res) => {
    try {
      await pool.execute("DELETE FROM stats");
      await pool.execute('INSERT INTO stats (username) SELECT username FROM users');
      const [result] = await pool.execute("SELECT * FROM log");
        for (let i = 0; i < result.length; i++) {
            const lower = result[i].activity.toLowerCase();
            let other = true;
            for (const [cat, keywords] of Object.entries(workoutCategories)) {
                if (keywords.some(keyword => lower.includes(keyword))) {
                    await pool.execute(
                        `UPDATE stats SET ${cat} = ${cat} + ? WHERE username = ?`,
                        [result[i].calories, result[i].username]
                    );
                    other = false;
                }
            }
            if (other) {
                await pool.execute(
                    `UPDATE stats SET other = other + ? WHERE username = ?`,
                    [result[i].calories, result[i].username]
                );
            }
        }
      res.status(200).json({ message: "refresh success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

app.post('/refresh-stats-for', async (req, res) => {
    try {
        const { username } = req.body;
        await pool.execute("DELETE FROM stats WHERE username=?", [username]);
        await pool.execute('INSERT INTO stats (username, aerobic, stretching, strengthening, balance, rest, other) VALUES (?, 0, 0, 0, 0, 0, 0)', [username]);
        const [result] = await pool.execute("SELECT * FROM log WHERE username = ?", [username]);
        let other = true;
        for (let i = 0; i < result.length; i++) {
            const lower = result[i].activity.toLowerCase();
            for (const [cat, keywords] of Object.entries(workoutCategories)) {
                if (keywords.some(keyword => lower.includes(keyword))) {
                    await pool.execute(
                        `UPDATE stats SET ${cat} = ${cat} + ? WHERE username = ?`,
                        [result[i].calories, result[i].username]
                    );
                    other = false;
                }
            }
            if (other) {
                await pool.execute(
                    `UPDATE stats SET other = other + ? WHERE username = ?`,
                    [result[i].calories, result[i].username]
                );
            }
        }
        res.status(200).json({ message: "refresh success" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/add-stats', async(req, res) => {
    try {
        const { username, activity, calories} = req.body;
        const lower = activity.toLowerCase();
        let other = true;
        for (const [cat, keywords] of Object.entries(workoutCategories)) {
            if (keywords.some(keyword => lower.includes(keyword))) {
                await pool.execute(
                    `UPDATE stats SET ${cat} = ${cat} + ? WHERE username = ?`,
                    [calories, username]
                );
                other = false;
            }
        }
        if (other) {
            await pool.execute(
                `UPDATE stats SET other = other + ? WHERE username = ?`,
                [calories, username]
            );
        }
        res.status(200).json({ message: "add success" });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

app.post('/get-stats', async (req, res) => {
    try {
      const { username } = req.body;

      const [rows] = await pool.execute(
          'SELECT * FROM stats WHERE username = ?',
          [username]
      );
      const result = rows[0]
      res.status(200).json({ result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

app.post('/get-stats-avg', async (req, res) => {
    try {
        const { username } = req.body;
        let rows;
        if (username === "") {
            [rows] = await pool.execute(
                `select avg(aerobic), avg(stretching), avg(strengthening), avg(balance), avg(rest), avg(other) from stats`
            );
        } else {
            const placeholders = username.map(() => '?').join(',');
            [rows] = await pool.execute(
                `select avg(aerobic), avg(stretching), avg(strengthening), avg(balance), avg(rest), avg(other) from stats where username in (` + placeholders + `);`,
                [...username]
            );
        }
        const result = rows[0]
        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.post('/react', async (req, res) => {
    try {
        const { log_id, username } = req.body;


        const [result] = await pool.execute(
            'insert into react (log_id, username) values (?, ?)',
            [log_id, username]
        );

        res.status(200).json({ message: 'React successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/unreact', async (req, res) => {
    try {
        const { log_id, username } = req.body;


        const [result] = await pool.execute(
            'DELETE FROM react where log_id= ? and username= ?',
            [log_id, username]
        );

        res.status(200).json({ message: 'Unreact successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/get-react', async (req, res) => {
    try {
        const { log_id } = req.body;

        const [rows] = await pool.execute(
            'SELECT * FROM react WHERE log_id = ?',
            [log_id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Username not found' });
        }

        let result = [];
        for (let i = 0; i < rows.length; i++) {
            result.push(rows[i].username);
        }

        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/search-user', async (req, res) => {
    try {
        const { searchTerm, searcher } = req.body; // Changed from 'username' to 'searchTerm'

        // Search for users matching either username or name, with follow status
        const [users] = await pool.execute(
            `SELECT 
                u.username, 
                u.name, 
                u.profile,
                CASE WHEN f.follower IS NOT NULL THEN TRUE ELSE FALSE END AS isFollowing
             FROM users u
             LEFT JOIN follow f ON u.username = f.followee AND f.follower = ?
             WHERE 
                u.username LIKE ? OR 
                u.name LIKE ? OR
                CONCAT(u.name, ' ', u.username) LIKE ?
             ORDER BY 
                CASE 
                    WHEN u.username LIKE ? THEN 0  # Exact username match first
                    WHEN u.name LIKE ? THEN 1      # Exact name match next
                    ELSE 2                         # Partial matches last
                END
             LIMIT 5`,
            [
                searcher,
                `${searchTerm}%`,      // Username starts with
                `${searchTerm}%`,      // Name starts with
                `%${searchTerm}%`,     // Combined name + username contains
                `${searchTerm}%`,      // For ordering
                `${searchTerm}%`       // For ordering
            ]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: "No users found" });
        }

        const result = users.map(user => ({
            ...user,
            profileImage: `/images/profile/pic-${user.profile || '0'}.png`,
            isFollowing: Boolean(user.isFollowing)
        }));

        res.status(200).json({ result });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Error searching users',
            details: error.message
        });
    }
});

app.post('/api/search-users', async (req, res) => {
    try {
      const { q } = req.query;
      const [users] = await pool.execute(
        `SELECT 
          u.username, 
          u.name, 
          u.profile,
          CASE WHEN f.follower IS NOT NULL THEN TRUE ELSE FALSE END AS isFollowing
         FROM users u
         LEFT JOIN follow f ON u.username = f.followee AND f.follower = ?
         WHERE u.username LIKE ? OR u.name LIKE ?
         LIMIT 20`,
        [req.body.searcher, `%${q}%`, `%${q}%`]
      );
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

app.post('/follow', async (req, res) => {
    try {
      const { follower, followee, unfollow } = req.body;
      
      if (follower === followee) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
  
      if (unfollow) {
        await pool.execute(
          'DELETE FROM follow WHERE follower = ? AND followee = ?',
          [follower, followee]
        );
      } else {
        await pool.execute(
          'INSERT INTO follow (follower, followee) VALUES (?, ?)',
          [follower, followee]
        );
      }
      
      res.status(200).json({ 
        message: unfollow ? 'Unfollowed successfully' : 'Followed successfully',
        isFollowing: !unfollow
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

//note - follower is the one requesting to follow and followee is the one being followed
app.post('/get-follower', async (req, res) => {
    try {
        const { followee } = req.body;

        const [rows] = await pool.execute(
            'SELECT * FROM follow WHERE followee = ?',
            [followee]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Username not found' });
        }

        let result = [];
        for (let i = 0; i < rows.length; i++) {
            result.push(rows[i].follower);
        }

        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/get-followee', async (req, res) => {
    try {
        const { follower } = req.body;

        const [rows] = await pool.execute(
            'SELECT * FROM follow WHERE follower = ?',
            [follower]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Username not found' });
        }

        let result = [];
        for (let i = 0; i < rows.length; i++) {
            result.push(rows[i].followee);
        }

        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/get-follow-back', async (req, res) => {
    try {
        const { username } = req.body;
        //following
        const [followee] = await pool.execute(
            'SELECT * FROM follow WHERE follower = ? ORDER BY followee',
            [username]
        );

        const [follower] = await pool.execute(
            'SELECT * FROM follow WHERE followee = ? ORDER BY follower',
            [username]
        );

        

        let result = [];
        let i = 0, j = 0;

        while (i < follower.length && j < followee.length) {
            if (follower[i].follower === followee[j].followee) {
                i++;
                j++;
            } else if (follower[i].follower < followee[j].followee) {
                result.push(follower[i].follower);
                i++;
            } else {
                j++;
            }
        }

        while (i < follower.length) {
            result.push(follower[i].follower);
            i++;
        }

        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/get-user-rec', async (req, res) => {
    try {
        const { username } = req.body;

        const [followees] = await pool.execute(
            'SELECT * FROM follow WHERE follower = ?',
            [username]
        );

        let exclude = [];
        for (let i = 0; i < followees.length; i++) {
            exclude.push(followees[i].followee);
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username != ?',
            [username]
        );

        let result = [];
        let chosen = [];
        //change length as necessary, 3 for testing
        //implement better randomization
        for (let i = Math.floor(Math.random() * users.length); result.length < Math.min(3, users.length-exclude.length); i = Math.floor(Math.random() * users.length)) {
            if (i != chosen.slice(-1)[0] && exclude.indexOf(users[i].username) == -1) {
                chosen.push(i);
                result.push(users[i].username);
            }
        }
        
        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/update-log', async (req, res) => {
    try {
        const { log_id, activity, post, day, start, duration } = req.body;

        await pool.execute(
            `UPDATE log
            SET activity = ?, post = ?, day = ?, start = ?, duration = ?, calories = ?
            WHERE log_id = ?`,
            [activity, post, day, start, duration, calories, log_id]
        );
        res.status(200).json({ message: 'Log updated successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update log',
            details: error.message
        });
    }
});

app.post('/delete-log', async (req, res) => {
    try {
        const { log_id } = req.body;

        await pool.execute(
            `DELETE FROM log WHERE log_id=?`,
            [log_id]
        );
        res.status(200).json({ message: 'Log deleted successfully' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update log',
            details: error.message
        });
    }
});
        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error("Failed to initialize database:");
    });
