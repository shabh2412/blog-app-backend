const { Schema, model, SchemaType } = require("mongoose");

const userSchema = new Schema({
	name: String,
	email: String,
	password: String,
	phone: String,
	createdAt: { type: Date, default: Date.now() },
});

const UserModel = model("user", userSchema);

module.exports = UserModel;
