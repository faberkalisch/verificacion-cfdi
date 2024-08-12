const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());



app.post('/proxy', async (req, res) => {
    const { rfcEmisor, rfcReceptor, totalFacturado, uuidTimbrado } = req.body;

    const url = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc';
    const soapMessage = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
        <soapenv:Header/>
        <soapenv:Body>
            <tem:Consulta>
                <tem:expresionImpresa><![CDATA[?re=${rfcEmisor}&rr=${rfcReceptor}&tt=${totalFacturado}&id=${uuidTimbrado}]]></tem:expresionImpresa>
            </tem:Consulta>
        </soapenv:Body>
    </soapenv:Envelope>`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IConsultaCFDIService/Consulta'
            },
            body: soapMessage
        });

        const textResponse = await response.text();
        res.send(textResponse);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al obtener estatus de CFDI');
    }
});

app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
});