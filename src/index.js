const express = require("express");
const mongoose = require("mongoose");
const blogRoute = require("./Routes/blogs.router");
const cors = require("cors");
const userRoute = require("./Routes/user.router");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/package.json");
});

app.use("/blogs", blogRoute);
app.use("/users", userRoute);

mongoose.connect(`mongodb://localhost:27017/myBlogs`).then(() => {
	app.listen("8080", () => {
		console.log("DB connected, now listening on http://localhost:8080/");
	});
});
