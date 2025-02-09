import { model, Schema } from "mongoose";

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
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastAccessed: {
      type: Date,
      required: true,
      default: Date.now,
    },
    serverIp: {
      type: String,
      required: true,
    },
    serverMac: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Activa", "Finalizada por el Usuario", "Inactiva"],
      default: "Activa",
    },
  },
  {
    timestamps: true, // Añade automáticamente createdAt y updatedAt
    versionKey: false, // Deshabilita el campo __v
  }
);

export default model("Session", SessionSchema);
