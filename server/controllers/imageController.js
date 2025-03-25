import axios from "axios";
import userModel from "../config/models/userModel.js";
import FormData from "form-data";

export const generateImage = async (req, res) => {
  try {
    const { userId, prompt } = req.body;

    const user = await userModel.findById(userId);

    if (!user || !prompt) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (user.creditBalance <= 0) {
        console.log("User Data:", user);
        console.log("User Credit Balance:", user.creditBalance);

      return res.json({
        success: false,
        message: "No Credit Balance",
        creditBalance: user.creditBalance,
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
        },
        responseType: "arraybuffer"
      }
    );

    const base64Image = Buffer.from(data, "binary").toString("base64");
    const resultImage = `data:image/png;base64,${base64Image}`;

    // ✅ Update credit balance
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      { $inc: { creditBalance: -1 } },
      { new: true } // Return the updated user document
    );

    res.json({
      success: true,
      message: "Image Generated",
      creditBalance: updatedUser.creditBalance, // ✅ Send updated credit balance
      resultImage,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
