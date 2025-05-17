import express, { Request, Response } from "express";
import path from "path";
import {
  calculateParityBits,
  isPowerOfTwo,
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

function generateHammingMatrixTableDetailed(dataBits: number[]): string {
  // --- función completa aquí (como arriba) ---
  // (La versión completa está arriba, reemplaza aquí)
  const m = dataBits.length;
  const r = calculateParityBits(m);
  const n = m + r;

  const code: number[] = Array(n).fill(0);
  let dataPos = 0;

  for (let i = 0; i < n; i++) {
    if (!isPowerOfTwo(i + 1)) {
      code[i] = dataBits[dataPos++];
    }
  }

  function getControlledPositions(parityPos: number): number[] {
    let positions = [];
    for (let pos = 1; pos <= n; pos++) {
      if ((pos & parityPos) !== 0) {
        positions.push(pos);
      }
    }
    return positions;
  }

  let html = `<style>
    table { border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid black; padding: 5px; text-align: center; font-family: Arial, sans-serif; }
    th { font-weight: bold; }
    td.position { font-weight: bold; }
    .step { margin-bottom: 20px; }
  </style>`;

  html += `<h4>Estructura base</h4>`;
  html += `<table><thead><tr><th></th>`;
  for (let i = 1; i <= n; i++) {
    const binPos = i.toString(2).padStart(r, "0");
    if (isPowerOfTwo(i)) {
      html += `<th>p<sub>${Math.log2(i) + 1}</sub><br>${binPos}<br>(${i})</th>`;
    } else {
      html += `<th>d<sub>${i}</sub><br>${binPos}<br>(${i})</th>`;
    }
  }
  html += `</tr></thead><tbody>`;

  html += `<tr><td>Posición</td>`;
  for (let i = 1; i <= n; i++) {
    const binPos = i.toString(2).padStart(4, "0");
    html += `<td>${binPos}</td>`;
  }
  html += `</tr>`;

  html += `<tr><td>Palabra original</td>`;
  for (let i = 0; i < n; i++) {
    if (isPowerOfTwo(i + 1)) {
      html += `<td></td>`;
    } else {
      html += `<td>${code[i]}</td>`;
    }
  }
  html += `</tr></tbody></table>`;

  for (let i = 0; i < r; i++) {
    const parityPos = Math.pow(2, i);
    const controlledPositions = getControlledPositions(parityPos);

    let onesCount = 0;
    for (const pos of controlledPositions) {
      if (pos === parityPos) continue;
      if (code[pos - 1] === 1) onesCount++;
    }

    const parity = (onesCount % 2 === 0) ? 0 : 1;
    code[parityPos - 1] = parity;

    html += `<div class="step"><h4>Cálculo bit paridad p<sub>${i + 1}</sub> (posición ${parityPos})</h4>`;
    html += `<table><thead><tr>`;
    for (let pos = 1; pos <= n; pos++) {
      html += `<th>${pos}</th>`;
    }
    html += `<th>Paridad p<sub>${i + 1}</sub></th>`;
    html += `</tr></thead><tbody><tr>`;
    for (let pos = 1; pos <= n; pos++) {
      if (controlledPositions.includes(pos)) {
        html += `<td>${code[pos - 1]}</td>`;
      } else {
        html += `<td>&nbsp;</td>`;
      }
    }
    html += `<td><b>${parity}</b></td>`;
    html += `</tr></tbody></table>`;
    html += `<p>Bit de paridad p<sub>${i + 1}</sub> colocado en posición ${parityPos} con valor ${parity}.</p>`;
    html += `</div>`;
  }

  html += `<h3>Palabra codificada completa</h3>`;
  html += `<table><thead><tr><th></th>`;
  for (let i = 1; i <= n; i++) {
    const binPos = i.toString(2).padStart(r, "0");
    if (isPowerOfTwo(i)) {
      html += `<th>p<sub>${Math.log2(i) + 1}</sub><br>${binPos}<br>(${i})</th>`;
    } else {
      html += `<th>d<sub>${i}</sub><br>${binPos}<br>(${i})</th>`;
    }
  }
  html += `</tr></thead><tbody>`;

  html += `<tr><td>Posición</td>`;
  for (let i = 1; i <= n; i++) {
    const binPos = i.toString(2).padStart(4, "0");
    html += `<td>${binPos}</td>`;
  }
  html += `</tr>`;

  html += `<tr><td>Palabra original</td>`;
  for (let i = 0; i < n; i++) {
    if (isPowerOfTwo(i + 1)) {
      html += `<td></td>`;
    } else {
      html += `<td>${code[i]}</td>`;
    }
  }
  html += `</tr>`;

  for (let i = 0; i < r; i++) {
    const parityPos = Math.pow(2, i);
    const controlledPositions = getControlledPositions(parityPos);

    html += `<tr><td>p<sub>${i + 1}</sub></td>`;
    for (let pos = 1; pos <= n; pos++) {
      if (pos === parityPos) {
        html += `<td><b>${code[pos - 1]}</b></td>`;
      } else if (controlledPositions.includes(pos)) {
        html += `<td>${code[pos - 1]}</td>`;
      } else {
        html += `<td></td>`;
      }
    }
    html += `</tr>`;
  }

  html += `<tr><td>Palabra+paridad</td>`;
  for (let i = 0; i < n; i++) {
    html += `<td>${code[i]}</td>`;
  }
  html += `</tr></tbody></table>`;

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
    const tableHtml = generateHammingMatrixTableDetailed(data);
    html += `<h3>Codificación paso a paso detallada</h3>`;
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
