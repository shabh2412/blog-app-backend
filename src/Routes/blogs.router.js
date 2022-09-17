const express = require("express");
const Blog = require("../Schema/blogs.schema");

const jwt = require("jsonwebtoken");
const UserModel = require("../Schema/users.schema");
const { default: mongoose } = require("mongoose");
const CommentModel = require("../Schema/comments.schema");

const blogRoute = express.Router("");
blogRoute.use(express.json());

blogRoute.get("/", async (req, res) => {
	// res.send({ message: "hi" });
	const blogs = await Blog.find()
		.populate("author", "name")
		.populate({
			path: "comments",
			populate: {
				path: "by",
				model: "user",
				select: "name",
			},
		});
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

blogRoute.post("/comment", async (req, res) => {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.length > 0) {
		const tokenArr = authHeader.split(" ");
		if (tokenArr[1]) {
			try {
				const verify = jwt.verify(tokenArr[1], "primaryToken");
				const body = req.body;
				console.log(body);
				const blog = await Blog.findById(body._id);
				const newComment = new CommentModel({
					message: body.comment,
					by: verify._id,
				});
				newComment.save();
				// const { comments } = blog;
				blog.comments.push(newComment);
				blog.save();
				res.send(blog);
			} catch (err) {
				res.send(
					{
						err: err.message,
					},
					403
				);
			}
		} else {
			res.send("token not provided", 401);
		}
	} else {
		res.send(401);
	}
});

module.exports = blogRoute;
