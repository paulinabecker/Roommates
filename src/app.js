import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getRandomUserName } from "./randomUser.js";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/roommate", async (req, res) => {
  try {
    const newRoommateName = await getRandomUserName();
    const newRoommateId = uuidv4();
    const newRoommate = {
      id: newRoommateId,
      nombre: newRoommateName,
      debe: 0,
      recibe: 0,
    };

    let roommatesData = JSON.parse(fs.readFileSync("./data/roommates.json"));
    roommatesData.roommates.push(newRoommate);
    fs.writeFileSync(
      "./data/roommates.json",
      JSON.stringify(roommatesData, null, 2)
    );
    calculo();
    res
      .status(201)
      .json({ message: "Nuevo roommate agregado", roommate: newRoommate });
    console.log("Nuevo roommate agregado:", newRoommate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al agregar roommate" });
  }
});

app.get("/roommates", (req, res) => {
  try {
    const roommates = JSON.parse(fs.readFileSync("./data/roommates.json"));
    console.log("Roommates obtenidos:", roommates);
    res.status(200).json(roommates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener roommates" });
  }
});

app.get("/gastos", (req, res) => {
  try {
    const gastos = JSON.parse(fs.readFileSync("./data/gastos.json"));
    console.log("Gastos obtenidos:", gastos);
    res.status(200).json(gastos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener gastos" });
  }
});

app.post("/gasto", (req, res) => {
  const { roommate, descripcion, monto } = req.body;

  try {
    let gastosData = JSON.parse(fs.readFileSync("./data/gastos.json", "utf-8"));
    gastosData.gastos.push({ id: uuidv4(), roommate, descripcion, monto });
    fs.writeFileSync("./data/gastos.json", JSON.stringify(gastosData, null, 2));

    console.log("Gasto agregado:", { roommate, descripcion, monto });

    calculo();
    res.status(200).json({ message: "Gasto agregado exitosamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al agregar el gasto" });
  }
});

app.put("/gasto/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { roommate, descripcion, monto } = req.body;

    let gastosData = JSON.parse(fs.readFileSync("./data/gastos.json"));

    if (!Array.isArray(gastosData.gastos)) {
      gastosData.gastos = [];
    }

    const index = gastosData.gastos.findIndex((gasto) => gasto.id === id);

    if (index !== -1) {
      gastosData.gastos[index] = { id, roommate, descripcion, monto };

      fs.writeFileSync(
        "./data/gastos.json",
        JSON.stringify(gastosData, null, 2)
      );

      console.log("Gasto actualizado:", gastosData.gastos[index]);
      calculo();
      res.status(200).json({
        message: "Gasto actualizado",
        gasto: gastosData.gastos[index],
      });
    } else {
      console.log("Gasto no encontrado");
      res.status(404).json({ message: "Gasto no encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el gasto" });
  }
});

app.delete("/gasto/:id", (req, res) => {
  try {
    const { id } = req.query;
    let gastosData = JSON.parse(fs.readFileSync("./data/gastos.json"));

    gastosData.gastos = gastosData.gastos.filter((gasto) => gasto.id !== id);

    fs.writeFileSync("./data/gastos.json", JSON.stringify(gastosData, null, 2));
    calculo();
    res.status(200).json({ message: "Gasto eliminado" });
    console.log("Gasto eliminado:", id);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar el gasto" });
  }
});

const calculo = () => {
  const roommatesData = fs.readFileSync("./data/roommates.json", "utf8");
  const gastosData = fs.readFileSync("./data/gastos.json", "utf8");

  const { roommates } = JSON.parse(roommatesData);
  const { gastos } = JSON.parse(gastosData);

  roommates.forEach((roommate) => {
    roommate.debe = 0;
    roommate.recibe = 0;
    roommate.total = 0;
  });
  gastos.forEach((gasto) => {
    const montoPorPersona = gasto.monto / roommates.length;
    roommates.forEach((roommate) => {
      if (gasto.roommate === roommate.nombre) {
        roommate.recibe += montoPorPersona * (roommates.length - 1);
      } else {
        roommate.debe -= montoPorPersona;
      }
      roommate.total = roommate.recibe - roommate.debe;
    });
  });
  fs.writeFileSync("./data/roommates.json", JSON.stringify({ roommates }));
};

export { app, port };
