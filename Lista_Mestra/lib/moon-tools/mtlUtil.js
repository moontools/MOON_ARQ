(function(){
    angular.module('mtl.util',[])
    
    /*
     * Serviço com funções utilitárias
     */
    .service('util',function(){
        
        /**
        * Normalizes a string, by removing all alphanumeric characters and using mixed case
        * to separate words. The output will always start with a lower case letter.
        * This function is designed to produce JavaScript object property names.
        *
        * Examples:
        *   "First Name" -> "firstName"
        *   "Market Cap (millions) -> "marketCapMillions
        *   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored" --> Isso foi mudado
        *
        * @param {string}      header: The header name to normalize.
        * @param {boolean} removeAlum: True para remover os caracteres especiais
        * @return {string} Normalized header.
        */
        this.normalizeHeaders = function(header, removeAlum){
            header = _removeAcentos(header);
            var key = "";
            var upperCase = false;
            for (var i = 0; i < header.length; ++i) {
              var letter = header[i];
              if (letter == " " && key.length > 0) {
                upperCase = true;
                continue;
              }
              if (removeAlum){
                if (!_isAlnum(letter)) {
                  continue;
                }
              }

              if (upperCase) {
                upperCase = false;
                key += letter.toUpperCase();
              } else {
                key += letter.toLowerCase();
              }
            }
            return key;    
        };
         
        /**
        * Tests if a character is alphanumeric.
        *
        * @param {string} char The character to test.
        * @return {boolean} True if the character char is alphanumeric, false otherwise.
        * @private
        */
        var _isAlnum = function(char) {
            return char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || isDigit(char);
        };
        
        /*
        * Essa função serve para trocar uma letra acentuada por uma letra sem acento.
        * @param {string} palavra: Palavra a ser modificada
        * @return {string} Retorna a palavra sem acento
        * @private
        */
        var _removeAcentos = function(palavra) {
            var com_acento = 'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÇ',
                sem_acento = 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC',
                nova = '';

            // Remove os caracteres especiais
            palavra = palavra.replace(/[&\/\\#,+\[\]ªº()$~%.'":*?<>{}-]/g,'');

            for ( var i = 0; i < palavra.length; i++ ) {
              if ( com_acento.search(palavra.substr(i,1) ) >=0 ) {
                nova += sem_acento.substr(com_acento.search(palavra.substr(i,1)), 1);
              }
              else {
                nova += palavra.substr(i,1);
              }
            }
            return nova;
        };
        
        // Captura os parâmetros da URL
        this.QueryString = function () {
            // Utilizar no Google App Scrip iFrame
            //var loc = document.referrer;
            //var query = decodeURIComponent(loc.split('?')[2]);

            // This function is anonymous, is executed immediately and 
            // the return value is assigned to QueryString!
            var query_string = {};
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
              var pair = vars[i].split("=");
                  // If first entry with this name
              if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURI(pair[1]);
                  // If second entry with this name
              } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], decodeURI(pair[1]) ];
                query_string[pair[0]] = arr;
                  // If third or later entry with this name
              } else {
                query_string[pair[0]].push(decodeURI(pair[1]));
              }
            } 
              return query_string;
        } ();
        
        this.removeDuplicates = function(array){
            var arrayReturn = [];
            for(var i in array){
                if(arrayReturn.indexOf(array[i]) === -1)
                   arrayReturn.push(array[i]);
            };
            return arrayReturn;
        };
        
  
    })
    /*
    * Diretiva para transformar todos os textos dos inputs em UpperCase
    */
   .directive('capitalize', function() {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {
           var capitalize = function(inputValue) {
              if(inputValue == undefined) inputValue = '';
              var capitalized = inputValue.toUpperCase();
              if(capitalized !== inputValue) {
                 modelCtrl.$setViewValue(capitalized);
                 modelCtrl.$render();
               }         
               return capitalized;
            };
            modelCtrl.$parsers.push(capitalize);
            capitalize(scope[attrs.ngModel]);  // capitalize initial value
        }
      };
   })
   
    /**
    * Diretiva para obter o arquivo dos inputs type file
    */
    .directive("fileread", [function () {
        return {
            restrict:"A",
            scope: {
               fileread: "="
            },
            link: function (scope, element, attr) {
                element.bind("change", function (changeEvent) {
                    scope.$apply(function () {
                        scope.fileread = changeEvent.target.files[0];
                    });
                    scope.$watch(scope.fileread,function(){
                        if(!scope.fileread){
                          element.empty();
                          element.val(null);
                        }
                    });
                });
            }
        };
    }]); 
})();