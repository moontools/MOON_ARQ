angular.module('mtlDriveapi')
    .directive('mtlDriveapi',function(){
    return {
        restrict: 'E',
        scope:{},
        link : function(scope, elem, attrs){
          
            var CLIENT_ID = '597261259365-0n3ee1mmra5lveal5a014233f4murqef.apps.googleusercontent.com';
            var SCOPES = 'https://www.googleapis.com/auth/drive';
            
            /**
             * Called when the client library is loaded to start the auth flow.
             */
            function handleClientLoad() {
              window.setTimeout(checkAuth, 1);
            }
            
            /**
            * Verifica se o usuário corrente autorizou a aplicação.
            */
            function checkAuth() {
             gapi.auth.authorize(
                 {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
                 handleAuthResult);
            }
            
            /**
            * Executado quando a autorização é efetuada com sucesso.
            *
            * @param {Object} authResult Retorno da autorização.
            */
            function handleAuthResult(authResult) {
                var authButton = document.getElementById('authorizeButton');
                var filePicker = document.getElementById('filePicker');
                authButton.style.display = 'none';
                filePicker.style.display = 'none';
                if (authResult && !authResult.error) {
                  // Access token has been successfully retrieved, requests can be sent to the API.
                  filePicker.style.display = 'block';
                  filePicker.onchange = uploadFile;

                } else {
                  // No access token could be retrieved, show the button to start the authorization flow.
                  authButton.style.display = 'block';
                  authButton.onclick = function() {
                      gapi.auth.authorize(
                          {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
                          handleAuthResult);
                  };
                }
            }
            
            /**
            * Inicial o upload do arquivo
            *
            * @param {Object} evt Argumentos do input
            */
            function uploadFile(evt) {
                gapi.client.load('drive', 'v2', function() {
                  var file = evt.target.files[0];
                  insertFile(file);
                });
            }
            
            /**
           * Insere novo arquivo
           *
           * @param {File} fileData Objeto arquivo a ser enviado
           * @param {Function} callback Função que é executada assim que o arquivos é enviado
           */
            function insertFile(fileData, callback) {
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
                }
            }
            
        }
    };        
});
