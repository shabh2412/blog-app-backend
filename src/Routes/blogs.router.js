const express = require("express");
const Blog = require("../Schema/blogs.schema");

const jwt = require("jsonwebtoken");
const UserModel = require("../Schema/users.schema");
const { default: mongoose } = require("mongoose");

const blogRoute = express.Router("");
blogRoute.use(express.json());

blogRoute.get("/", async (req, res) => {
	// res.send({ message: "hi" });
	const blogs = await Blog.find().populate("author", "name");
	res.send(blogs);
});

blogRoute.post("/post", async (req, res) => {
	const auth = req.headers.authorization;
	try {
		const prim = auth.split(" ")[1];
		try {
			const data = jwt.verify(prim, "primaryToken");
			const { email } = data;
			let { _id } = await UserModel.findOne({ email });
			if (_id) {
				// res.send({ _id });
				const blogData = req.body;
				if (blogData.title && blogData.body) {
					blogData.author = mongoose.Types.ObjectId(_id);
					const blogPost = new Blog(blogData);
					await blogPost.save();
					res.send({ blogPost }, 201);
				} else {
					res.send(403);
				}
			} else {
				res.send({ message: "user not found" }, 404);
			}
		} catch (err) {
			res.send(err.message);
		}
	} catch (err) {
		res.send(err.message);
	}
});

module.exports = blogRoute;
