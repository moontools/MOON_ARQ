(function(){
    angular.module('mtl.gdrive',[])    
    .factory('mtlGdrive',function(){

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
        driveApi.checkAuth = function(callback) {
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
        var handleClientLoad = function () {
            console.log("Carregando Drive API...");
            window.setTimeout(driveApi.checkAuth, 1);			
        };


        /**
         * Função executada assim que é verificação de autorização do usuário é executada
         */
        var handleAuthResult = function(authResult){
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
        var uploadFile = function(evt) {
          gapi.client.load('drive', 'v2', function() {
            var file = evt.target.files[0];
            insertFile(file);
          });
        };


        /**
         * Enviar arquivo para o Drive.
         *
         * @param {File} fileData Arquivo.
         * @param {array} parents Ids das pastas nas quais deseja inserir o arquivo ou null para inserir na raiz do Drive
         * @param {Function} callback Função a ser executada ao final da requisição.
         */
        driveApi.insertFile = function(fileData,title,parents,callback) {
            boundary = '-------314159265358979323846';
            delimiter = "\r\n--" + boundary + "\r\n";
            close_delim = "\r\n--" + boundary + "--";
            var reader = new FileReader();
            reader.readAsBinaryString(fileData);
            reader.onload = function(e) {
              var contentType = fileData.type || 'application/octet-stream';
              var metadata = {
                'title': !title ? fileData.name : title+"."+fileData.name.split(".")[fileData.name.split(".").length-1],
                'mimeType': contentType
              };

                if(parents){
                    var arrayParents = [];
                    for(var i in parents){
                        arrayParents.push({id:parents[i]});
                    }
                    metadata["parents"] = arrayParents;
                }

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
                  'body': multipartRequestBody
              });
              if (!callback) {
                callback = function(file) {
                  console.log(file)
                };
              }
              request.execute(callback);
            };
        };

        /**
         * Insere uma permissão em determinado arquivo
         * @param {string} fileId Id do arquivo
         * @param {string} role Tipo de permissão Ex: writer, wead e owner
         * @param {string} type Tipo de Contra: Ex: user, group, domain anyone
         * @param {string} value endereço de email
         * @param {Function} callback Função a ser executada ao final da requisição.
         * 
         **/
        driveApi.insertPermission = function(fileId, role, type, value, callback){

            var request = gapi.client.request({
                'path': 'drive/v2/files/'+fileId+'/permissions',
                'method': 'POST',
                'body': {
                    'value': value,
                    'type': type,
                    'role': role }
            });

            if (!callback) {
                callback = function(file) {
                  console.log(file);
                };
            }

            request.execute(callback);
        };

        /**
         * Pega as informações de um arquivo ou pasta pelo ID
         * @param {string} fileId id do arquivo ou pasta
         * @param {Function} callback Função a ser executada ao final da requisição.
         * @returns {undefined}
         */
        driveApi.getInfoFile = function(fileId,callback){
            var params = {
                'path' : 'drive/v2/files/'+fileId,
                'method': 'GET',
                'body': {
                'fileId': fileId}
            };
            request(params,callback);
        };


        /**
         * Lista todos os ítens de uma pasta
         * @param {string} folderId id da pasta
         * @param {Function} callback Função a ser executada ao final da requisição.
         */
        driveApi.listChildrenInFolder = function(folderId,callback){    
            var params = {
                'path':'drive/v2/files/'+folderId+'/children',
                'method':'GET',
                'body': {
                'fileId': folderId}
            };
            request(params,callback); 
        };

        /**
         * Cria uma pasta 
         * @param {array} parents Ids das pastas na qual quer criar a pasta ou null para criar a pasta na raiz do drive
         * @param {string} folderName Nome da pasta
         * @param {Function} callback Função a ser executada ao final da requisição.
         */
        driveApi.createFolder = function(folderName,parents,callback){

            var body = {
                'mimeType': 'application/vnd.google-apps.folder',
                'title':folderName
            };

            if(parents){
                var arrayParents = [];
                for(var i in parents){
                    arrayParents.push({id:parents[i]});
                }
                body["parents"] = arrayParents;
            }

            var params = {
                'path': '/drive/v2/files',
                'method': 'POST',
                'body':body
            };
            request(params,callback);
        };

        driveApi.checkAuth()
        /**
         * Faz requisição pra a API do Drive
         * @param {type} params parâmetros da requisição
         * @param {Function} callback Função a ser executada ao final da requisição.
         * @returns {services_L1.request}
         */
        var request = function(params,callback){
            var request = gapi.client.request(params);

            if (!callback) {
                callback = function(file) {
                  console.log(file);
                };
            }

            request.execute(callback);  
        };


        return driveApi;
    
    });
})();