const express = require("express");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const access = require("../permissions/acesses.json");

const UserModel = require("../Schema/users.schema");
const { default: axios } = require("axios");
const userRoute = express.Router();
userRoute.use(express.json());

// // get all users
// userRoute.get("/", async (req, res) => {
// 	try {
// 		let data = await UserModel.find();
// 		res.send(data);
// 	} catch (err) {
// 		res.send(err.message);
// 	}
// });

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
					_id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role || "user",
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
							data: userData,
							tokens: {
								primaryToken,
								refreshToken,
							},
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

// OAUTH
userRoute.post("/login/github", async (req, res) => {
	const { code, state } = req.query;
	// console.log(code, state);
	try {
		let response = await axios.post(
			`https://github.com/login/oauth/access_token`,
			null,
			{
				params: {
					client_id: "c6c281322a00b7b88b67",
					client_secret: "8cdd77e7580c67a7799522e5dc1e6bed5207c6e9",
					code,
				},
				headers: {
					accept: "application/json",
				},
			}
		);
		response = response.data;
		let userData = await axios.get("https://api.github.com/user", {
			headers: {
				Authorization: `Bearer ${response.access_token}`,
				accept: "application/json",
			},
		});
		userData = userData.data;
		let userExists = await doesUserExistInDb(userData.email);
		if (!userExists) {
			const { name, email, phone } = userData;
			const newUser = new UserModel({
				name,
				email,
				phone,
				viaOauth: true,
			});
			console.log(newUser);
			await newUser.save();
		}
		console.log(userExists);
		let user = await UserModel.findOne({ email: userData.email });
		const userDataFromDB = {
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			role: user.role || "user",
			viaOauth: user.viaOauth,
		};
		let primaryToken = jwt.sign(userDataFromDB, "primaryToken", {
			expiresIn: "1 hour",
		});
		let refreshToken = jwt.sign(userDataFromDB, "refreshToken", {
			expiresIn: "7 days",
		});
		return res.send(
			{
				data: userDataFromDB,
				tokens: {
					primaryToken,
					refreshToken,
				},
			},
			200
		);
	} catch (error) {
		res.send(
			{
				message: error.message,
			},
			401
		);
	}
});

const doesUserExistInDb = async (email) => {
	const user = await UserModel.findOne({ email });
	if (user) return true;
	return false;
};

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

// admin only route
userRoute.get("/allUsers", async (req, res) => {
	const auth = req.headers.authorization;
	// console.log(access);
	if (auth) {
		try {
			let token = auth.split(" ")[1];
			let verified = jwt.verify(token, "primaryToken");
			if (verified) {
				let role = verified.role;
				if (role === "admin") {
					let users = await UserModel.find({});
					res.send(users);
				} else {
					res.send({ message: "only admins are allowed" }, 401);
				}
			}
		} catch (error) {
			res.send(error.message);
		}
	} else {
		res.send(403);
	}
});
// userRoute.delete("/:user_id", async (req, res) => {
// 	const token = req.headers;
// });

// get details of logged in user.
userRoute.get("/", async (req, res) => {
	const authorization = req.headers.authorization;
	if (authorization) {
		const auth = authorization.split(" ");
		const token = {};
		token.refreshToken = auth[1];
		// console.log(token.refreshToken);
		try {
			let data = jwt.verify(token.refreshToken, "refreshToken");
			// console.log(data);
			if (data.email) {
				delete data.iat;
				delete data.exp;
				token.primaryToken = jwt.sign(data, "primaryToken");
				res.send({ user: data, tokens: token });
			} else {
				res.send(403);
			}
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
