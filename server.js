require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { sequelize } = require("./models");

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "https://santri-pro.vercel.app", // domain frontend kamu
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://santri-pro.vercel.app", // domain frontend kamu
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/project", require("./routes/project"));
app.use("/api/journal", require("./routes/journal"));
app.use("/api/users", require("./routes/users"));

// Sync Database
sequelize
  .sync()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Error connecting to database:", err));

app.set("io", io);
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });
});
// Jalankan server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
