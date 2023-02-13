<template>
  <h1>Group Order</h1>
  <template v-if="!joinedGroup">
    <button @click="createGroup">Create group</button>
    <br/>
    <input v-model="groupID" type="text" placeholder="Group ID" />
    <button @click="joinGroup">Join group</button>
  </template>
  <template v-else>
    <h1>Welcome to the group {{ groupID }}</h1>
    <code v-for="itext in texts"> {{ itext }} <br/></code>
    <!-- <textarea v-model="text"></textarea> <br/> -->
    <button @click="sendToGroup">Update Cart</button><br/>
    <button @click="leaveGroup">Leave Group</button>
  </template>
</template>

<!-- <template>
  <h1>Group Order</h1>
  <template v-if="groupCreated">
    <template v-if="!joinedGroup">
      <h1>Your Group has been created with GroupId: {{ groupID }}</h1><br/>
      <button @click="goToTheGroup">Go To The Group</button>
    </template>
    <template v-else>
      <h1>Welcome to the group {{ groupID }}</h1>
      <code v-for="itext in texts"> {{ itext }} <br/></code>
      <textarea v-model="text"></textarea> <br/>
      <button @click="sendToGroup">Send to group</button><br/>
      <button @click="leaveGroup">Leave Group</button>
    </template>
  </template>
  <template v-else-if="joinedGroup">
    <h1>Welcome to the group {{ groupID }}</h1>
    <code v-for="itext in texts"> {{ itext }} <br/></code>
    <textarea v-model="text"></textarea> <br/>
    <button @click="sendToGroup">Send to group</button>
    <button @click="leaveGroup">Leave Group</button>
  </template>
  <template v-else>
    <button @click="createGroup">Create group</button>
    <br/>
    <input v-model="groupID" type="text" placeholder="Group ID" />
    <button @click="joinGroup">Join group</button>
  </template>
</template> -->


<script>
import socket from "./socket";
export default {
  data() {
    return {
      groupID: null,
      ownerID: null,
      joinedGroup: false,
      groupCreated: false,
      iAmTheOwner: false,
      live: 0,
      text: "",
      texts: [],
      cart: null
    }
  },
  methods: {
    createGroup() {
      socket.emit("create group");
    },
    joinGroup() {
      socket.emit("join group", {groupId: this.groupID});
    },
    leaveGroup() {
      socket.emit("leave group", {groupId: this.groupID, ownerId: this.ownerID});
    },
    sendToGroup() {
      socket.emit("emit update cart", { groupId: this.groupID, cart: [{menuCode: "PIZ001"},{menuCode: "PIZ002"},{menuCode: "PIZ003"}]});
    },
  },
  created() {
    socket.on("group created", ({ groupId: groupId, ownerId: id, live: live }) => {
      // pass userId generated when user loggedIn and it will act as groupId
      this.groupID = groupId;
      this.ownerID = id;
      this.joinedGroup = true;
      this.groupCreated = true;
      this.iAmTheOwner = true;
      this.live = live;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live,
        cart: this.cart
      }
      console.log("Your Group has been created.");
      console.log("group info:", infoGroup);
    })

    socket.on("group joined", ({ live: live, ownerId: ownerId, cart: cart }) => {
      this.joinedGroup = true;
      this.live = live;
      this.ownerID = ownerId;
      this.cart = cart;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live,
        cart: this.cart
      }
      console.log("Welcome to the group");
      console.log("group info:", infoGroup);
    })

    socket.on("new join info", ({ live: live }) => {
      this.live = live;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live,
        cart: this.cart
      }
      console.log("New person joined the group");
      console.log("group info:", infoGroup);
    })

    socket.on("owner left", (message) => {
      this.groupCreated = false;
      this.joinedGroup = false;
      this.ownerID = null;
      this.iAmTheOwner = false;
      this.groupID = null;
      this.live = 0;
      this.cart = null;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live,
        cart: this.cart
      }
      console.log("message:", message);
      console.log("group info:", infoGroup);
    })

    socket.on("participant left", ({live: live}) => {
      // any other participant left the group
      this.live = live;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live
      }
      console.log("One Person left the group");
      console.log("group info:", infoGroup);
    })

    socket.on("group not exist", () => {
      console.log("group does not exisit");
    })

    socket.on("listen update cart", ({cart: cart}) => {
      this.texts.push(cart);
      console.log("cartItems:", cart);
    })

  }
}
</script>

<style scoped>
</style>
