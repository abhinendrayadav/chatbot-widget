// ========================== greet user proactively ========================
$(document).ready(function () {

	//drop down menu for close, restart conversation & clear the chats.
	// $("#close").click(function () {
	// 	$(".profile_div").toggle();
	// 	$(".widget").toggle();
	// });

	//enable this if u have configured the bot to start the conversation. 
	// showBotTyping();
	// $("#userInput").prop('disabled', true);

	//global variables
	// action_name = "action_greet_user";
	user_id = "abhinendra";

	//if you want the bot to start the conversation
	// action_trigger();;;

})

// ========================== restart conversation ========================
function restartConversation() {
	$("#userInput").prop('disabled', true);

	$(".chats").html("");
	$(".usrInput").val("");
	send("/restart");
}

// ========================== let the bot start the conversation ========================
function action_trigger() {

	// send an event to the bot, so that bot can start the conversation by greeting the user
	$.ajax({
		url: `http://10.11.40.74:5005/conversations/${user_id}/execute`,
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify({ "name": action_name, "policy": "MappingPolicy", "confidence": "0.98" }),
		success: function (botResponse, status) {
			console.log("Response from Rasa: ", botResponse, "\nStatus: ", status);

			if (botResponse.hasOwnProperty("messages")) {
				setBotResponse(botResponse.messages);
			}
			$("#userInput").prop('disabled', false);
		},
		error: function (xhr, textStatus, errorThrown) {

			// if there is no response from rasa server
			setBotResponse("");
			console.log("Error from bot end: ", textStatus);
			$("#userInput").prop('disabled', false);
		}
	});
}

//=====================================	user enter or sends the message =====================
$(".usrInput").on("keyup keypress", function (e) {
	var keyCode = e.keyCode || e.which;

	var text = $(".usrInput").val();
	if (keyCode === 13) {

		if (text == "" || $.trim(text) == "") {
			e.preventDefault();
			return false;
		} else {
			$("#paginated_cards").remove();
			$(".suggestions").remove();
			$(".quickReplies").remove();
			$(".usrInput").blur();
			setUserResponse(text);
			send(text);
			e.preventDefault();
			return false;
		}
	}
});

$("#sendButton").on("click", function (e) {
	var text = $(".usrInput").val();
	if (text == "" || $.trim(text) == "") {
		e.preventDefault();
		return false;
	}
	else {
		setUserResponse(text);
		send(text);
		e.preventDefault();
		return false;
	}
})

//==================================== Set user response =====================================
function setUserResponse(message) {
	var UserResponse = '<img class="userAvatar" src=' + "./static/img/userAvatar.jpg" + '><p class="userMsg">' + message + ' </p><div class="clearfix"></div>';
	$(UserResponse).appendTo(".chats").show("slow");

	$(".usrInput").val("");
	scrollToBottomOfResults();
	showBotTyping();
	$(".suggestions").remove();
}

//=========== Scroll to the bottom of the chats after new message has been added to chat ======
function scrollToBottomOfResults() {

	var terminalResultsDiv = document.getElementById("chats");
	terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
}

//============== send the user message to rasa server =============================================
function send(message) {

	$.ajax({
		url: "http://10.11.40.74:5005/webhooks/rest/webhook",
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify({ message: message, sender: user_id }),
		success: function (botResponse, status) {
			console.log("Response from Rasa: ", botResponse, "\nStatus: ", status);

			// if user wants to restart the chat and clear the existing chat contents
			if (message.toLowerCase() == '/restart') {
				$("#userInput").prop('disabled', false);

				//if you want the bot to start the conversation after restart
				// action_trigger();
				return;
			}
			setBotResponse(botResponse);

		},
		error: function (xhr, textStatus, errorThrown) {

			if (message.toLowerCase() == '/restart') {
				// $("#userInput").prop('disabled', false);

				//if you want the bot to start the conversation after the restart action.
				// action_trigger();
				// return;
			}

			// if there is no response from rasa server
			setBotResponse("");
			console.log("Error from bot end: ", textStatus);
		}
	});
}

//=================== set bot response in the chats ===========================================
function setBotResponse(response) {

	//display bot response after 500 milliseconds
	setTimeout(function () {
		hideBotTyping();
		if (response.length < 1) {
			//if there is no response from Rasa, send  fallback message to the user
			var fallbackMsg = "I am facing some issues, please try again later!!!";

			var BotResponse = '<img class="botAvatar" src="./static/img/prova.png"/><p class="botMsg">' + fallbackMsg + '</p><div class="clearfix"></div>';

			$(BotResponse).appendTo(".chats").hide().fadeIn(1000);
			scrollToBottomOfResults();
		}
		else {

			//if we get response from Rasa
			for (i = 0; i < response.length; i++) {

				//check if the response contains "text"
				if (response[i].hasOwnProperty("text")) {
					var BotResponse = '<img class="botAvatar" src="./static/img/prova.png"/><p class="botMsg">' + response[i].text + '</p><div class="clearfix"></div>';
					$(BotResponse).appendTo(".chats").hide().fadeIn(1000);
				}

				//check if the response contains "images"
				if (response[i].hasOwnProperty("image")) {
					var BotResponse = '<div class="singleCard">' + '<img class="imgcard" src="' + response[i].image + '">' + '</div><div class="clearfix">';
					$(BotResponse).appendTo(".chats").hide().fadeIn(1000);
				}


				//check if the response contains "buttons" 
				if (response[i].hasOwnProperty("buttons")) {
					addSuggestion(response[i].buttons);
				}

				//check if the response contains "custom" message  
				if (response[i].hasOwnProperty("custom")) {

					//check if the custom payload type is "quickReplies"
					if (response[i].custom.payload == "quickReplies") {
						quickRepliesData = response[i].custom.data;
						showQuickReplies(quickRepliesData);
						return;
					}

					//check if the custom payload type is "location"
					if (response[i].custom.payload == "location") {
						$("#userInput").prop('disabled', true);
						getLocation();
						scrollToBottomOfResults();
						return;
					}

					//check if the custom payload type is "cardsCarousel"
					if (response[i].custom.payload == "cardsCarousel") {
						restaurantsData = (response[i].custom.data)
						showCardsCarousel(restaurantsData);
						return;
					}

					//check of the custom payload type is "collapsible"
					if (response[i].custom.payload == "collapsible") {
						data = (response[i].custom.data);
						//pass the data variable to createCollapsible function
						createCollapsible(data);
					}
				}
			}
			scrollToBottomOfResults();
		}
	}, 500);
}

//====================================== Toggle chatbot =======================================
$("#profile_div").click(function () {
	$(".profile_div").toggle();
	$(".widget").toggle();
});

$("#close").on("click", function (e){
	$(".profile_div").toggle();
	$(".widget").toggle();
})

//======================================bot typing animation ======================================
function showBotTyping() {

	var botTyping = '<img class="botAvatar" id="botAvatar" src="./static/img/prova.png"/><div class="botTyping">' + '<div class="bounce1"></div>' + '<div class="bounce2"></div>' + '<div class="bounce3"></div>' + '</div>'
	$(botTyping).appendTo(".chats");
	$('.botTyping').show();
	scrollToBottomOfResults();
}

function hideBotTyping() {
	$('#botAvatar').remove();
	$('.botTyping').remove();
}





