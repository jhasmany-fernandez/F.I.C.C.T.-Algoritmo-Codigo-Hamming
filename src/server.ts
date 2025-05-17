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

// Función para generar la tabla estilo matriz de codificación Hamming
function generateHammingMatrixTable(dataBits: number[]): string {
  const m = dataBits.length;
  const r = calculateParityBits(m);
  const n = m + r;
  const code = encodeHamming(dataBits);

  // Generar fila de posiciones en binario y decimal
  let html = "<table border='1' cellpadding='5' cellspacing='0'><thead><tr><th>Posición</th>";
  for (let i = 1; i <= n; i++) {
    const binPos = i.toString(2).padStart(4, "0");
    // Mostrar p o d según sea paridad o dato, y binario + decimal
    if (isPowerOfTwo(i)) {
      html += `<th>p<sub>${Math.log2(i) + 1}</sub><br>${binPos}<br>(${i})</th>`;
    } else {
      const dataIndex = i - 1 - Math.floor(Math.log2(i)); // solo para etiqueta d (no exacto, pero para ilustrar)
      html += `<th>d<br>${binPos}<br>(${i})</th>`;
    }
  }
  html += "</tr></thead><tbody>";

  // Fila palabra original (solo datos en sus posiciones)
  html += "<tr><td>Palabra original</td>";
  for (let i = 1, dataIdx = 0; i <= n; i++) {
    if (isPowerOfTwo(i)) {
      html += "<td></td>";
    } else {
      html += `<td>${dataBits[dataIdx++]}</td>`;
    }
  }
  html += "</tr>";

  // Filas para cada bit de paridad mostrando qué posiciones controla (1 o vacío)
  for (let i = 0; i < r; i++) {
    const parityPos = Math.pow(2, i);
    html += `<tr><td>p<sub>${i + 1}</sub></td>`;
    for (let j = 1; j <= n; j++) {
      if ((j & parityPos) !== 0) {
        html += `<td>1</td>`;
      } else {
        html += `<td></td>`;
      }
    }
    html += "</tr>";
  }

  // Fila palabra codificada con paridad
  html += "<tr><td>Palabra + paridad</td>";
  for (let i = 0; i < n; i++) {
    html += `<td>${code[i]}</td>`;
  }
  html += "</tr>";

  html += "</tbody></table>";

  return html;
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
    // Aquí generamos la tabla en el nuevo formato
    const tableHtml = generateHammingMatrixTable(data);

    html += `<h3>Codificación paso a paso</h3>`;
    html += tableHtml;

  } else if (action === "decode") {
    const code = dataBits.split("").map(Number);

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
