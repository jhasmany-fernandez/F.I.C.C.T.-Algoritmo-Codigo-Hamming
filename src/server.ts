import express, { Request, Response } from "express";
import path from "path";
import {
  calculateParityBits,
  isPowerOfTwo,
  encodeHamming,
  detectAndCorrect,
} from "./hamming/hamming";

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

interface SubmitBody {
  dataBits: string;
  action: "encode" | "decode";
}

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "form.html"));
});
app.post("/submit", (req: Request, res: Response): void => {
  const { dataBits, action } = req.body as SubmitBody;

  if (!dataBits || !/^[01]+$/.test(dataBits)) {
    res.status(400).send("Error: Debe ingresar una cadena binaria válida.");
    return;
  }

  let html = `<h2>Proceso Código Hamming</h2>`;
  html += `<p><b>Bits ingresados:</b> ${dataBits}</p>`;

  if (action === "encode") {
    const data = dataBits.split("").map(Number);
    const encoded = encodeHamming(data);

    html += `<h3>Codificación paso a paso</h3>`;
    html += `<p>Bits de datos (m): ${data.length}</p>`;
    const r = calculateParityBits(data.length);
    html += `<p>Bits de paridad calculados (r): ${r}</p>`;
    html += `<p>Longitud total (n = m + r): ${data.length + r}</p>`;

    html += `<table border="1" cellpadding="5" cellspacing="0">
      <thead><tr><th>Posición</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>`;

    for (let i = 0; i < encoded.length; i++) {
      const pos = i + 1;
      let tipo = "";
      if (isPowerOfTwo(pos)) {
        tipo = `Paridad p<sub>${Math.log2(pos) + 1}</sub>`;
      } else {
        const di = data
          .slice(0, i + 1)
          .filter((_, idx) => !isPowerOfTwo(idx + 1)).length;
        tipo = `Dato d<sub>${di}</sub>`;
      }
      html += `<tr><td>${pos}</td><td>${tipo}</td><td>${encoded[i]}</td></tr>`;
    }
    html += "</tbody></table>";

  } else if (action === "decode") {
    const code = dataBits.split("").map(Number);

    // Opcional: validar longitud mínima
    if (code.length < 3) {
      res.status(400).send("Error: La palabra codificada es demasiado corta para procesar.");
      return;
    }

    const [corrected, message] = detectAndCorrect(code);

    html += `<h3>Detección y corrección de errores</h3>`;
    html += `<p>${message}</p>`;

    if (corrected) {
      html += `<p><b>Palabra corregida:</b> ${corrected.join("")}</p>`;
      const dataBitsOnly = corrected.filter((_, i) => !isPowerOfTwo(i + 1));
      html += `<p><b>Bits de datos extraídos:</b> ${dataBitsOnly.join("")}</p>`;
    }
  } else {
    res.status(400).send("Acción inválida.");
    return;
  }

  html += `<br/><a href="/">Volver</a>`;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
