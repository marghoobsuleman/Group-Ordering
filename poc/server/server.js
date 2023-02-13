const http = require("http");
const socket = require("socket.io");
const {v4 : uuidv4} = require('uuid')
const httpServer = http.createServer();
const io = socket(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const activeGroups = new Map(); // contains total groups created

io.on("connection", (socket) => {
  const id = socket.id;
  
  socket.on("create group", () => {
    const groupId = uuidv4();
    socket.join(groupId);
    const group = {
      ownerId: id,
      live: 1,
      cart: null
    };

    activeGroups.set(groupId, group);
    io.to(id).emit("group created", { groupId: groupId, ownerId: id, live: 1 });
    console.log("group created with groupId", groupId);
    console.log("Group Map:", activeGroups);
  });

  socket.on("join group", ({groupId: groupId }) => {
    if(activeGroups.has(groupId)) {
        // group exist
      socket.join(groupId);
      const group = activeGroups.get(groupId);
      group.live += 1;
      activeGroups.set(groupId, group);
      io.to(id).emit("group joined", {live: group.live, ownerId: group.ownerId, cart: group.cart});
      socket.broadcast.to(groupId).emit("new join info", {live: group.live});
      console.log("Group Map:", activeGroups);
    } else {
        // group doest not exist
        io.to(id).emit("group not exist");
    }
  });

  socket.on("leave group", ({groupId: groupId, ownerId: ownerId}) => {
    if(groupId == null) {
      console.log("Non Participants disconnected");
      return;
    }
    if(!activeGroups.has(groupId)) {
      console.log("Group does not exist");
      return;
    }
    if(activeGroups.get(groupId).ownerId == ownerId) {
      // owner left the group --> delete entire group
      activeGroups.delete(groupId);
      socket.broadcast.to(groupId).emit("owner left", "This group does not exist");
      io.to(id).emit("owner left", "You deleted this group.");
      console.log("Group has been deleted:", groupId);
    } else {
      // participant left the group --> live--
      const group = activeGroups.get(groupId);
      group.live -= 1;
      activeGroups.set(id, group);
      socket.broadcast.to(groupId).emit("participant left", {live: group.live});
      io.to(id).emit("owner left", "Sorry to see you go.");
      console.log("participant left the group", id);
    }
    console.log("Group Map:", activeGroups);
  })

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("emit update cart", ({ groupId: groupId, cart: items}) => {
    const group = activeGroups.get(groupId);
    group.cart = items;
    socket.broadcast.to(groupId).emit("listen update cart", {cart: group.cart});
    console.log("Group Map:", activeGroups);
  });

  console.log("connected", id);
  console.log("Group Map:", activeGroups);
});


const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
