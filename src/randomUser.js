import axios from "axios";

export async function getRandomUserName() {
  try {
    const response = await axios.get("https://randomuser.me/api/");
    const user = response.data.results[0];
    return `${user.name.first} ${user.name.last}`;
  } catch (error) {
    console.error("Error al obtener usuario aleatorio:", error);
    throw new Error("Error al obtener usuario aleatorio");
  }
}
