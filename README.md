# FitAI
FitAI is an innovative client/server app designed to track, analyze, personalize, and share workouts for users with all levels of knowledge about fitness. 

## How to run FitAI locally

This app requires [Node.js](https://nodejs.org/en). Make sure that [Node.js](https://nodejs.org/en) is installed and `npm` commands can be run in your terminal/shell. 

### Get the code

Clone the repository and install all dependencies both in the root directory and in the subdirectories. 
```
git clone https://github.com/ComradePotato1/CS35L-project.git
cd ./CS35L-project
npm install
cd ./react
npm install
cd ../express
npm install
cd ..
```
This sets up dependencies and returns to the project root folder. 

### Connect to database
The app uses MySQL Server. To run the server locally, first install [MySQL Community Server](https://dev.mysql.com/downloads/mysql/8.4.html). 

After completing the installer, start the MySQL server. 

Then, edit the `.env` file in `/express` if necessary, so that it matches your MySQL server environment. An example `.env` has been provided in the express folder
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=project
PORT=5001
```
Where `DB_HOST=localhost` specifies that the project is running locally, `DB_USER` and `DB_PASSWORD` corresponds to the user and password that you used to setup MySQL Server, `DB_NAME` is an arbitrary name for the database, 
`PORT` is hard-coded into front end to fetch data from the backend, and it should not be changed. The backend server listens on Port 5001. If there is a collision, one would have to change all calls to localhost:5001.

### Run the app
In the root directory, run:
```
npm start
```

This starts both the front end and the backend, the backend will automatically create the necessary database and tables. In case the database initialization fails, you can manually create the database via the SQL command:
```
CREATE DATABASE project;
```
Once the deployment server starts, the app should open on your browser. You need to create an account to use the app. 

### Importing entries for testing
Normally, users enter data manually and the application updates its state automatically. 
To test the program, we recommend importing some user data to explore the full functionality of the program. 
- After running the program at least once to generate tables, in the root folder, you will find the `TestCase.sql` file. This contains the MySQL statements with LLM generated testing data. 
- You can open the file in MySQL Workbench or directly execute the statements in MySQL CLI server. 
- Then navigate to `http://localhost:3000/testing/refresh-stats` or a similar URL in your browser, this will execute a full refresh of user statistics. 
- After this, all users and statistics will display correctly. 


## Technologies
- React
- Express
- MySQL
- Google Gemini API

## Authors
This app was developed as a final project UCLA CS35L in Spring 2025 by: Andrew Zhang, Herman Guo, and Jonathan Pearson
