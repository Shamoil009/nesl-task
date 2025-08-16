const cors = require("cors");
const express = require("express");
// const routes = require("./routes");
const http = require("http");
const app = express();

const server = http.createServer(app);
// const socketIO = require("socket.io");
// const io = socketIO(server);
const { Server } = require("socket.io");

const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.get("/", (req, res) => {
  res.send("server");
});

io.on("connection", (socket) => {
  console.log("New client connected");
  console.log(socket.id);

  socket.on("send-data", (data) => {
    socket.broadcast.emit("receive-data", data);
    console.log(data);
  });
});

server.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});
