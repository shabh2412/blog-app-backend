const { Schema, model } = require("mongoose");

const blogSchema = new Schema({
	title: { type: String, required: true },
	author: { type: Schema.Types.ObjectId, ref: "user" },
	body: { type: String, required: true },
	comments: {
		type: [
			{
				type: Schema.Types.ObjectId,
				ref: "comment",
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
});

const Blog = model("Blog", blogSchema);

module.exports = Blog;
