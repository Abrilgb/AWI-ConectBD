import { model, Schema } from "mongoose";

// Definición del esquema para una sesión
const SessionSchema = new Schema(
  {
    sessionID: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    macAddress: {
      type: String,
      required: true,
    },
    serverIp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
    },
    lastAccessed: {
      type: Date,
    },
    serverIp: {
      type: String,
      required: true,
    },
    serverMac: {
      type: String,
      required: true,
    },
    lastActivity: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Activa", "Finalizada por el Usuario", "Inactiva", "Finalizada por el Servidor"],
      default: "Activa",
    },
  },
  {
    timestamps: true, 
    versionKey: false,
  }
);



const UserSchema = new Schema(
  {
    user_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: String,
    email: String,
    // Arreglo de sesiones
    sessions: [SessionSchema],// Aqui se embebe el esquema de sesión
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model("User", UserSchema);
