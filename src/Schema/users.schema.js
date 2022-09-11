const { Schema, model, SchemaType } = require("mongoose");

const userSchema = new Schema({
	name: String,
	email: { type: String, unique: true },
	password: String,
	phone: String,
	role: { type: String, enum: ["admin", "user"], default: "user" },
	createdAt: { type: Date, default: Date.now() },
});

const UserModel = model("user", userSchema);

module.exports = UserModel;
