document
  .getElementById("cfdiForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent the default form submission

    const fileInput = document.getElementById("xmlFile");
    const responseDiv = document.getElementById("response");

    const loadingMessage = document.createElement("div");
    loadingMessage.innerHTML = "<h3>Cargando...</h3>"; // Create a loading message
    responseDiv.innerHTML = ""; // Clear previous responses
    responseDiv.appendChild(loadingMessage); // Display loading message

    if (fileInput.files.length === 0) {
      responseDiv.innerHTML =
        "<h2>Error:</h2><p>Please upload an XML file.</p>";
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
      const xmlString = event.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // Extract values from the XML
      const rfcEmisorElement = xmlDoc.getElementsByTagName("cfdi:Emisor")[0];
      const rfcEmisor = rfcEmisorElement.getAttribute("Rfc");
      const nombreEmisor = rfcEmisorElement.getAttribute("Nombre");
      console.log(nombreEmisor);

      const rfcReceptorElement =
        xmlDoc.getElementsByTagName("cfdi:Receptor")[0];
      const rfcReceptor = rfcReceptorElement.getAttribute("Rfc");
      console.log(rfcReceptor);

      const totalFacturadoElement =
        xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
      const totalFacturado = totalFacturadoElement.getAttribute("Total");
      console.log(totalFacturado);

      //const uuidTimbrado = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[3].textContent;
      const uuidTimbradoElement = xmlDoc.getElementsByTagName(
        "tfd:TimbreFiscalDigital"
      )[0];
      const uuidTimbrado = uuidTimbradoElement.getAttribute("UUID");
      console.log(uuidTimbrado);

      try {
        const response = await fetch("/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rfcEmisor,
            rfcReceptor,
            totalFacturado,
            uuidTimbrado,
          }),
        });

        //const data = await response.text(); // Assuming the response is in text format
        //console.log(data);
        //responseDiv.innerHTML = `<h2>Respuesta:</h2><pre>${data} ${nombreEmisor}</pre>`;

        const data = await response.text(); // Assuming the response is in text format
        console.log(data);

        // Parse the XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");

        // Extract values from the XML
        const codigoEstatus =
          xmlDoc.getElementsByTagName("a:CodigoEstatus")[0].textContent;
        const esCancelable =
          xmlDoc.getElementsByTagName("a:EsCancelable")[0].textContent;
        const estado = xmlDoc.getElementsByTagName("a:Estado")[0].textContent;
        const estatusCancelacion =
          xmlDoc.getElementsByTagName("a:EstatusCancelacion")[0].textContent ||
          "N/A"; // Handle empty values
        const validacionEFOS =
          xmlDoc.getElementsByTagName("a:ValidacionEFOS")[0].textContent;

        let textoEFOS = "";

        if (validacionEFOS === "100") {
          textoEFOS = `El emisor de la factura verificada se encuentra publicado en la lista
de empresas que facturan operaciones simuladas de conformidad
con los párrafos primero al quinto del Artículo 69-B del CFF.`;
        } else if (validacionEFOS === "200") {
          textoEFOS = `El emisor del CFDI no se encuentra dentro de la lista de Empresa que Factura Operaciones Simuladas (EFOS).`;
        } else if (validacionEFOS === "101") {
          textoEFOS = `El RFC emisor y algún RFC a cuenta de terceros de la factura verificada,
se encuentran publicados en la lista de empresas que facturan
operaciones simuladas de conformidad con los párrafos primero al
quinto del artículo 69-b del CFF.
`;
        } else if (validacionEFOS === "102") {
          textoEFOS = `El RFC a cuenta de terceros de la factura verificada, se encuentran
publicados en la lista de empresas que facturan operaciones
simuladas de conformidad con los párrafos primero al quinto del
artículo 69-b del CFF.`;
        } else if (validacionEFOS === "103") {
          textoEFOS = `Alguno de los RFC a cuenta de terceros de la factura verificada, se
encuentra publicado en la lista de empresas que facturan operaciones
simuladas de conformidad con los párrafos primero al quinto del
artículo 69-b del CFF.`;
        } else if (validacionEFOS === "104") {
          textoEFOS = `El RFC del emisor y alguno de los RFC a cuenta de terceros de la
factura verificada, se encuentran publicados en la lista de empresas
que facturan operaciones simuladas de conformidad con los párrafos
primero al quinto del artículo 69-b del CFF.`;
        } else if (validacionEFOS === "201") {
          textoEFOS = `El emisor del CFDI
y ninguno de los RFC A cuenta de terceros se encuentra dentro de la lista de Empresa
que Factura Operaciones Simuladas (EFOS).
`;
        }


        // Create a table to display the extracted data
        const tableHTML = `
      <div id="printable_div_id">
      <div class="title-container">
      <p class="subtext">Resultados de Validación de CFDI</p>
  <h2>Comprobante ${estado}</h2>
  </div>
  <table>
    <tbody>
      <tr>
        <th>Código Estatus</td>
        <td>${codigoEstatus}</td>
      </tr>
      <tr>
        <th>Es Cancelable</td>
        <td>${esCancelable}</td>
      </tr>
      <tr>
        <th>Estado</td>
        <td>${estado}</td>
      </tr>
      <tr>
        <th>Estatus Cancelación</td>
        <td>${estatusCancelacion}</td>
      </tr>
      <tr>
        <th>Validación EFOS</td>
        <td>${validacionEFOS}<br><span class="subtext">${textoEFOS}</span></td>
      </tr>
    </tbody>
  </table>
  
  <h3>Detalles del Comprobante</h3>
  <table>
    <tbody>
      <tr>
        <th>Emisor</td>
        <td>${nombreEmisor}</td>
      </tr>
      <tr>
        <th>RFC</td>
        <td>${rfcEmisor}</td>
      </tr>
      <tr>
        <th>Total Facturado</td>
        <td>$${Number(totalFacturado).toFixed(2)}</td>
      </tr>
      <tr>
        <th>Folio Fiscal</td>
        <td>${uuidTimbrado.toUpperCase()}</td>
      </tr>
    </tbody>
  </table>
  
  </div>
    <div class="print-button-container">
      <button onclick="printdiv('printable_div_id');" class="outline-button">Imprimir</button>
      </div>

`;

        responseDiv.innerHTML = tableHTML;
      } catch (error) {
        console.error("Error:", error);
        responseDiv.innerHTML = `<h2>Error:</h2><p>${error.message}</p>`;
      }
    };

    reader.onerror = function () {
      responseDiv.innerHTML =
        "<h2>Error:</h2><p>Failed to read the XML file.</p>";
    };

    reader.readAsText(file);
  });

function printdiv(elem) {
  var header_str =
    "<html><head><title>" + document.title + "</title></head><body>";
  var footer_str = "</body></html>";
  var new_str = document.getElementById(elem).innerHTML;
  var old_str = document.body.innerHTML;
  document.body.innerHTML = header_str + new_str + footer_str;
  window.print();
  document.body.innerHTML = old_str;
  return false;
}
