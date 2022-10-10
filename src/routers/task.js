const { Router } = require("express");
const auth = require("../middleware/auth");
const Task = require("../models/task");

const router = new Router();

router.post("/tasks", auth, async (request, response) => {
  const task = new Task({
    ...request.body,
    owner: request.user._id,
  });

  try {
    await task.save();
    response.status(201).send(task);
  } catch (error) {
    response.status(400).send(error);
  }
});

router.get("/tasks", auth, async (request, response) => {
  let match = {};
  let sort = {};

  if (request.query.completed) {
    match.completed = request.query.completed === "true";
  }

  if (request.query.sortBy) {
    const sortByArgs = request.query.sortBy.split("_");
    sort[sortByArgs[0]] = sortByArgs[1] === "desc" ? -1 : 1;
  }

  try {
    await request.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(request.query.limit),
        skip: parseInt(request.query.skip),
        sort,
      },
    });

    response.send(request.user.tasks);
  } catch (error) {
    response.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (request, response) => {
  try {
    const task = await Task.findOne({
      _id: request.params.id,
      owner: request.user._id,
    });

    if (!task) {
      return response.status(404).send();
    }
    response.send(task);
  } catch (error) {
    response.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (request, response) => {
  const updates = Object.keys(request.body);
  const allowedUpdates = ["description", "completed"];
  const isValidRequest = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidRequest) {
    return response.status(400).send({ error: "Invalid Updates" });
  }

  try {
    const task = await Task.findOne({
      _id: request.params.id,
      owner: request.user._id,
    });

    if (!task) {
      return response.status(404).send();
    }

    updates.forEach((update) => (task[update] = request.body[update]));
    await task.save();

    response.send(task);
  } catch (error) {
    response.status(400).send(error);
  }
});

router.delete("/tasks/:id", auth, async (request, response) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: request.params.id,
      owner: request.user._id,
    });

    if (!task) {
      return response.status(404).send();
    }
    response.send(task);
  } catch (error) {
    response.status(400).send(error);
  }
});

module.exports = router;
