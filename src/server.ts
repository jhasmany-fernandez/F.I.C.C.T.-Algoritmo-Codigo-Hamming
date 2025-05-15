import express, { Request, Response } from "express";
import path from "path";
import { encodeHamming, detectAndCorrect } from "./hamming/hamming";

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
// o si envías JSON:
// app.use(express.json());

interface SubmitBody {
  dataBits: string;
}

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "form.html"));
});

app.post("/submit", (req: Request, res: Response) => {
  const { dataBits } = req.body as SubmitBody;

  if (!dataBits || !/^[01]+$/.test(dataBits)) {
    res.send("Error: Debe ingresar una cadena binaria válida.");
    return;
  }

  const data = dataBits.split("").map(Number);
  const encoded = encodeHamming(data);

  res.send(`
    <h2>Resultado Código Hamming</h2>
    <p><b>Bits de datos:</b> ${dataBits}</p>
    <p><b>Palabra codificada:</b> ${encoded.join("")}</p>
    <a href="/">Volver</a>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
