const http = require('http');
const axios = require('axios');
const xml2js = require('xml2js');

const hostname = process.env.server || '127.0.0.1';
const port = process.env.port || 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const data = JSON.parse(body);
      const cnpjEntrega = data.Header.CNPJEntrega;
      

      const xmlBody = `
        <?xml version="1.0"?>
        <arquivo>
          <info>  
            <nome-remetente>NOME EMPRESA REMETENTE</nome-remetente>
            <nome-destinatario>BR SUPPLY</nome-destinatario>
            <key>WBS-EXT00000-XXXXX-ID00000</key>
            <auth>12345</auth>
          </info>
          <det-pedidos>
            <pedido>
              <referencia>4500000001</referencia>   
              <cnpj>${cnpjEntrega}</cnpj>
              <cod-local>A123</cod-local>
              <usuario>ti@brsupply.com.br</usuario>
              <observacao>Espaço para observação referente ao pedido</observacao>
              <cod-categoria>25</cod-categoria>
              <det-itens>
                <item>
                  <cod-brsupply>004513</cod-brsupply>
                  <cod-cliente>10.2125.123</cod-cliente>
                  <quantidade>10</quantidade>
                  <vlr-unitario>4,50</vlr-unitario>
                  <ordem-item>4500000001</ordem-item>
                  <sequencia-item>10</sequencia-item>
                </item>
              </det-itens>
            </pedido>
          </det-pedidos> 
        </arquivo>
      `;

      axios.post('http://wbsvc.brsupply.com.br/webserviceimp/wsimppedido.exe/imppedido', xmlBody, { headers: { 'Content-Type': 'text/xml' } })
        .then(response => {
          xml2js.parseString(response.data, (err, result) => {
            if (err) {
              console.error(err);
              res.statusCode = 500;
              res.end('Erro ao processar resposta da API');
            } else {
              const processamento = result.arquivo.processamento[0];
              res.setHeader('Content-Type', 'text/plain');
              res.end(processamento);
            }
          });
        })
        .catch(error => {
          console.error(error);
          res.statusCode = 500;
          res.end('Erro ao enviar pedido para outra API');
        });
    });
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Endpoint não encontrado');
  }
});

server.listen(port, hostname, () => {
  console.log(`Servidor rodando em http://${hostname}:${port}/`);
});
