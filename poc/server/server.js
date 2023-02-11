const http = require("http");
const socket = require("socket.io");
const httpServer = http.createServer();
const io = socket(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

let groups = [];

io.on("connection", (socket) => {
  const id = socket.id;
  socket.on("create group", () => {
    io.to(id).emit("group created", { id });
    groups.push(id);
    console.log("group created", id);
  });

  socket.on("join group", ({ id: groupID }) => {
    if(groups.includes(groupID)) {
      socket.join(groupID);
      io.to(id).emit("group joined");
    } else {
      io.to(id).emit("group not exist");
    }
  })

  socket.on("send to group", ({ text, groupID }) => {
    io.to(groupID).emit("text", { text });
  })

  socket.on("disconnect", () => {
    groups = groups.filter(_ => _ !== id);
  })

  console.log("connected", id);
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
