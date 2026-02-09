import express from "express";
import { WeatherController } from "../controllers/weather.controller.ts";  

const router = express.Router();

router.get("/", WeatherController.getWeatherData);

export default router;