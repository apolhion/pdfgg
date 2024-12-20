const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

function generateRandomHex(size) {
  return crypto.randomBytes(size).toString('hex').toUpperCase();
}

function generateHtmlContent(quem_recebe_nome, quem_recebe_cpf, quem_recebe_instituicao, quem_recebe_chave) {
  const data_hora = new Date().toLocaleString('pt-BR');
  const numero_controle = generateRandomHex(12);
  const autenticacao = `${generateRandomHex(16)} ${generateRandomHex(8)}=`;

  const valor_transferencia = "R$ 1.000,00";
  const tarifa = "R$ 0,00";
  const descricao = "Corrente";
  const debito_de = "Poupança";

  return `
    <html lang="pt-BR"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprovante Pix</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #000;
            margin: 20px;
        }
        h1 {
            color: #d50000;
            font-size: 22px;
            margin-bottom: 0;
        }
        h2 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .auth {
            font-family: monospace;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
  <body style="padding: 2rem">
    <h1>bradesco</h1>
    <h2 style="display: flex; justify-content: center; margin-bottom: 0;">Comprovante Pix</h2>
    <p style="display: flex; justify-content: center;">Transferência agendada para chave Pix</p>

    <div class="section">
        <div><strong>Data e hora:</strong> ${data_hora}</div>
        <div><strong>Número de Controle:</strong> ${numero_controle}</div>
    </div>

    <div class="section">
        <div class="section-title">DADOS DA CONTA</div>
        <div><strong>Nome:</strong> Virginia Fonseca Costa</div>
        <div><strong>CPF:</strong> ***.907.070-**</div>
        <div><strong>Instituição:</strong> Banco Bradesco S.A</div>
    </div>

    <div class="section">
        <div class="section-title">DADOS DE QUEM RECEBEU</div>
        <div><strong>Nome:</strong> ${quem_recebe_nome}</div>
        <div><strong>CPF/CNPJ:</strong> ${quem_recebe_cpf}</div>
        <div><strong>Instituição:</strong> ${quem_recebe_instituicao}</div>
        <div><strong>Chave:</strong> ${quem_recebe_chave}</div>
    </div>

    <div class="section">
        <div class="section-title">DADOS DA TRANSFERÊNCIA</div>
        <div><strong>Valor:</strong> ${valor_transferencia}</div>
        <div><strong>Tarifa:</strong> ${tarifa}</div>
        <div><strong>Descrição:</strong> ${descricao}</div>
        <div><strong>Data e hora:</strong> ${data_hora}</div>
        <div><strong>Debitado da:</strong> ${debito_de}</div>
        <div>Transação concluída pelo Bradesco Celular</div>
    </div>

    <div class="section">
        <div class="section-title">AUTENTICAÇÃO</div>
        <div class="auth">${autenticacao}</div>
    </div>
  </body></html>
  `;
}

app.get('/comprovante', async (req, res) => {
  const quem_recebe_nome = req.query.nome || 'Nome não informado';
  const quem_recebe_cpf = req.query.cpf || 'CPF não informado';
  const quem_recebe_instituicao = req.query.instituicao || 'Instituição não informada';
  const quem_recebe_chave = req.query.chave || 'Chave não informada';

  const htmlContent = generateHtmlContent(quem_recebe_nome, quem_recebe_cpf, quem_recebe_instituicao, quem_recebe_chave);

  try {
    const outputDir = path.join(__dirname, 'jpgs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const jpgFileName = `comprovante_${Date.now()}.jpg`;
    const jpgPath = path.join(outputDir, jpgFileName);

    // Usando Puppeteer diretamente para gerar a imagem (JPEG)
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--headless',
        '--disable-gpu',
        '--window-size=1280x1024'
      ],
      headless: true,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.setViewport({ width: 600, height: 900 });

    // Gerando imagem JPEG
    await page.screenshot({
      path: jpgPath,
      type: 'jpeg',
      quality: 100,
    });

    await browser.close();

    res.json({
      success: true,
      jpg_file: jpgFileName,
    });
  } catch (error) {
    console.error('Erro ao gerar a imagem:', error);
    res.json({ success: false, error: error.message });
  }
});

app.use('/comprovantes', express.static(path.join(__dirname, 'jpgs')));

app.get('/', (req, res) => {
  return res.send("ok1");
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
