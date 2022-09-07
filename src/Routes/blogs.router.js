const express = require("express");
const Blog = require("../Schema/blogs.schema");

const blogRoute = express.Router("");
blogRoute.use(express.json());

blogRoute.get("/", async (req, res) => {
	// res.send({ message: "hi" });
	const blogs = await Blog.find();
	res.send(blogs);
});

blogRoute.post("/post", async (req, res) => {
	try {
		let data = await new Blog(req.body);
		await data.save();
		const blogs = await blogs.find();
		res.send(blogs);
	} catch (err) {
		res.send({
			error: err.message,
		});
	}
});

module.exports = blogRoute;
