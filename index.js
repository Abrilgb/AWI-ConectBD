import app from './app.js'
import './databse.js';
app.listen(app.get('port'),()=>console.log("Server listening on port " + app.get('port')))