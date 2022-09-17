const { Schema, model } = require("mongoose");

const commentSchema = new Schema({
	message: String,
	date: { type: Date, default: Date.now },
	by: { type: Schema.Types.ObjectId, ref: "user" },
});

const CommentModel = model("comment", commentSchema);

module.exports = CommentModel;
