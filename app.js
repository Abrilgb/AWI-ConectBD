import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import macaddress from 'macaddress';
import moment from 'moment-timezone';
import mongoose from 'mongoose';
import forge from 'node-forge';
import User from './src/models/Session.js';

const app = express();
const PORT = 3000;

mongoose.connect('mongodb+srv://aguzm347:yinyer0223Y@yinyer-02.ohjot.mongodb.net/Sesiones?retryWrites=true&w=majority&appName=yinyer-02')
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch(error => console.error(error));

// Generar llaves RSA
const keypair = forge.pki.rsa.generateKeyPair(600);
const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

app.listen(PORT, () => {
  console.log(`Server iniciado en http://localhost:${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "P6-ABG#YinyerYinyerina-SessionesHTTP-VariablesdeSesion",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 60 * 1000 } 
  })
);

// Ruta de bienvenida
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Bienvenid@ a la API de Control de Sesiones',
    author: 'Abril Guzmán Barrera'
  });
});

// Funciones auxiliares para obtener la IP local y la MAC del servidor
const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
};

const getServerMac = () => {
  return new Promise((resolve, reject) => {
    macaddress.one((err, mac) => {
      if (err) {
        reject(err);
      }
      resolve(mac);
    });
  });
};

const encryptData = (data) => {
  const encrypted = keypair.publicKey.encrypt(data, 'RSA-OAEP');
  return forge.util.encode64(encrypted);
};

// Ruta de login
app.post('/login', async (req, res) => {
  const { email, nickname, macAddress } = req.body;
  if (!email || !nickname || !macAddress) {
    return res.status(400).json({
      message: 'Se esperan campos requeridos'
    });
  }

  const sessionID = uuidv4(); // Genera un identificador único
  const createdAt_CDMX = moment().tz('America/Mexico_City').format(); // Fecha en la zona de CDMX  
  const createdAt_UTC = moment(createdAt_CDMX).utc().format(); // Convertimos a UTC  
  const serverIp = encryptData(getLocalIp() || '');
  const serverMac = encryptData(await getServerMac());
  const encryptedMacAddress = encryptData(macAddress);

  // Buscar al usuario por email, si no existe, lo crea
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      user_id: uuidv4(),
      name: nickname,
      email,
      sessions: []
    });
  }

  // Agregar la sesión al arreglo de sesiones del usuario
  user.sessions.push({
    sessionID,
    email,
    nickname,
    macAddress: encryptedMacAddress,
    serverIp,
    createdAt: createdAt_UTC, // Guardar en UTC  
    lastAccessed: createdAt_UTC, // Guardar en UTC  
    serverIp,
    serverMac,
    lastActivity: createdAt_CDMX,
    status: "Activa"
  });

  await user.save();
  req.session.sessionID = sessionID;

  res.status(200).json({
    message: 'Se ha logueado de manera exitosa',
    sessionID
  });
});

// Ruta de logout
app.post('/logout', async (req, res) => {
  const { sessionID } = req.session;

  if (!sessionID) {
    return res.status(404).json({
      message: 'No existe una sesión activa'
    });
  }

  const user = await User.findOne({ "sessions.sessionID": sessionID });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const sessionItem = user.sessions.find(item => item.sessionID === sessionID);
  if (sessionItem) {
    sessionItem.status = "Finalizada por el Usuario";
  }

  await user.save();
  req.session.destroy();

  res.status(200).json({
    message: 'Logout exitoso'
  });
});

// Ruta para actualizar sesión
app.post('/update', async (req, res) => {
  const { email, nickname } = req.body;

  if (!req.session.sessionID) {
    return res.status(404).json({
      message: 'No existe una sesión activa'
    });
  }

  const user = await User.findOne({ "sessions.sessionID": req.session.sessionID });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const sessionItem = user.sessions.find(item => item.sessionID === req.session.sessionID);
  if (!sessionItem) {
    return res.status(404).json({ message: 'Sesión no encontrada' });
  }

  if (email) sessionItem.email = email;
  if (nickname) sessionItem.nickname = nickname;
  sessionItem.lastAccessed = moment().tz('America/Mexico_City').format();

  await user.save();

  res.status(200).json({
    message: 'Datos actualizados',
    session: sessionItem
  });
});

// Ruta para obtener el status de la sesión
// Ruta para obtener el status de la sesión  
app.get('/status', async (req, res) => {  
  const { sessionID } = req.session;  

  if (!sessionID) {  
    return res.status(404).json({  
      message: 'No existe una sesión activa'  
    });  
  }  

  const user = await User.findOne({ "sessions.sessionID": sessionID });  
  if (!user) {  
    return res.status(404).json({ message: 'Usuario no encontrado' });  
  }  

  const sessionItem = user.sessions.find(item => item.sessionID === sessionID);  
  if (!sessionItem) {  
    return res.status(404).json({ message: 'Sesión no encontrada' });  
  }  

  // Convertir a la zona horaria deseada  
  const lastAccessedInTime = moment.utc(sessionItem.lastAccessed).tz('America/Mexico_City').format();  
  const createdAtInTime = moment.utc(sessionItem.createdAt).tz('America/Mexico_City').format();  

  const now = moment().tz('America/Mexico_City');  
  const inactividad = now.diff(lastAccessedInTime, 'minutes');  
  const duracion = now.diff(createdAtInTime, 'minutes');  

  res.status(200).json({  
    message: 'Sesión activa',  
    session: {  
      ...sessionItem,  
      lastAccessed: lastAccessedInTime, // Enviar la fecha en la zona local  
      createdAt: createdAtInTime // Enviar la fecha en la zona local  
    },  
    inactividad: `${inactividad} minutos`,  
    duracion: `${duracion} minutos`  
  });  
});

// Ruta para obtener todas las sesiones
app.get('/allSessions', async (req, res) => {
  try {
    const users = await User.find();
    let sessions = [];

    users.forEach(user => {
      sessions = sessions.concat(user.sessions);
    });

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No hay sesiones' });
    }

    const now = moment().tz('America/Mexico_City');
    const formattedSessions = sessions.map(session => {
      const lastAccessedInTime = moment.utc(session.lastAccessed).tz('America/Mexico_City').format();
      const createdAtInTime = moment.utc(session.createdAt).tz('America/Mexico_City').format();
      const inactividad = now.diff(moment.utc(session.lastAccessed).tz('America/Mexico_City'), 'minutes');

      return {
        ...session.toObject(),  // Convertimos a objeto plano
        createdAt: createdAtInTime, 
        lastAccessed: lastAccessedInTime,
        inactividad: `${inactividad} minutos`
      };
    });

    res.status(200).json({ message: 'Sesiones activas', sessions: formattedSessions });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las sesiones', error });
  }
});

app.get('/allCurrentSessions', async (req, res) => {
  try {
    const users = await User.find({ "sessions.status": "Activa" });

    let activeSessions = [];
    users.forEach(user => {
      activeSessions = activeSessions.concat(user.sessions.filter(session => session.status === "Activa"));
    });

    if (activeSessions.length === 0) {
      return res.status(404).json({ message: 'No hay sesiones activas' });
    }

    const now = moment().tz('America/Mexico_City');
    const formattedSessions = activeSessions.map(session => {
      const lastAccessedInTime = moment.utc(session.lastAccessed).tz('America/Mexico_City').format();
      const createdAtInTime = moment.utc(session.createdAt).tz('America/Mexico_City').format();
      const inactividad = now.diff(moment.utc(session.lastAccessed).tz('America/Mexico_City'), 'minutes');

      return {
        ...session.toObject(),
        createdAt: createdAtInTime,
        lastAccessed: lastAccessedInTime,
        inactividad: `${inactividad} minutos`
      };
    });

    res.status(200).json({ message: 'Sesiones activas', sessions: formattedSessions });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo obtener las sesiones activas', error });
  }
});



// Ruta para eliminar todas las sesiones (de todos los usuarios)
app.delete('/deleteAllSessions', async (req, res) => {
  try {
    await User.deleteMany({});
    res.status(200).json({ message: 'Todos los usuarios y sus sesiones han sido eliminados.' });
  } catch (error) {
    res.status(500).json({ message: 'No se pudo eliminar', error });
  }
});


// Intervalo para marcar sesiones inactivas (más de 5 minutos sin actividad) 
setInterval(async () => {
  try {
    const now = moment().tz('America/Mexico_City');  
    const users = await User.find();

    for (const user of users) {
      for (const session of user.sessions) {
        const lastAccessed = moment(session.lastAccessed).tz('America/Mexico_City');
        const inactividad = now.diff(lastAccessed, 'minutes');

        if (inactividad > 10 && session.status === "Activa") {
          session.status = `Inactiva por ${inactividad} minutos`;
          session.lastAccessed = now.toDate();
        }
      }

      // Guardar los cambios en las sesiones del usuario
      await user.save();
    }
  } catch (error) {
    console.error("Error actualizando sesiones inactivas:", error);
  }
}, 60000);

