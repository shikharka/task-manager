const { Router } = require("express");
const multer = require("multer");
const sharp = require("sharp");
const router = new Router();
const auth = require("../middleware/auth");
const User = require("../models/user");

router.post("/users", async (request, response) => {
  const user = new User(request.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    response.status(201).send({ user, token });
  } catch (error) {
    response.status(400).send(error);
  }
});

router.post("/users/login", async (request, response) => {
  try {
    const user = await User.findByCredentials(
      request.body.email,
      request.body.password
    );
    const token = await user.generateAuthToken();
    response.send({ user, token });
  } catch (error) {
    response.status(400).send();
  }
});

router.post("/users/logout", auth, async (request, response) => {
  try {
    request.user.tokens = request.user.tokens.filter(
      (token) => token.token !== request.token
    );
    await request.user.save();

    response.send();
  } catch (error) {
    console.log(error);
    response.status(500).send();
  }
});

router.post("/users/logout-all", auth, async (request, response) => {
  try {
    request.user.tokens = [];
    await request.user.save();

    response.send();
  } catch (error) {
    console.log(error);
    response.status(500).send();
  }
});

router.get("/users/me", auth, async (request, response) => {
  response.send(request.user);
});

router.patch("/users/me", auth, async (request, response) => {
  const updates = Object.keys(request.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidRequest = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidRequest) {
    return response.status(400).send({ error: "Invalid Updates" });
  }

  try {
    updates.forEach((update) => (request.user[update] = request.body[update]));
    await request.user.save();

    response.send(request.user);
  } catch (error) {
    console.log(error.message);
    response.status(400).send(error);
  }
});

router.delete("/users/me", auth, async (request, response) => {
  try {
    await request.user.remove();
    response.send(request.user);
  } catch (error) {
    response.status(400).send(error);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

router.get("/users/:id/avatar", async (request, response) => {
  try {
    const user = await User.findById(request.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    response.set("Content-Type", "image/png");
    response.send(user.avatar);
  } catch (error) {
    response.status(404).send();
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (request, response) => {
    const buffer = await sharp(request.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    request.user.avatar = buffer;
    await request.user.save();
    response.send();
  },
  (error, request, response, next) => {
    response.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (request, response) => {
  request.user.avatar = undefined;
  await request.user.save();
  response.send();
});

module.exports = router;
