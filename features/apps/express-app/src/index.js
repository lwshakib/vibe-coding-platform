import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 8000;

const startServer = () => {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

startServer();
