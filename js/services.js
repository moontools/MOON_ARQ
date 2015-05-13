app.factory('mtlGdrive',function(){
    
    // Variáveis locais
    var _clientId = '';
    var _scopes = '';
    var driveApi = {};
    
    // Seta o ID do cliente da API Google
    driveApi.setClientId = function(clientId){
        _clientId = clientId; 
    };
    
    // Seta o Scopo da API Google
    driveApi.setScopes = function(scopes){
        _scopes = scopes;
    };
   
    /**
    * Verifica se o usuário corrente autorizou a aplicação
    */
    driveApi.checkAuth = function() {
        // Verifica se a API do Google foi carregada
        if (typeof gapi.auth !== 'undefined') {
            // Caso positivo verifica a autorização do usuário
            console.log('Drive API Carregada...');
            console.log("verificando Autenticação");
            gapi.auth.authorize(
               {'client_id': _clientId, 'scope': _scopes, 'immediate': true},
               handleAuthResult);
        }else{
            // Caso negativo entra em looping aguardando o carregamento
            handleClientLoad();
        }
    }; 
    
    
    /**
    * Função chamada enquando a API do Google esta sendo carregada
    */
    handleClientLoad = function () {
        console.log("Carregando Drive API...");
        window.setTimeout(driveApi.checkAuth, 1);			
    };
    
    
    /**
     * Função executada assim que é verificação de autorização do usuário é executada
     */
    handleAuthResult = function(authResult){
        // Verifcica se o usuário autorizou a aplicação
        if (authResult && !authResult.error) {
            console.log("Autenticado com sucesso!");
        }else{
            // Caso negativo exibe tela de autenticação
            gapi.auth.authorize(
                  {'client_id': _clientId, 'scope': _scopes, 'immediate': false},
                  handleAuthResult);
        }
    };
    
    
    /**
     * Inicia o upload do arquivo
     *
     * @param {Object} evt Arguments from the file selector.
     */
    uploadFile = function(evt) {
      gapi.client.load('drive', 'v2', function() {
        var file = evt.target.files[0];
        insertFile(file);
      });
    };
    
    
    /**
     * Enviar arquivo para o Drive.
     *
     * @param {File} fileData Objeto arquivo.
     * @param {Function} callback Função a ser executada ao final da requisição.
     */
    driveApi.insertFile = function(fileData, callback) {
        console.log("Estou enviando o arquivo...");
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        var reader = new FileReader();
        reader.readAsBinaryString(fileData);
        reader.onload = function(e) {
          var contentType = fileData.type || 'application/octet-stream';
          var metadata = {
            'title': fileData.name,
            'mimeType': contentType
          };

          var base64Data = btoa(reader.result);
          var multipartRequestBody =
              delimiter +
              'Content-Type: application/json\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              'Content-Type: ' + contentType + '\r\n' +
              'Content-Transfer-Encoding: base64\r\n' +
              '\r\n' +
              base64Data +
              close_delim;

          var request = gapi.client.request({
              'path': '/upload/drive/v2/files',
              'method': 'POST',
              'params': {'uploadType': 'multipart'},
              'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
              },
              'body': multipartRequestBody});
          if (!callback) {
            callback = function(file) {
              console.log(file)
            };
          }
          request.execute(callback);
        };
    };
    
    return driveApi;
    
});

app.factory('googleSheet',function($http){
    
    // Variáveris Globais
    var _urlBaseApi = 'https://script.google.com/a/macros/moontools.com.br/s/AKfycbxstp_IrA2oAvOL1EltTm_ocpLW1p5_RcOPQrmKk54/dev',
        _urlApi = '',
        _spreadSheetId = '',
        _sheetName ='';
    var googleSheet = {};
    
    /**
     * Seta o Id da planilha a ser manipulada pela API
     * @param {type} spreadSheetId Id da planilha do Google
     */
    googleSheet.setSpreadSheetId = function(spreadSheetId){
        _spreadSheetId = spreadSheetId;
        googleSheet.configParamsDefaults();
    };
    
    
    /**
     * Seta o nome da página a ser manipulada pela API
     * @param {type} sheetName Nome página
     */
    googleSheet.setSheetName = function(sheetName){
        _sheetName = sheetName;
        googleSheet.configParamsDefaults();
    };
    
    /**
     * Configura o url com algums parâmetros defaul
     */
    googleSheet.configParamsDefaults = function(){
        _urlApi = _urlBaseApi+"?callback=JSON_CALLBACK&spreadSheetId="+_spreadSheetId+"&sheetName="+_sheetName;
        console.log(_urlApi)
    };
    
    /**
     * Insere um novo registro na planilha
     * @param {object} record Objeto com os dados a serem inseridos
     * @param {function} callback Função a ser executada ao fim da requisição
     */
    googleSheet.insertRecord = function(record, callback){
        var params = {
            metodo:"insertRecord", 
            dados:record};
        googleSheet.request(params,callback);   
    };
    
    /**
     * Remove um registro da planilha
     * @param {string} type Tipo de busca a ser feita para encontrar o registro
     *                 EX: "linha","Código" ou pelo Cabelçaho de preferência
     * @param {type} value Valor a ser procurado
     * @param {type} callback Função a ser executada ao fim da requisição 
     */
    googleSheet.removeRecord = function(type,value,callback){
        var params = {
            metodo:"removeRecord", 
            type:type,
            value:value};
        googleSheet.request(params,callback);   
    };
    
    /**
     * Atualiza um registro da planilha
     * @param {object} record Dados a serem atualizados
     * @param {string} type Tipo de busca a ser feita para encontrar o registro
     *                 EX: "linha","Código" ou pelo Cabelçaho de preferência
     * @param {type} value Valor a ser procurado
     * @param {type} callback Função a ser executada ao fim da requisição
     */
    googleSheet.updateRecord = function(record, type, value, callback){
       var params = {
           metodo:"updateRecord",
           dados:record,
           type:type,
           value:value};
       googleSheet.request(params,callback); 
    };
    
    
    /**
     * Retorna um registro da planilha
     * @param {string} type Tipo de busca a ser feita para encontrar o registro
     *                 EX: "linha","Código" ou pelo Cabelçaho de preferência
     * @param {type} value Valor a ser procurado
     * @param {type} callback Função a ser executada ao fim da requisição
     */
    googleSheet.getRecord = function(type, value, callback){
       var params = {
           metodo:"getRecord",
           type:type,
           value:value};
       googleSheet.request(params,callback);
    };
    
    /**
     * Retorna um registro da planilha
     * @param {string} returnType Tipo do retorno esperado
     *                 Ex: "arrayAssociative" -> Para obter o retorno no formato de um array associativo
     *                 Ex: "array" -> Para objer o retorno no formato de um array normal
     * @param {type} callback Função a ser executada ao fim da requisição
     */
    googleSheet.getAllRecords = function(returnType, callback){
       var params ={
           metodo:"getAllRecords",
           returnType:returnType
       };
       googleSheet.request(params,callback);
    };
    
    /**
     * Retorna todos os dados das colunas informadas
     * @param {array} columns Array com os nomes das colunas desejadas 
     *                  Obs: o nome da coluna deve esta no formato de cabeçalhos normalizados Ex: "Nome Pessoa" -> "nomePessoa"
     */
    googleSheet.getColumnData = function(columns,returnType, callback){
       var params ={
           metodo:"getColumnData",
           columns:new Array(columns),
           returnType:returnType
       };
       googleSheet.request(params,callback);
    };
    
    
    /**
     * Executa requisoção para API do AppScript
     * @param {object} params Parâmetros que serão enviados para API
     * @param {type} callback Funçã
     */
    googleSheet.request = function(params,callback){
        $http({url:_urlApi,
               method:"jsonp",
               params:params
        }).success(function(data, status, headers, config){
           callback(data.data, data.status, data.message);
        }).error(function(data, status, headers, config){
            callback(data.data, data.status, data.message);
        });     
        
    };
    return googleSheet;
    
});

