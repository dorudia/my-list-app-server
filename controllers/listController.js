import List from "../models/List.js";

// Creare listă
export const createList = async (req, res) => {
  try {
    const { name, userId } = req.body;
    const existing = await List.findOne({ name, userId });
    if (existing) return res.status(400).json({ error: "List already exists" });

    const list = await List.create({ name, userId });
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Obține listele unui user
export const getUserLists = async (req, res) => {
  try {
    const { userId } = req.params;
    const lists = await List.find({ userId });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Ștergere listă
export const deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    await List.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
