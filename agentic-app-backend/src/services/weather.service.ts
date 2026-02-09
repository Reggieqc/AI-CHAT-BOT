export class WeatherService {
    static async fetchWeatherData(location: string): Promise<any> {
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=no`;

        const response = await fetch(url);

        if(!response.ok){
            throw new Error(`Weather API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
}