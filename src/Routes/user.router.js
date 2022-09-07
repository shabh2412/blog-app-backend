const express = require("express");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");

const UserModel = require("../Schema/users.schema");
const userRoute = express.Router();
userRoute.use(express.json());

// get all users
userRoute.get("/", async (req, res) => {
	try {
		let data = await UserModel.find();
		res.send(data);
	} catch (err) {
		res.send(err.message);
	}
});

// login
// check if the email and password hash matches or not.
userRoute.post("/login", async (req, res) => {
	let { email, password } = req.body;
	if (email && password) {
		let user = await UserModel.findOne({ email });
		if (user) {
			try {
				const matched = await argon2.verify(user.password, password);
				const userData = {
					name: user.name,
					email: user.email,
					phone: user.phone,
				};
				if (matched) {
					let primaryToken = jwt.sign(userData, "primaryToken", {
						expiresIn: "1 hour",
					});
					let refreshToken = jwt.sign(userData, "refreshToken", {
						expiresIn: "7 days",
					});
					res.send(
						{
							primaryToken,
							refreshToken,
						},
						200
					);
				} else {
					res.send({ message: "invalid credentials" }, 401);
				}
			} catch (err) {
				res.send(err.message);
			}
		} else {
			res.send(404);
		}
	} else {
		res.send("incomplete data");
	}
});

// signup
userRoute.post("/post", async (req, res) => {
	let data = req.body;
	if (data.name && data.email && data.password && data.phone) {
		try {
			const passwordHash = await argon2.hash(data.password);
			data.password = passwordHash;
			let user = new UserModel(data);
			await user.save();
			res.send({ user }, 201);
		} catch (err) {
			res.send(err.message);
		}
	} else {
		res.send("body is missing required data.");
	}
});

// get details of logged in user.
userRoute.get("/:user_id", async (req, res) => {
	const _id = req.params.user_id;
	const authorization = req.headers.authorization.split(" ");
	if (authorization.length > 1) {
		const token = {};
		token.primaryToken = authorization[1];
		try {
			let data = jwt.verify(token.primaryToken, "primaryToken");
			res.send(data);
		} catch (err) {
			res.send(err.message);
		}
	} else {
		res.send({ message: "token is missing" }, 401);
	}
});

// refresh token
userRoute.post("/refresh", async (req, res) => {
	const { refreshToken } = req.body;
	try {
		let verify = jwt.verify(refreshToken, "refreshToken");
		if (verify) {
			delete verify.iat;
			delete verify.exp;
			const primaryToken = jwt.sign(verify, "primaryToken");
			res.send({
				primaryToken,
				refreshToken,
			});
		} else {
			res.send({ message: "kindly login again" });
		}
	} catch (err) {
		res.send({ message: err.message });
	}
});

module.exports = userRoute;
