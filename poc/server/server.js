const http = require("http");
const socket = require("socket.io");
const {v4 : uuidv4} = require('uuid');
const redis = require("redis");
const httpServer = http.createServer();
const io = socket(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const EVENTS = {
  ON_CREATE_GROUP: "CREATE_GROUP",
  ON_GROUP_CREATED: "GROUP_CREATED",
  ON_JOIN_GROUP: "JOIN_GROUP",
  ON_GROUP_JOINED: "GROUP_JOINED",
  ON_NEW_JOIN_INFO: "NEW_JOIN_INFO",
  ON_LEAVE_GROUP: "LEAVE_GROUP",
  ON_OWNER_LEFT: "OWNER_LEFT",
  ON_PARTICIPANT_LEFT: "PARTICIPANT_LEFT",
  ON_LISTEN_UPDATE_CART: "LISTEN_UPDATE_CART",
  ON_PLACING_ORDER: "PLACING_ORDER",
  ON_ORDER_INITIATED: "ORDER_INITIATED",
  ON_EMIT_RECOMMENDATION: "EMIT_RECOMMENDATION",
  ON_GROUP_NOT_EXIST: "GROUP_NOT_EXIST",
  ON_EMIT_UPDATE_CART: "EMIT_UPDATE_CART",
  ON_LISTEN_UPDATE_CART: "LISTEN_UPDATE_CART",
};

let redisClient;

(async () => {
  redisClient = redis.createClient({
    url: 'redis://localhost:6379'
  });

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

const activeGroups = new Map(); // contains total groups created
const ownerMap = new Map(); // maps ownerId to groupId
const recommendationsMap = new Map(); // items will be suggested


io.on("connection", (socket) => {
  const id = socket.id;
  
  socket.on(EVENTS.ON_CREATE_GROUP, ({location: location, totalParticipants: totalParticipants, numberOfNonVeg: numberOfNonVeg}) => {
    const groupId = uuidv4();
    socket.join(groupId);
    ownerMap.set(id, groupId);

    const group = {
      ownerId: id,
      live: 1,
      cart: null,
      location: location,
      totalParticipants: totalParticipants,
      numberOfNonVeg: numberOfNonVeg,
    };
    activeGroups.set(groupId, group);

    // redis set
    redisClient.set(groupId, JSON.stringify(group));
    redisClient.set(id, groupId);

    io.to(id).emit(EVENTS.ON_GROUP_CREATED, { groupId: groupId, ownerId: id, live: 1, recommendation: recommendationsMap });
    console.log("group created with groupId", groupId);
    console.log("Group Map:", activeGroups);
  });

  socket.on(EVENTS.ON_JOIN_GROUP, ({groupId: groupId }) => {

    if(activeGroups.has(groupId)) {
        // group exist
      socket.join(groupId);
      const group = activeGroups.get(groupId);
      group.live += 1;
      activeGroups.set(groupId, group);
      // redis set
      redisClient.set(groupId, JSON.stringify(group));

      io.to(id).emit(EVENTS.ON_GROUP_JOINED, {live: group.live, location: group.location, cart: group.cart, recommendation: recommendationsMap});
      socket.broadcast.to(groupId).emit(EVENTS.ON_NEW_JOIN_INFO, {live: group.live});
      console.log("Group Map:", activeGroups);
    } else {
        // group doest not exist
        io.to(id).emit(EVENTS.ON_GROUP_NOT_EXIST);
    }
  });

  socket.on(EVENTS.ON_LEAVE_GROUP, ({groupId: groupId, isOwner: isOwner}) => {
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
      
      // redis delete
      redisClient.del(groupId);
      redisClient.del(id);

      socket.broadcast.to(groupId).emit(EVENTS.ON_OWNER_LEFT, "This group does not exist");
      io.to(id).emit(EVENTS.ON_OWNER_LEFT, "You deleted this group.");
      console.log("Group has been deleted:", groupId);
    } else {
      // participant left the group --> live--
      const group = activeGroups.get(groupId);
      group.live -= 1;
      activeGroups.set(id, group);
      
      // redis set
      redisClient.set(groupId, JSON.stringify(group));

      socket.broadcast.to(groupId).emit(EVENTS.ON_PARTICIPANT_LEFT, {live: group.live});
      io.to(id).emit(EVENTS.ON_OWNER_LEFT, "Sorry to see you go.");
      console.log("participant left the group", id);
    }
    console.log("Group Map:", activeGroups);
  })

  socket.on(EVENTS.ON_EMIT_UPDATE_CART, ({ groupId: groupId, cart: items, message: message}) => {
    const group = activeGroups.get(groupId);
    group.cart = items;
    activeGroups.set(groupId, group);
    // redis set
    redisClient.set(groupId, JSON.stringify(group));

    socket.broadcast.to(groupId).emit(EVENTS.ON_LISTEN_UPDATE_CART, {cart: group.cart, message: message});
    console.log("Group Map:", activeGroups);
  });

  socket.on(EVENTS.ON_PLACING_ORDER, ({groupId: groupId, amount: amount}) => {
    socket.broadcast.to(groupId).emit(EVENTS.ON_ORDER_INITIATED, {amount: amount});
    activeGroups.delete(groupId);
    // redis delete
    redisClient.del(groupId);
    redisClient.del(activeGroups.get(groupId).ownerId);
    console.log("Group Map", activeGroups);
  })

  socket.on("disconnect", () => {
    if(ownerMap.has(id)){
      activeGroups.delete(ownerMap.get(id));
      // redis delete
      redisClient.del(ownerMap.get(id));
      redisClient.del(id);
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
