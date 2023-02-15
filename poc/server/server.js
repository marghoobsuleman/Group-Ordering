const http = require("http");
const socket = require("socket.io");
const {v4 : uuidv4} = require('uuid')
const redis = require("redis");
const httpServer = http.createServer();
const io = socket(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

const activeGroups = new Map(); // contains total groups created
const ownerMap = new Map(); // maps ownerId to groupId
const recommendationsMap = new Map();

io.on("connection", (socket) => {
  const id = socket.id;
  
  socket.on("CREATE_GROUP", ({location: location, totalParticipants: totalParticipants, numberOfVeg: numberOfVeg}) => {
    const groupId = uuidv4();
    socket.join(groupId);
    ownerMap.set(id, groupId);
    const group = {
      ownerId: id,
      live: 1,
      cart: null,
      location: location,
      totalParticipants: totalParticipants,
      numberOfVeg: numberOfVeg,
    };

    activeGroups.set(groupId, group);
    // redisClient.hmset(groupId, group);
    io.to(id).emit("GROUP_CREATED", { groupId: groupId, ownerId: id, live: 1 });
    console.log("group created with groupId", groupId);
    console.log("Group Map:", activeGroups);
  });

  socket.on("JOIN_GROUP", ({groupId: groupId }) => {
    if(activeGroups.has(groupId)) {
        // group exist
      socket.join(groupId);
      const group = activeGroups.get(groupId);
      group.live += 1;
      activeGroups.set(groupId, group);
      io.to(id).emit("GROUP_JOINED", {live: group.live, ownerId: group.ownerId, location: group.location, cart: group.cart});
      socket.broadcast.to(groupId).emit("NEW_JOIN_INFO", {live: group.live});
      console.log("Group Map:", activeGroups);
    } else {
        // group doest not exist
        io.to(id).emit("group not exist");
    }
  });

  socket.on("LEAVE_GROUP", ({groupId: groupId, isOwner: isOwner}) => {
    if(groupId == null) {
      console.log("Non Participants disconnected");
      return;
    }
    if(!activeGroups.has(groupId)) {
      console.log("Group does not exist");
      return;
    }
    if(isOwner) {
      // owner left the group --> delete entire group
      activeGroups.delete(groupId);
      ownerMap.delete(id);
      socket.broadcast.to(groupId).emit("OWNER_LEFT", "This group does not exist");
      io.to(id).emit("OWNER_LEFT", "You deleted this group.");
      console.log("Group has been deleted:", groupId);
    } else {
      // participant left the group --> live--
      const group = activeGroups.get(groupId);
      group.live -= 1;
      activeGroups.set(id, group);
      socket.broadcast.to(groupId).emit("PARTICIPANT_LEFT", {live: group.live});
      io.to(id).emit("OWNER_LEFT", "Sorry to see you go.");
      console.log("participant left the group", id);
    }
    console.log("Group Map:", activeGroups);
  })

  socket.on("EMIT_UPDATE_CART", ({ groupId: groupId, cart: items, message: message}) => {
    const group = activeGroups.get(groupId);
    group.cart = items;
    socket.broadcast.to(groupId).emit("LISTEN_UPDATE_CART", {cart: group.cart, message: message});
    console.log("Group Map:", activeGroups);
  });

  socket.on("PLACING_ORDER", ({groupId: groupId, amount: amount}) => {
    socket.broadcast.to(groupId).emit("ORDER_INITIATED", {amount: amount});
    activeGroups.delete(groupId);
    console.log("Group Map", activeGroups);
  })

  socket.on("EMIT_RECOMMENDATION", () => {
      io.to(id).emit("LISTEN_RECOMMENDATION", {recommendation: recommendationsMap});
  })

  socket.on("disconnect", () => {
    if(ownerMap.has(id)){
      activeGroups.delete(ownerMap.get(id));
    }
    console.log("user disconnected");
  });

  console.log("connected", id);
  console.log("Group Map:", activeGroups);
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
