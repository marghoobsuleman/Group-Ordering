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
    <qrcode-vue :value="value" :size="size" level="H" /><br/>
    <!-- <textarea v-model="text"></textarea> <br/> -->
    <button @click="sendToGroup">Update Cart</button><br/>
    <button @click="leaveGroup">Leave Group</button>
  </template>
</template>

<script>
import socket from "./socket";
import QrcodeVue from 'qrcode.vue'
export default {
  components: {
      QrcodeVue,
  },
  data() {
    return {
      groupID: null,
      ownerID: null,
      joinedGroup: false,
      groupCreated: false,
      iAmTheOwner: false,
      live: 0,
      cart: null,
      location: "vaishali gaziabad",
      orderInitiated: false,
      totalAmount: 0,
      message: "PIZZA MANIA ADDED TO THE CART",
      value: 'https://pizzaonline.dominos.co.in/menu?offline=false',
      size: 300,  
    }
  },
  methods: {
    createGroup() {
      socket.emit("CREATE_GROUP", {location: this.location, totalParticipants: 10, numberOfNonVeg: 5});
    },
    joinGroup() {
      socket.emit("JOIN_GROUP", {groupId: this.groupID});
    },
    leaveGroup() {
      socket.emit("LEAVE_GROUP", {groupId: this.groupID, isOwner: this.iAmTheOwner});
    },
    sendToGroup() {
      socket.emit("EMIT_UPDATE_CART", { groupId: this.groupID, cart: [{menuCode: "PIZ001"},{menuCode: "PIZ002"},{menuCode: "PIZ003"}], message: this.message, amount: 1000});
    },
  },
  created() {
    socket.on("GROUP_CREATED", ({ groupId: groupId, ownerId: id, live: live }) => {
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

    socket.on("GROUP_JOINED", ({ live: live, ownerId: ownerId, location: location, cart: cart }) => {
      this.joinedGroup = true;
      this.live = live;
      this.ownerID = ownerId;
      this.cart = cart;
      this.location = location;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live,
        location: this.location,
        cart: this.cart
      }
      console.log("Welcome to the group");
      console.log("group info:", infoGroup);
    })

    socket.on("NEW_JOIN_INFO", ({ live: live }) => {
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

    socket.on("OWNER_LEFT", (message) => {
      this.groupCreated = false;
      this.joinedGroup = false;
      this.ownerID = null;
      this.iAmTheOwner = false;
      this.groupID = null;
      this.live = 0;
      this.cart = null;
      this.totalAmount = 0;
      const infoGroup = {
        groupId: this.groupID,
        ownerId: this.ownerID,
        joinedGroup: this.joinedGroup,
        groupCreated: this.groupCreated,
        iAmTheOwner: this.iAmTheOwner,
        live: this.live,
        cart: this.cart,
        totalAmount: this.totalAmount
      }
      console.log("message:", message);
      console.log("group info:", infoGroup);
    })

    socket.on("PARTICIPANT_LEFT", ({live: live}) => {
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

    socket.on("GROUP_NOT_EXIST", () => {
      console.log("group does not exisit");
    })

    socket.on("LISTEN_UPDATE_CART", ({cart: cart, amount: amount}) => {
      this.totalAmount = amount;
      this.texts = cart;
      console.log("cartItems:", cart);
    })

    socket.on("LISTEN_RECOMMENDATION", ({recommendation: recommendationsMap}) => {
      console.log(recommendationsMap);
    })

    socket.on("ORDER_INITIATED", ({amount: amount}) => {
      this.orderInitiated = true;
      this.amount = amount;
      console.log()

    })

  }
}
</script>

<style scoped>
</style>
