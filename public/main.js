document.getElementById("chatPage").style.display = "none";
document.getElementById("error").style.display = "none";

$(function () {
  const FADE_TIME = 150; // ms
  const TYPING_TIMER_LENGTH = 400; // ms
  const COLORS = [
    "#e21400",
    "#91580f",
    "#f8a700",
    "#f78b00",
    "#58dc00",
    "#287b00",
    "#a8f07a",
    "#4ae8c4",
    "#3b88eb",
    "#3824aa",
    "#a700ff",
    "#d300e7",
  ];

  // Initialize variables
  const $window = $(window);

  const $usernameInput = $("#usernameInput"); // Input for username
  const $messages = $("#messages"); // Messages area
  const $inputMessage = $("#inputMessage"); // Input message input box
  $usernameInput.focus();

  const $loginPage = $("#loginPage"); // The login page
  const $chatPage = $("#chatPage"); // The chatroom page

  const $usernameDiv = $("#usernameDiv");
  const $logoDiv = $("#logoDiv");
  const $totalOnlineUsersDiv = $("#totalOnlineUsersDiv");
  const $inputMessageDiv = $("#inputMessageDiv");

  const socket = io();

  // Prompt for setting a username
  let username;
  let lastMessageUsername = null;
  let lastMessageId = null;
  let connected = false;
  let typing = false;
  let lastTypingTime;
  let $currentInput = $usernameInput.focus();

  const addChatPage = (data) => {
    $usernameDiv.append(
      $(
        '<span id="username" class="text-red-700 px-2 py-2 rounded-lg bg-gray-300 font-extrabold mr-3">'
      ).text(data.userName)
    );
    $totalOnlineUsersDiv.append(
      $(
        '<div id="totalOnlineUsers" class="inline-flex font-bold items-center justify-center bg-gray-500 rounded-full h-10 w-10 transition duration-500 ease-in-out text-white focus:outline-none">'
      ).text(data.numUsers)
    );
  };

  const addParticipantsMessage = (data) => {
    document.getElementById("totalOnlineUsers").innerHTML = data.numUsers;
  };

  // Sets the client's username
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());
    
    // If the username is valid
    if (username) {
      // Tell the server your username
      socket.emit("add user", username);
      document.getElementById("loginPage").style.display = "none";
      $loginPage.fadeOut();
      $chatPage.show();
      //$loginPage.off("click");
      $currentInput = $inputMessage.focus();
      //document.getElementById("chatPage").style.display = "";
      
    }
  };

  // Sends a chat message
  const sendMessage = () => {
    let message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val("");
      // tell server to execute 'new message' and send along one parameter
      socket.emit("new message", message);
    }
  };

  // Log a message
  const log = (message, options) => {
    const $message = $(
      '<span class="px-4 py-2 font-semibold rounded-lg inline-block bg-gray-500 text-white">'
    ).text(message);

    const $divThree = $("<div>").append($message);
    const $divTwo = $(
      '<div class="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-1 items-center">'
    ).append($divThree);
    const $divOne = $('<div class="flex items-end justify-center">').append(
      $divTwo
    );
    const $logMessage = $('<div class="log-message">').append($divOne);
    const $newMessage=$messages.append($logMessage);

    addMessageElement($newMessage, options);
    lastMessageUsername=null;
  };

  // Adds the visual chat message to the message list
  const addChatMessageSelf = (data, options = {}) => {
    if (lastMessageUsername===data.username) {
      const $message = $(
        '<span class="px-4 py-2 mt-1 font-semibold text-sm rounded-lg inline-block rounded-br-none bg-blue-400 text-white">'
      ).text(data.message);

      const $messageBodyDiv=$('<div>')
        .append($message);
      const $messageDiv = $('#'+lastMessageId)
        .append($messageBodyDiv);
  
      addMessageElement($messageDiv, options);
      lastMessageId=lastMessageId;
    } else {
      const $messageBodyDiv = $(
        '<span class="px-4 py-2 font-semibold text-sm rounded-lg inline-block rounded-br-none bg-blue-400 text-white">'
      ).text(data.message);
  
      const $divThree = $('<div>').append($messageBodyDiv);
      const $divTwo = $(
        '<div id="' + data.uuid + '" class="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-1 items-end">'
      ).append($divThree);
      const $divOne = $('<div class="flex items-end justify-end">').append(
        $divTwo
      );
  
      const $messageDiv = $('<div class="chat-self-message">')
        .data("username", data.username)
        .append($divOne);
      const $newMessage=$messages.append($messageDiv);

      addMessageElement($newMessage, options);
      lastMessageId=data.uuid;
    }
    lastMessageUsername=data.username;
  };

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options = {}) => {
    if (lastMessageUsername === data.username) {
      const $message = $(
        '<span class="px-4 py-2 mt-1 font-semibold text-sm rounded-lg inline-block rounded-tl-none bg-blue-700 text-white">'
      ).text(data.message);
      const $messageBodyDiv = $('<div>').append($message);
      const $messageDiv = $('#'+lastMessageId+'')
        .append($messageBodyDiv);
      addMessageElement($messageDiv, options);
      lastMessageId=lastMessageId;
    } else {
      const $usernameDiv = $(
        '<span class="bg-gray-200 font-bold p-1 text-sm rounded-lg inline-block rounded-bl-none">'
      )
        .text(data.username)
        .css("color", getUsernameColor(data.username));
      const $message = $(
        '<span class="px-4 py-2 font-semibold text-sm rounded-lg inline-block rounded-tl-none bg-blue-700 text-white">'
      ).text(data.message);
      const $messageBodyDiv = $("<div>").append($message);
      const $divThree = $('<div id="' + data.uuid + '">').append(
        $usernameDiv,
        $messageBodyDiv
      );
      const $divTwo = $(
        '<div class="flex flex-col space-y-2 text-xs max-w-xs mx-2 order-2 items-start">'
      ).append($divThree);
      const $divOne = $('<div class="flex items-end">').append($divTwo);

      const $messageDiv = $('<div class="chat-message">')
        .data("username", data.username)
        .append($divOne);
      const $newMessage=$messages.append($messageDiv);

      addMessageElement($newMessage, options);
      lastMessageId=data.uuid;
    }

    lastMessageUsername = data.username;
  };

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = "is typing";
    addChatMessage(data);
  };

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  };

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    const $el = $(el);
    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === "undefined") {
      options.fade = true;
    }
    if (typeof options.prepend === "undefined") {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      //$el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $el;
    }

    $messages[0].scrollTop = $messages[0].scrollHeight;
  };

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $("<div/>").text(input).html();
  };

  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit("typing");
      }
      lastTypingTime = new Date().getTime();

      setTimeout(() => {
        const typingTimer = new Date().getTime();
        const timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit("stop typing");
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  };

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $(".typing.message").filter(function (i) {
      return $(this).data("username") === data.username;
    });
  };

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    let hash = 7;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    const index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };

  // Keyboard events

  $window.keydown((event) => {
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit("stop typing");
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on("input", () => {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(() => {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on("login", (data) => {
    document.getElementById("chatPage").style.display = "";
    document.getElementById("loginPage").style.display = "none";
    connected = true;
    addChatPage(data);

    console.log('login event fired')
    // Display the welcome message
    const message = "Welcome to Anonymous world";
    log(message, {
      prepend: true,
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'login', log the login message
  socket.on("login failed", (data) => {
    username=null;
    connected=false;
    $chatPage.fadeOut();
    $loginPage.show();
    $chatPage.off("click");
    document.getElementById("chatPage").style.display = "none";
    document.getElementById("loginPage").style.display = "";
    document.getElementById("error").style.display = "";
    $usernameInput.val("");
    $currentInput = $usernameInput.focus();
//    alert('This username is already taken!');


    //window.location.href='/?loginfailed=true&username='+data.username;
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on("new message", (data) => {
    if (data.username===username) {
      addChatMessageSelf(data);
    }else{
      addChatMessage(data);
    }
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on("user joined", (data) => {
    log(`${data.username} joined`);
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", (data) => {
    log(`${data.username} left`);
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on("typing", (data) => {
    // addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on("stop typing", (data) => {
    //removeChatTyping(data);
  });

  socket.on("disconnect", () => {
    log("you have been disconnected");
  });

  socket.on("reconnect", () => {
    log("you have been reconnected");
    if (username) {
      socket.emit("add user", username);
    }
  });

  socket.on("reconnect_error", () => {
    log("attempt to reconnect has failed");
  });
});
