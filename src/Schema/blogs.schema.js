const { Schema, model } = require("mongoose");

const blogSchema = new Schema({
	title: { type: String, required: true },
	author: { type: Schema.Types.ObjectId, ref: "user" },
	body: { type: String, required: true },
	comments: {
		type: [
			{
				body: String,
				date: Date,
				by: { type: Schema.Types.ObjectId, ref: "user" },
			},
		],
		default: [],
	},
	date: { type: Date, default: Date.now },
	hidden: { type: Boolean, default: false },
	meta: {
		votes: { type: Number, default: 0 },
		favs: { type: Number, default: 0 },
	},
	tags: [String], // added tags category.
});

const Blog = model("Blog", blogSchema);

module.exports = Blog;
