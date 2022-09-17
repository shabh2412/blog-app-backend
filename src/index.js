const express = require("express");
const mongoose = require("mongoose");
const blogRoute = require("./Routes/blogs.router");
const cors = require("cors");
const userRoute = require("./Routes/user.router");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/package.json");
});

app.use("/blogs", blogRoute);
app.use("/users", userRoute);

mongoose.connect(`mongodb://localhost:27017/myBlogs`).then(() => {
	const server = app.listen("8080", () => {
		console.log("DB connected, now listening on http://localhost:8080/");
	});
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:5173",
		},
	});
	io.on("connection", (socket) => {
		console.log("new client connected");
	});
	app.set("socketio", io);
});
