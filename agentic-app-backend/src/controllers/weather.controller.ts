import type { Request, Response } from "express";
import { WeatherService } from "../services/weather.service.ts";

export class WeatherController {
  static async getWeatherData(req: Request, res: Response) {
    try {
      const { q } = req.query || "London";

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Query parameter 'q' is required. Example: ?q=London",
        });
      }

      const data = await WeatherService.fetchWeatherData(String(q));
      return res.json({ success: true, data });
    } catch (error) {
      console.error("Weather API error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch weather data",
      });
    }
  }
}
