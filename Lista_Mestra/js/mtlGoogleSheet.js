/**
 * Módulo GoogleSheet
 * 
 * Criado para ser utilizado com o framework AngularJs,
 * Possibilita a manipulação dos dados de uma planilha no Google através de uma API Google Apps Script
 * 
 * Métodos disponíveis:
 * 
 * setSpreadSheetId -> Seta o id da planilha a ser manipulada
 * setSheetName -> Seta o nome da página a ser manipulada
 * insertRecord -> Permite inserir um novo registro na planilha
 * updateRecord -> Permite atualizar um registro existente na planilha
 * removeRecord -> Permite remover um registro da planilha
 * getRecord -> Permite resgatar um registro da planilha
 * getAllRecords -> Permite resgatar todos os registros da planilha
 * getColumnData -> Permite resgatar todos os dados de uma coluna da planilha
 * 
 * Considerações:
 * -> Cada método possui a sua documenteção detalhada
 * -> A api é executada com usuário sistema@moontools.com.br
 * 
 * Desenvolvedor: deividi@moontools.com.br (10/05/2015)
 * Moontools Sistemas 
 * Version: 1.00
 * Last update: 03/06/2015
 */

(function(){
    angular.module('mtl.googleSheet',[])
    
    // Constantes de configuração
    .constant('configGoogleSheet',{
        
        // Configuração das Urls
        urlDevApi : 'https://script.google.com/a/macros/moontools.com.br/s/AKfycbxstp_IrA2oAvOL1EltTm_ocpLW1p5_RcOPQrmKk54/dev',
        urlExecApi : 'https://script.google.com/macros/s/AKfycbw7H9p76DC7Racd0nPLIFQBumgAR3-SEL-F7YYCaTlfTHx3_88/exec'
    })
    
    /*
     * Factory Google Sheet
     * @param {object} $http Objeto para conexão com Backend 
     * @param {object} configGoogleSheet Objeto com configurações
     * @returns {object} Retorna o objeto GoogleSheet
     */
    .factory('googleSheet',function($http,configGoogleSheet){
        
        var _urlBaseApi = localStorage.development == "true"? configGoogleSheet.urlDevApi : configGoogleSheet.urlExecApi,
            _urlApi = '',
            _spreadSheetId = '',
            _sheetName ='';
        var googleSheet = {};

        /**
         * Seta o Id da planilha a ser manipulada pela API
         * @param {string} spreadSheetId Id da planilha do Google
         */
        googleSheet.setSpreadSheetId = function(spreadSheetId){
            _spreadSheetId = spreadSheetId;
            googleSheet.configParamsDefaults();
        };


        /**
         * Seta o nome da página a ser manipulada pela API
         * @param {string} sheetName Nome página
         */
        googleSheet.setSheetName = function(sheetName){
            _sheetName = sheetName;
            googleSheet.configParamsDefaults();
        };


        /**
         * Configura o url com algums parâmetros defaults
         */
        googleSheet.configParamsDefaults = function(){
            _urlApi = _urlBaseApi+"?callback=JSON_CALLBACK&spreadSheetId="+_spreadSheetId+"&sheetName="+_sheetName;
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
         * @param {string} column Coluna a ser pesquisada para encontrar o registro
         *                 EX: "linha","Código" ou pelo Cabeçalho de preferência
         * @param {string} value Valor a ser procurado
         * @param {function} callback Função a ser executada ao fim da requisição 
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
         * @param {string} column Coluna a ser pesquisada para encontrar o registro
         *                 EX: "linha","Código" ou pelo Cabeçalho de preferência
         * @param {string} value Valor a ser procurado
         * @param {string} sheetNameBackup Nome da página a ser feito o backup do registro
         *                 Obs: Passar null se não deseja fazer backup   
         * @param {function} callback Função a ser executada ao fim da requisição
         */
        googleSheet.updateRecord = function(record, column, value, sheetNameBackup, callback){
           var params = {
               metodo:"updateRecord",
               dados:record,
               type:column,
               value:value,
               sheetNameBackup : sheetNameBackup};
           googleSheet.request(params,callback); 
        };
        
        
        /**
         * Retorna um registro da planilha
         * @param {string} column Coluna a ser pesquisada
         *                 EX: "linha","Código" ou pelo Cabeçalho de preferência
         * @param {string} value Valor a ser procurado
         * @param {function} callback Função a ser executada ao fim da requisição
         */
        googleSheet.getRecord = function(column, value, callback){
           var params = {
               metodo:"getRecord",
               type:column,
               value:value};
           googleSheet.request(params,callback);
        };

        /**
         * Retorna todos os registros da planilha
         * @param {string} returnType Tipo do retorno esperado
         *                 Ex: "arrayAssociative" -> Para obter o retorno no formato de um array associativo
         *                 Ex: "array" -> Para objer o retorno no formato de um array normal
         * @param {function} callback Função a ser executada ao fim da requisição
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
         * Executa requisição para API do AppScript
         * @param {object} params Parâmetros que serão enviados para API
         * @param {function} callback Função
         */
        googleSheet.request = function(params,callback){
            $http({url:_urlApi,
                   method:"jsonp",
                   params:params
            }).success(function(data, status, headers, config){
               callback(data.data, data.status, data.message);
            }).error(function(data, status, headers, config){
                callback(data, false, status);
            })    

        };
        return googleSheet;

    });

})();

