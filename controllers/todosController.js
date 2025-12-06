import Todo from "../models/Todo.js";

// GET todos pentru o anumită listă a unui user
export const getTodos = async (req, res) => {
  // console.log("😡 req.params", req.params);

  const { userId, listName } = req.params;
  try {
    const todos = await Todo.find({ userId, listName }).sort({ createdAt: 1 });
    // if (!todos.length) {
    //   return res.status(200).json([]);
    // }
    res.json(todos);
  } catch (err) {
    console.error("Error getting todos:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST - adaugă un todo
export const addTodo = async (req, res) => {
  const { userId, listName } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Todo text is required" });
  }

  try {
    const newTodo = await Todo.create({
      userId,
      listName,
      text: text.trim(),
    });
    res.status(201).json(newTodo);
  } catch (err) {
    console.error("Error adding todo:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH - update un todo
export const updateTodo = async (req, res) => {
  const { userId, listName, id } = req.params;
  const updates = req.body;

  console.log("🔧 PATCH /todos - Received updates:", updates);
  console.log("🔧 Params:", { userId, listName, id });

  try {
    // Separă câmpurile care trebuie setate vs. cele care trebuie șterse
    const $set = {};
    const $unset = {};

    Object.keys(updates).forEach((key) => {
      if (
        updates[key] === undefined ||
        updates[key] === null ||
        updates[key] === ""
      ) {
        $unset[key] = 1; // Șterge câmpul
      } else {
        $set[key] = updates[key]; // Actualizează câmpul
      }
    });

    const updateQuery = {};
    if (Object.keys($set).length > 0) updateQuery.$set = $set;
    if (Object.keys($unset).length > 0) updateQuery.$unset = $unset;

    console.log("🔧 Update query:", updateQuery);

    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: id, userId, listName },
      updateQuery,
      { new: true }
    );
    console.log("✅ Updated todo:", updatedTodo);
    if (!updatedTodo) return res.status(404).json({ error: "Todo not found" });
    res.json(updatedTodo);
  } catch (err) {
    console.error("Error updating todo:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE un todo
export const deleteTodo = async (req, res) => {
  const { userId, listName, id } = req.params;

  try {
    await Todo.findOneAndDelete({ _id: id, userId, listName });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting todo:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE toate todos dintr-o listă
export const deleteTodos = async (req, res) => {
  const { userId, listName } = req.params;

  try {
    await Todo.deleteMany({ userId, listName });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting todos:", err);
    res.status(500).json({ error: "Server error" });
  }
};
